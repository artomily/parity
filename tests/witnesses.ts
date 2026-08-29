// Private state + witness implementations for the Parity contract.
//
// Two different actors read from this same private state, and neither one's
// values ever reach the ledger:
//   * the EMPLOYER supplies the whole payroll snapshot to `commitPayroll`;
//   * a WORKER supplies their own key, their own payslip values, and the
//     Merkle path proving their row is in the committed root.

import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "../managed/contract/index.js";

export type ParityPrivateState = {
  // Employer side — the payroll snapshot.
  readonly employerIds: Uint8Array[];
  readonly employerSalaries: bigint[];
  readonly employerGroupA: boolean[];
  readonly employerActive: boolean[];
  // Worker side — one worker's own identity and payslip.
  readonly employeeSecretKey: Uint8Array;
  readonly employeeSalary: bigint;
  readonly employeeIsGroupA: boolean;
  readonly merkleSiblings: Uint8Array[];
  readonly merklePathIndices: boolean[];
  /** What the employer actually filed for this worker — only used to dispute. */
  readonly employerClaimedRecordHash: Uint8Array;
};

const w = <T>(f: (s: ParityPrivateState) => T) =>
  ({ privateState }: WitnessContext<Ledger, ParityPrivateState>): [ParityPrivateState, T] =>
    [privateState, f(privateState)];

// None of these mutate private state; they only expose it to the circuit.
export const witnesses = {
  employerIds: w((s) => s.employerIds),
  employerSalaries: w((s) => s.employerSalaries),
  employerGroupA: w((s) => s.employerGroupA),
  employerActive: w((s) => s.employerActive),
  employeeSecretKey: w((s) => s.employeeSecretKey),
  employeeSalary: w((s) => s.employeeSalary),
  employeeIsGroupA: w((s) => s.employeeIsGroupA),
  merkleSiblings: w((s) => s.merkleSiblings),
  merklePathIndices: w((s) => s.merklePathIndices),
  employerClaimedRecordHash: w((s) => s.employerClaimedRecordHash),
};
