// A lightweight in-memory harness that runs the compiled Parity circuits
// without a proof server or a live network, so unit tests stay fast and offline.

import {
  type CircuitContext,
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import { Contract, type Ledger, ledger, pureCircuits } from "../managed/contract/index.js";
import { type ParityPrivateState, witnesses } from "./witnesses.js";

export class ParitySimulator {
  readonly contract: Contract<ParityPrivateState>;
  circuitContext: CircuitContext<ParityPrivateState>;

  constructor(privateState: ParityPrivateState, period: Uint8Array, category: Uint8Array) {
    this.contract = new Contract<ParityPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext(privateState, "0".repeat(64)),
        period,
        category,
      );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  /** Step into a different actor — the employer, or a specific worker. */
  public as(privateState: ParityPrivateState): void {
    this.circuitContext.currentPrivateState = privateState;
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public commitPayroll(): Ledger {
    this.circuitContext = this.contract.impureCircuits.commitPayroll(this.circuitContext).context;
    return this.getLedger();
  }

  public confirmRecord(): Ledger {
    this.circuitContext = this.contract.impureCircuits.confirmRecord(this.circuitContext).context;
    return this.getLedger();
  }

  public disputeRecord(): Ledger {
    this.circuitContext = this.contract.impureCircuits.disputeRecord(this.circuitContext).context;
    return this.getLedger();
  }

  /** The nullifier a given (period, key) pair would publish. */
  public static nullifierFor(period: Uint8Array, sk: Uint8Array): Uint8Array {
    return pureCircuits.deriveNullifier(period, sk);
  }
}
