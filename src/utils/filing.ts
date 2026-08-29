// The demo workforce, and the payroll Merkle tree the contract commits to.
//
// The tree is built with the contract's own compiled `pureCircuits`, so it uses
// exactly the hash functions the circuit checks against — never a
// reimplementation that could quietly drift out of sync.
//
// Everything here is data the EMPLOYER holds. Note what it does not contain:
// worker secret keys. The employer commits `idCommitment(sk)`, and each worker
// rebuilds their own leaf locally from their own key and their own payslip.
import { pureCircuits } from "../../managed/contract/index.js";
import type { ParityPrivateState } from "../midnight/types.js";

export const TREE_DEPTH = 4;
export const TREE_SIZE = 1 << TREE_DEPTH; // 16 records per filing

export type Worker = {
  readonly name: string;
  readonly key: Uint8Array;
  /** What this worker is actually paid, per their own payslip. */
  readonly salary: bigint;
  readonly isGroupA: boolean;
};

const key = (seed: number): Uint8Array => {
  const b = new Uint8Array(32);
  b.fill(seed & 0xff);
  b[0] = seed & 0xff;
  b[31] = (seed >> 8) & 0xff;
  return b;
};

/** Ten workers in one job category — five per pay group, both above the
 *  contract's minimum publishable group size. */
export const WORKFORCE: Worker[] = [
  { name: "Worker 01", key: key(1), salary: 50_000n, isGroupA: true },
  { name: "Worker 02", key: key(2), salary: 52_000n, isGroupA: true },
  { name: "Worker 03", key: key(3), salary: 54_000n, isGroupA: true },
  { name: "Worker 04", key: key(4), salary: 56_000n, isGroupA: true },
  { name: "Worker 05", key: key(5), salary: 58_000n, isGroupA: true },
  { name: "Worker 06", key: key(6), salary: 60_000n, isGroupA: false },
  { name: "Worker 07", key: key(7), salary: 62_000n, isGroupA: false },
  { name: "Worker 08", key: key(8), salary: 64_000n, isGroupA: false },
  { name: "Worker 09", key: key(9), salary: 66_000n, isGroupA: false },
  { name: "Worker 10", key: key(10), salary: 68_000n, isGroupA: false },
];

/** A filed row: what the employer says about a worker. Usually the truth. */
export type FiledRow = { salary: bigint; isGroupA: boolean; active: boolean };

/** The honest filing: every row matches the worker's real payslip. */
export const honestFiling = (): FiledRow[] =>
  WORKFORCE.map((w) => ({ salary: w.salary, isGroupA: w.isGroupA, active: true }));

/** A tampered filing: one worker's pay is filed higher than it really is, to
 *  flatter the published gap. This is the case the coverage figure catches. */
export const tamperedFiling = (index = 0, salary = 70_000n): FiledRow[] => {
  const rows = honestFiling();
  rows[index] = { ...rows[index], salary };
  return rows;
};

export class PayrollTree {
  readonly leaves: Uint8Array[];
  private readonly levels: Uint8Array[][];

  constructor(readonly rows: FiledRow[]) {
    const padded: FiledRow[] = [...rows];
    while (padded.length < TREE_SIZE) {
      padded.push({ salary: 0n, isGroupA: false, active: false });
    }
    this.rows = padded;
    this.leaves = padded.map((r, i) =>
      pureCircuits.slotLeaf(
        r.active,
        r.active ? pureCircuits.idCommitment(WORKFORCE[i].key) : new Uint8Array(32),
        r.salary,
        r.isGroupA,
      ),
    );
    const levels: Uint8Array[][] = [this.leaves];
    let current = this.leaves;
    for (let d = 0; d < TREE_DEPTH; d++) {
      const next: Uint8Array[] = [];
      for (let j = 0; j < current.length / 2; j++) {
        next.push(pureCircuits.hashNode(current[2 * j], current[2 * j + 1]));
      }
      levels.push(next);
      current = next;
    }
    this.levels = levels;
  }

  get root(): Uint8Array {
    return this.levels[TREE_DEPTH][0];
  }

  proofFor(index: number): { siblings: Uint8Array[]; indices: boolean[] } {
    const siblings: Uint8Array[] = [];
    const indices: boolean[] = [];
    let pos = index;
    for (let d = 0; d < TREE_DEPTH; d++) {
      const level = this.levels[d];
      const isRight = (pos & 1) === 1;
      siblings.push(level[isRight ? pos - 1 : pos + 1]);
      indices.push(isRight);
      pos = pos >> 1;
    }
    return { siblings, indices };
  }

  /** Private state for the employer: the whole snapshot, no worker values. */
  employerState(): ParityPrivateState {
    return {
      employerIds: this.rows.map((r, i) =>
        r.active ? pureCircuits.idCommitment(WORKFORCE[i].key) : new Uint8Array(32),
      ),
      employerSalaries: this.rows.map((r) => r.salary),
      employerGroupA: this.rows.map((r) => r.isGroupA),
      employerActive: this.rows.map((r) => r.active),
      employeeSecretKey: new Uint8Array(32),
      employeeSalary: 0n,
      employeeIsGroupA: false,
      merkleSiblings: [],
      merklePathIndices: [],
      employerClaimedRecordHash: new Uint8Array(32),
    };
  }

  /** Private state for a worker: their own key and their own REAL payslip —
   *  which is what makes a tampered filing fail their confirmation. */
  workerState(index: number): ParityPrivateState {
    const proof = this.proofFor(index);
    const w = WORKFORCE[index];
    const filed = this.rows[index];
    return {
      ...this.employerState(),
      employeeSecretKey: w.key,
      employeeSalary: w.salary,
      employeeIsGroupA: w.isGroupA,
      merkleSiblings: proof.siblings,
      merklePathIndices: proof.indices,
      // What the employer actually filed — needed only to raise a dispute.
      employerClaimedRecordHash: pureCircuits.recordHash(filed.salary, filed.isGroupA),
    };
  }

  /** Does the filed row for this worker match their real payslip? */
  filingMatches(index: number): boolean {
    const filed = this.rows[index];
    const w = WORKFORCE[index];
    return filed.salary === w.salary && filed.isGroupA === w.isGroupA;
  }
}

/** The reported gap, derived from the public aggregates the contract published. */
export const payGap = (aSum: bigint, aCount: bigint, bSum: bigint, bCount: bigint): number => {
  if (aCount === 0n || bCount === 0n) return 0;
  const avgA = Number(aSum) / Number(aCount);
  const avgB = Number(bSum) / Number(bCount);
  if (avgB === 0) return 0;
  return ((avgB - avgA) / avgB) * 100;
};
