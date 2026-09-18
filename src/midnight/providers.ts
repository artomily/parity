// Assembles the Midnight.js providers needed to deploy/join the Parity
// contract and call its circuits from the browser, plus wallet
// detection/connection helpers for the Lace wallet.
import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import {
  createProofProvider,
  type MidnightProviders,
  type UnboundTransaction,
} from "@midnight-ntwrk/midnight-js-types";
import { toHex, fromHex } from "@midnight-ntwrk/midnight-js-utils";
import { Transaction, type FinalizedTransaction } from "@midnight-ntwrk/ledger-v8";
import { InMemoryPrivateStateProvider } from "./in-memory-private-state-provider.js";
import type { ParityCircuitId } from "../utils/contract.js";
import type { ParityPrivateState } from "./types.js";

export type ParityProviders = MidnightProviders<ParityCircuitId, string, ParityPrivateState>;

/** Where a transaction is in its life, reported as the providers are called. */
export type TxPhase = "proving" | "signing" | "submitted";

/** Finds the Lace wallet under `window.midnight`, preferring it over other
 * injected Midnight wallets (e.g. 1AM) that may register first. */
export function findWallet(): InitialAPI | undefined {
  const midnight = (window as unknown as { midnight?: Record<string, unknown> }).midnight;
  if (!midnight) return undefined;
  const candidates = Object.values(midnight).filter(
    (w): w is InitialAPI => !!w && typeof w === "object" && "apiVersion" in w,
  );
  const lace = candidates.find((w) => (w as { name?: string }).name?.toLowerCase() === "lace");
  return lace ?? candidates[0];
}

/** Turns SDK/wallet errors into a short, user-facing message. */
export function friendlyError(e: unknown): string {
  const msg = extractErrorMessage(e);
  if (msg.includes("User rejected") || msg.includes("rejected")) return "Wallet request was rejected.";
  if (msg.includes("does not match")) {
    return "The filed record does not match this payslip. You can raise a dispute instead — it proves the mismatch without revealing either figure.";
  }
  if (msg.includes("already acted")) return "This worker has already confirmed or disputed this filing.";
  if (msg.includes("nothing to dispute")) return "The filed record matches this payslip, so there is nothing to dispute.";
  if (msg.includes("too small")) return "A pay group is below the minimum publishable size — the aggregate would identify its members.";
  if (msg.includes("already committed")) return "This filing has already committed its payroll snapshot.";
  if (msg.includes("No payroll has been committed")) return "The employer has not committed a payroll snapshot yet.";
  if (msg.includes("No record under this identity")) return "No record is filed under this identity in the committed payroll.";
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Could not reach the proof server or indexer. If your wallet uses a local proof server, make sure it's running.";
  }
  if (msg.includes("mismatched verifier keys")) return "Contract version mismatch — this frontend doesn't match the deployed contract.";
  return msg || "An unexpected error occurred. Check the browser console for details.";
}

function extractErrorMessage(e: unknown): string {
  if (!e) return "";
  const err = e as { message?: string; cause?: { message?: string; failure?: { message?: string } } };
  if (err.message) return err.message;
  if (err.cause?.failure?.message) return err.cause.failure.message;
  if (err.cause?.message) return err.cause.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export type WalletConfig = {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri?: string;
  networkId: string;
};

/**
 * Builds the providers object for the given connected wallet. Proving prefers
 * the wallet's own delegated prover (`getProvingProvider`, no local Docker
 * needed) and only falls back to a local HTTP proof server
 * (`proverServerUri`, e.g. `http://localhost:6300`) for older wallets that
 * don't yet support delegation.
 */
export async function buildProviders(
  connectedAPI: ConnectedAPI,
  onPhase: (phase: TxPhase, txId?: string) => void = () => {},
): Promise<ParityProviders> {
  const config = await connectedAPI.getConfiguration();
  const zkConfigProvider = new FetchZkConfigProvider<ParityCircuitId>(
    window.location.origin,
    fetch.bind(window),
  );

  let proofProvider;
  try {
    const provingProvider = await connectedAPI.getProvingProvider(
      zkConfigProvider.asKeyMaterialProvider(),
    );
    proofProvider = createProofProvider(provingProvider);
  } catch {
    if (!config.proverServerUri) {
      throw new Error(
        "This wallet doesn't support delegated proving and provided no proof server URL. " +
          "Run a local proof server (docker run -p 6300:6300 midnightntwrk/proof-server) and configure it in your wallet.",
      );
    }
    proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);
  }

  const prove = proofProvider.proveTx.bind(proofProvider);
  proofProvider.proveTx = (tx, cfg) => {
    onPhase("proving");
    return prove(tx, cfg);
  };

  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await connectedAPI.getShieldedAddresses();

  return {
    privateStateProvider: new InMemoryPrivateStateProvider<ParityPrivateState>(),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    zkConfigProvider,
    proofProvider,
    walletProvider: {
      getCoinPublicKey: () => shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shieldedEncryptionPublicKey,
      balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
        onPhase("signing");
        const { tx: balanced } = await connectedAPI.balanceUnsealedTransaction(
          toHex(tx.serialize()),
        );
        return Transaction.deserialize("signature", "proof", "binding", fromHex(balanced));
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction) => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txId = tx.identifiers()[0];
        onPhase("submitted", txId);
        return txId;
      },
    },
  } as ParityProviders;
}
