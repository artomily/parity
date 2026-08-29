// Parity contract unit tests.
//
// These run the *compiled* circuits through the in-memory simulator, so they
// exercise the real ledger logic (in-circuit aggregation, the Merkle record
// check, the coverage counters, the nullifier set, and every assert) exactly as
// they would on-chain, but without a proof server.

import { describe, it, expect } from "vitest";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { pureCircuits } from "../managed/contract/index.js";
import { ParitySimulator } from "./parity-simulator.js";
import { PayrollTree, TREE_SIZE, emptySlot, type PayrollRecord } from "./payroll.js";
import type { ParityPrivateState } from "./witnesses.js";

setNetworkId("undeployed");

// Deterministic, distinct 32-byte values for repeatable tests.
const bytes = (seed: number): Uint8Array => {
  const b = new Uint8Array(32);
  b.fill(seed & 0xff);
  b[0] = seed & 0xff;
  b[31] = (seed >> 8) & 0xff;
  return b;
};

const PERIOD = bytes(2026);
const CATEGORY = bytes(77);

// Ten workers in one job category: five in group A, five in group B — both
// comfortably above the contract's minimum publishable group size. Salaries are
// chosen so that no individual value coincides with any aggregate, which lets
// the privacy test below assert on exact numbers.
const WORKERS = [
  { key: bytes(1), salary: 50_000n, isGroupA: true },
  { key: bytes(2), salary: 52_000n, isGroupA: true },
  { key: bytes(3), salary: 54_000n, isGroupA: true },
  { key: bytes(4), salary: 56_000n, isGroupA: true },
  { key: bytes(5), salary: 58_000n, isGroupA: true },
  { key: bytes(6), salary: 60_000n, isGroupA: false },
  { key: bytes(7), salary: 62_000n, isGroupA: false },
  { key: bytes(8), salary: 64_000n, isGroupA: false },
  { key: bytes(9), salary: 66_000n, isGroupA: false },
  { key: bytes(10), salary: 68_000n, isGroupA: false },
];
const GROUP_A_SUM = 270_000n; // 50+52+54+56+58
const GROUP_B_SUM = 320_000n; // 60+62+64+66+68

/** Build a payroll snapshot, optionally filing a different salary for a worker. */
const buildPayroll = (tamper?: { index: number; salary: bigint }): PayrollTree => {
  const records: PayrollRecord[] = WORKERS.map((w, i) => ({
    idCommitment: pureCircuits.idCommitment(w.key),
    salary: tamper?.index === i ? tamper.salary : w.salary,
    isGroupA: w.isGroupA,
    active: true,
  }));
  while (records.length < TREE_SIZE) records.push(emptySlot());
  return new PayrollTree(records);
};

/** Private state for the employer: the whole snapshot, no worker values. */
const asEmployer = (tree: PayrollTree): ParityPrivateState => ({
  employerIds: tree.ids,
  employerSalaries: tree.salaries,
  employerGroupA: tree.groupA,
  employerActive: tree.active,
  employeeSecretKey: new Uint8Array(32),
  employeeSalary: 0n,
  employeeIsGroupA: false,
  merkleSiblings: [],
  merklePathIndices: [],
  employerClaimedRecordHash: new Uint8Array(32),
});

/** Private state for a worker: their own key and their own REAL payslip. */
const asWorker = (tree: PayrollTree, index: number): ParityPrivateState => {
  const proof = tree.proofFor(index);
  const w = WORKERS[index];
  return {
    ...asEmployer(tree),
    employeeSecretKey: w.key,
    employeeSalary: w.salary,
    employeeIsGroupA: w.isGroupA,
    merkleSiblings: proof.siblings,
    merklePathIndices: proof.indices,
    employerClaimedRecordHash: tree.records[index].idCommitment, // overridden per test
  };
};

const committed = (tamper?: { index: number; salary: bigint }) => {
  const tree = buildPayroll(tamper);
  const sim = new ParitySimulator(asEmployer(tree), PERIOD, CATEGORY);
  sim.commitPayroll();
  return { tree, sim };
};

