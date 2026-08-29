// Builds the off-chain payroll Merkle tree that `payrollRoot` commits to, using
// the contract's own compiled `pureCircuits` — so the tree is built with
// exactly the hash functions the circuit checks against, never a
// reimplementation that could quietly drift out of sync.

import { pureCircuits } from "../managed/contract/index.js";

export const TREE_DEPTH = 4;
export const TREE_SIZE = 1 << TREE_DEPTH; // 16 records per filing

/** One row of the employer's committed payroll snapshot. */
export type PayrollRecord = {
  /** Commitment to the worker's identity key — NOT the key itself. The
   *  employer never holds employee secrets, only their commitments. */
  readonly idCommitment: Uint8Array;
  readonly salary: bigint;
  readonly isGroupA: boolean;
  readonly active: boolean;
};

export type MerkleProof = {
  readonly siblings: Uint8Array[];
  readonly indices: boolean[];
};

/** An unused slot: no identity, no pay, hashed to the empty-leaf constant. */
export const emptySlot = (): PayrollRecord => ({
  idCommitment: new Uint8Array(32),
  salary: 0n,
  isGroupA: false,
  active: false,
});

export class PayrollTree {
  private readonly levels: Uint8Array[][];

  constructor(readonly records: PayrollRecord[]) {
    if (records.length !== TREE_SIZE) {
      throw new Error(`PayrollTree requires exactly ${TREE_SIZE} slots, got ${records.length}`);
    }
    const leaves = records.map((r) =>
      pureCircuits.slotLeaf(r.active, r.idCommitment, r.salary, r.isGroupA),
    );
    const levels: Uint8Array[][] = [leaves];
    let current = leaves;
    for (let depth = 0; depth < TREE_DEPTH; depth++) {
      const next: Uint8Array[] = [];
      for (let j = 0; j < current.length / 2; j++) {
        next.push(pureCircuits.hashNode(current[2 * j], current[2 * j + 1]));
      }
      levels.push(next);
      current = next;
    }
    this.levels = levels; // levels[0] = leaves, levels[TREE_DEPTH] = [root]
  }

  get root(): Uint8Array {
    return this.levels[TREE_DEPTH][0];
  }

  /** The sibling path + left/right directions for the record at `index`. */
  proofFor(index: number): MerkleProof {
    const siblings: Uint8Array[] = [];
    const indices: boolean[] = [];
    let pos = index;
    for (let depth = 0; depth < TREE_DEPTH; depth++) {
      const level = this.levels[depth];
      const isRightChild = (pos & 1) === 1;
      siblings.push(level[isRightChild ? pos - 1 : pos + 1]);
      indices.push(isRightChild);
      pos = pos >> 1;
    }
    return { siblings, indices };
  }

  /** Column projections, in the shape the employer's witnesses return. */
  get ids(): Uint8Array[] { return this.records.map((r) => r.idCommitment); }
  get salaries(): bigint[] { return this.records.map((r) => r.salary); }
  get groupA(): boolean[] { return this.records.map((r) => r.isGroupA); }
  get active(): boolean[] { return this.records.map((r) => r.active); }
}
