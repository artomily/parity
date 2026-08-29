// Deploys a new Parity filing contract, or joins one already deployed at a
// known address. Both run entirely from the browser via the connected wallet.
import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import type { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { parityCompiledContract } from "../utils/contract.js";
import type { ParityProviders } from "./providers.js";
import type { ParityPrivateState } from "./types.js";

const PRIVATE_STATE_ID = "parityPrivateState";

export async function deployFiling(
  providers: ParityProviders,
  reportingPeriod: Uint8Array,
  jobCategory: Uint8Array,
  initialPrivateState: ParityPrivateState,
) {
  return deployContract(providers, {
    compiledContract: parityCompiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
    args: [reportingPeriod, jobCategory],
  });
}

export async function joinFiling(
  providers: ParityProviders,
  contractAddress: ContractAddress,
  initialPrivateState: ParityPrivateState,
) {
  return findDeployedContract(providers, {
    contractAddress,
    compiledContract: parityCompiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });
}

export { PRIVATE_STATE_ID };