describe("Parity — verifiable pay-gap reporting", () => {
  it("publishes aggregates computed in-circuit from the committed snapshot", () => {
    const { tree, sim } = committed();
    const led = sim.getLedger();

    expect(led.payrollCommitted).toBe(true);
    expect([...led.payrollRoot]).toEqual([...tree.root]);
    // The figures are the ones the private snapshot actually implies — the
    // employer had no opportunity to publish a different set.
    expect(led.groupAPaySum).toBe(GROUP_A_SUM);
    expect(led.groupBPaySum).toBe(GROUP_B_SUM);
    expect(led.groupACount).toBe(5n);
    expect(led.groupBCount).toBe(5n);
    expect(led.committedCount).toBe(10n);
  });

  it("never exposes an individual salary in public ledger state", () => {
    const { sim } = committed();
    const led = sim.getLedger();

    // Every scalar the ledger exposes, collected exhaustively.
    const publicScalars = [
      led.groupAPaySum, led.groupBPaySum,
      led.groupACount, led.groupBCount, led.committedCount,
      led.confirmations, led.disputes,
    ];
    for (const w of WORKERS) {
      expect(publicScalars).not.toContain(w.salary);
    }
    // Only aggregates survive — and they are not attributable to anyone.
    expect(publicScalars).toContain(GROUP_A_SUM);
  });

  it("lets a worker confirm the record filed under their identity", () => {
    const { tree, sim } = committed();
    expect(sim.getLedger().confirmations).toBe(0n);

    sim.as(asWorker(tree, 0));
    const led = sim.confirmRecord();

    expect(led.confirmations).toBe(1n);
    expect(led.disputes).toBe(0n);
    // The confirmation is a bare count: it records that someone confirmed,
    // never who, and never which pay group they belong to.
    expect(led.nullifiers.size()).toBe(1n);
    expect(led.nullifiers.member(ParitySimulator.nullifierFor(PERIOD, WORKERS[0].key))).toBe(true);
  });

  it("counts coverage across many workers without linking any of them", () => {
    const { tree, sim } = committed();
    for (let i = 0; i < 7; i++) {
      sim.as(asWorker(tree, i));
      sim.confirmRecord();
    }
    const led = sim.getLedger();
    // 10 records committed, 7 independently attested — the coverage figure the
    // whole product turns on. The 3 unconfirmed rows are visible as a gap.
    expect(led.committedCount).toBe(10n);
    expect(led.confirmations).toBe(7n);
  });

  it("rejects a second action from the same worker in the same period", () => {
    const { tree, sim } = committed();
    sim.as(asWorker(tree, 0));
    sim.confirmRecord();
    expect(() => sim.confirmRecord()).toThrow(/already acted/);
    expect(sim.getLedger().confirmations).toBe(1n);
  });

  it("refuses confirmation when the employer filed a different salary", () => {
    // The employer files 70,000 for worker 0, who was actually paid 50,000.
    const { tree, sim } = committed({ index: 0, salary: 70_000n });
    sim.as(asWorker(tree, 0));
    // Worker 0 checks their own payslip against the filing, and it does not match.
    expect(() => sim.confirmRecord()).toThrow(/does not match/);
    expect(sim.getLedger().confirmations).toBe(0n);
  });

  it("lets that worker prove the mismatch instead, without revealing either figure", () => {
    const { tree, sim } = committed({ index: 0, salary: 70_000n });
    sim.as({
      ...asWorker(tree, 0),
      // What the employer actually filed — the worker can see the hash without
      // anyone learning the real pay behind it.
      employerClaimedRecordHash: pureCircuits.recordHash(70_000n, true),
    });
    const led = sim.disputeRecord();

    expect(led.disputes).toBe(1n);
    expect(led.confirmations).toBe(0n);
    // The tampered figure is still not on-chain: only that a dispute exists.
    expect([led.groupAPaySum, led.groupBPaySum]).not.toContain(70_000n);
  });

  it("refuses a dispute when the filed record does match the payslip", () => {
    const { tree, sim } = committed();
    sim.as({
      ...asWorker(tree, 0),
      employerClaimedRecordHash: pureCircuits.recordHash(WORKERS[0].salary, true),
    });
    expect(() => sim.disputeRecord()).toThrow(/nothing to dispute/);
  });

  it("refuses to publish an aggregate small enough to identify its members", () => {
    // Only two workers in group B — below the contract's minimum.
    const records: PayrollRecord[] = WORKERS.slice(0, 7).map((w) => ({
      idCommitment: pureCircuits.idCommitment(w.key),
      salary: w.salary,
      isGroupA: w.isGroupA,
      active: true,
    }));
    while (records.length < TREE_SIZE) records.push(emptySlot());
    const tree = new PayrollTree(records);
    const sim = new ParitySimulator(asEmployer(tree), PERIOD, CATEGORY);
    expect(() => sim.commitPayroll()).toThrow(/too small/);
  });

  it("rejects committing a payroll twice for the same filing", () => {
    const { sim } = committed();
    expect(() => sim.commitPayroll()).toThrow(/already committed/);
  });
});
