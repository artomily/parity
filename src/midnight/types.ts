// The private state a browser session holds locally. Two different actors read
// from it and neither one's values ever reach the ledger:
//   * the EMPLOYER supplies the whole payroll snapshot to `commitPayroll`;
//   * a WORKER supplies their own key, their own payslip values, and the
//     Merkle path proving their row is in the committed root.
export type ParityPrivateState = {
  readonly employerIds: Uint8Array[];
  readonly employerSalaries: bigint[];
  readonly employerGroupA: boolean[];
  readonly employerActive: boolean[];
  readonly employeeSecretKey: Uint8Array;
  readonly employeeSalary: bigint;
  readonly employeeIsGroupA: boolean;
  readonly merkleSiblings: Uint8Array[];
  readonly merklePathIndices: boolean[];
  /** What the employer actually filed for this worker — only used to dispute. */
  readonly employerClaimedRecordHash: Uint8Array;
};
