import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import type { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import {
  findWallet,
  friendlyError,
  buildProviders,
  type ParityProviders,
  type TxPhase,
} from "../midnight/providers.js";
import { deployFiling, joinFiling, PRIVATE_STATE_ID } from "../midnight/deploy.js";
import { ledger, type Ledger } from "../../managed/contract/index.js";
import { PayrollTree, honestFiling, tamperedFiling } from "../utils/filing.js";

const NETWORK_ID = (import.meta.env.VITE_NETWORK_ID as string) ?? "preprod";
const DEFAULT_CONTRACT = (import.meta.env.VITE_CONTRACT_ADDRESS as string) ?? "";

// Must run before any wallet or contract operation (deploy, join, connect).
setNetworkId(NETWORK_ID);

export type WalletState = "detecting" | "no-wallet" | "ready" | "connecting" | "connected";
export type FilingMode = "honest" | "tampered";

/** The transaction the user is waiting on, from proof generation to finality. */
export type TxProgress = {
  action: string;
  phase: TxPhase | "confirmed" | "failed";
  txId?: string;
  startedAt: number;
};

type FoundParityContract = Awaited<ReturnType<typeof joinFiling>>;

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>("detecting");
  const [walletAPI, setWalletAPI] = useState<InitialAPI | undefined>();
  const [, setConnectedAPI] = useState<ConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_CONTRACT);
  const [ledgerState, setLedgerState] = useState<Ledger | null>(null);

  // Which payroll the employer files: the truth, or a version with one row
  // edited to flatter the gap. The whole point of the product is that the
  // second one cannot survive worker confirmation.
  const [filingMode, setFilingMode] = useState<FilingMode>("honest");
  const [workerIndex, setWorkerIndex] = useState(0);

  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ txId: string } | null>(null);
  const [progress, setProgress] = useState<TxProgress | null>(null);

  const providersRef = useRef<ParityProviders | null>(null);
  const contractRef = useRef<FoundParityContract | null>(null);

  const tree = useMemo(
    () => new PayrollTree(filingMode === "honest" ? honestFiling() : tamperedFiling()),
    [filingMode],
  );

  // Poll for the wallet extension for up to 5s.
  useEffect(() => {
    const found = findWallet();
    if (found) {
      setWalletAPI(found);
      setWalletState("ready");
      return;
    }
    let elapsed = 0;
    const t = setInterval(() => {
      elapsed += 100;
      const w = findWallet();
      if (w) {
        setWalletAPI(w);
        setWalletState("ready");
        clearInterval(t);
      } else if (elapsed >= 5_000) {
        setWalletState("no-wallet");
        clearInterval(t);
      }
    }, 100);
    return () => clearInterval(t);
  }, []);

  const connect = useCallback(async () => {
    if (!walletAPI) return;
    setWalletState("connecting");
    setError(null);
    try {
      const api = await walletAPI.connect(NETWORK_ID);
      const { unshieldedAddress } = await api.getUnshieldedAddress();
      setConnectedAPI(api);
      setAddress(unshieldedAddress);
      setWalletState("connected");
      providersRef.current = await buildProviders(api, (phase, txId) =>
        setProgress((p) => (p ? { ...p, phase, txId: txId ?? p.txId } : p)),
      );
    } catch (e) {
      setError(friendlyError(e));
      setWalletState("ready");
    }
  }, [walletAPI]);

  const disconnect = useCallback(() => {
    setConnectedAPI(null);
    setAddress(null);
    setWalletState("ready");
    providersRef.current = null;
    contractRef.current = null;
    setContractAddress(DEFAULT_CONTRACT);
    setLedgerState(null);
    setLastResult(null);
    setProgress(null);
  }, []);

  const refreshLedger = useCallback(async () => {
    const providers = providersRef.current;
    if (!providers || !contractAddress) return;
    const state = await providers.publicDataProvider.queryContractState(contractAddress);
    if (state) setLedgerState(ledger(state.data));
  }, [contractAddress]);

  useEffect(() => {
    if (walletState === "connected" && contractAddress) void refreshLedger();
  }, [walletState, contractAddress, refreshLedger]);

  /** Swap the local private state to the actor about to prove, then run `fn`. */
  const runAs = useCallback(
    async (label: string, state: unknown, fn: (c: FoundParityContract) => Promise<{ public: { txId: string } }>) => {
      const providers = providersRef.current;
      if (!providers || !contractAddress) return;
      setBusy(label);
      setError(null);
      setLastResult(null);
      setProgress({ action: label, phase: "proving", startedAt: Date.now() });
      try {
        if (!contractRef.current) {
          contractRef.current = await joinFiling(providers, contractAddress, state as never);
        } else {
          await providers.privateStateProvider.set(PRIVATE_STATE_ID, state as never);
        }
        const result = await fn(contractRef.current);
        setLastResult({ txId: result.public.txId });
        setProgress((p) => (p ? { ...p, phase: "confirmed", txId: result.public.txId } : p));
        await refreshLedger();
      } catch (e) {
        setProgress((p) => (p ? { ...p, phase: "failed" } : p));
        setError(friendlyError(e));
      } finally {
        setBusy(null);
      }
    },
    [contractAddress, refreshLedger],
  );

  const deploy = useCallback(async () => {
    if (!providersRef.current) return;
    setBusy("Deploying filing contract…");
    setError(null);
    setLastResult(null);
    setProgress({ action: "Deploying filing contract…", phase: "proving", startedAt: Date.now() });
    try {
      const period = crypto.getRandomValues(new Uint8Array(32));
      const category = crypto.getRandomValues(new Uint8Array(32));
      const deployed = await deployFiling(
        providersRef.current,
        period,
        category,
        tree.employerState(),
      );
      contractRef.current = deployed;
      setContractAddress(deployed.deployTxData.public.contractAddress);
      const txId = deployed.deployTxData.public.txId;
      setLastResult({ txId });
      setProgress((p) => (p ? { ...p, phase: "confirmed", txId } : p));
    } catch (e) {
      setProgress((p) => (p ? { ...p, phase: "failed" } : p));
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }, [tree]);

  const join = useCallback(
    async (addr: ContractAddress) => {
      if (!providersRef.current) return;
      setBusy("Joining filing…");
      setError(null);
      try {
        const found = await joinFiling(providersRef.current, addr, tree.employerState());
        contractRef.current = found;
        setContractAddress(addr);
      } catch (e) {
        setError(friendlyError(e));
      } finally {
        setBusy(null);
      }
    },
    [tree],
  );

  const commitPayroll = useCallback(
    () =>
      runAs("Proving aggregates & committing payroll…", tree.employerState(), (c) =>
        c.callTx.commitPayroll(),
      ),
    [runAs, tree],
  );

  const confirmRecord = useCallback(
    (index: number) =>
      runAs("Proving your record matches your payslip…", tree.workerState(index), (c) =>
        c.callTx.confirmRecord(),
      ),
    [runAs, tree],
  );

  const disputeRecord = useCallback(
    (index: number) =>
      runAs("Proving the filed record differs from your payslip…", tree.workerState(index), (c) =>
        c.callTx.disputeRecord(),
      ),
    [runAs, tree],
  );

  return {
    walletState,
    address,
    error,
    setError,
    connect,
    disconnect,
    contractAddress,
    setContractAddress,
    ledgerState,
    refreshLedger,
    deploy,
    join,
    commitPayroll,
    confirmRecord,
    disputeRecord,
    busy,
    lastResult,
    progress,
    filingMode,
    setFilingMode,
    workerIndex,
    setWorkerIndex,
    tree,
  };
}
