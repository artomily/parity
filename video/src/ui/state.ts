// The exact demo data the real app ships with (src/utils/filing.ts), restated
// here as plain numbers so the video renders the same figures a viewer would
// see in the live app rather than invented ones.

export type Worker = { name: string; salary: number; isGroupA: boolean };

export const WORKFORCE: Worker[] = [
  { name: "Worker 01", salary: 50_000, isGroupA: true },
  { name: "Worker 02", salary: 52_000, isGroupA: true },
  { name: "Worker 03", salary: 54_000, isGroupA: true },
  { name: "Worker 04", salary: 56_000, isGroupA: true },
  { name: "Worker 05", salary: 58_000, isGroupA: true },
  { name: "Worker 06", salary: 60_000, isGroupA: false },
  { name: "Worker 07", salary: 62_000, isGroupA: false },
  { name: "Worker 08", salary: 64_000, isGroupA: false },
  { name: "Worker 09", salary: 66_000, isGroupA: false },
  { name: "Worker 10", salary: 68_000, isGroupA: false },
];

/** Same formula as the product: the gap between group averages, as a share of B. */
export const payGap = (aSum: number, aCount: number, bSum: number, bCount: number): number => {
  if (aCount === 0 || bCount === 0) return 0;
  const avgA = aSum / aCount;
  const avgB = bSum / bCount;
  return avgB === 0 ? 0 : ((avgB - avgA) / avgB) * 100;
};

export type Ledger = {
  groupACount: number;
  groupAPaySum: number;
  groupBCount: number;
  groupBPaySum: number;
  committedCount: number;
  confirmations: number;
  disputes: number;
};

const groupSum = (inGroupA: boolean) =>
  WORKFORCE.filter((w) => w.isGroupA === inGroupA).reduce((t, w) => t + w.salary, 0);

/** The honest filing: 15.6% gap. */
export const honestLedger = (): Ledger => ({
  groupACount: 5,
  groupAPaySum: groupSum(true),
  groupBCount: 5,
  groupBPaySum: groupSum(false),
  committedCount: 10,
  confirmations: 0,
  disputes: 0,
});

/** Worker 01 filed at €70,000 instead of €50,000, flattering the gap to 9.4%. */
export const tamperedLedger = (): Ledger => ({
  ...honestLedger(),
  groupAPaySum: groupSum(true) - 50_000 + 70_000,
});

export type DemoState = {
  wallet: "disconnected" | "connecting" | "connected";
  address: string;
  contractAddress: string;
  mode: "honest" | "tampered";
  committed: boolean;
  busy: string | null;
  error: string | null;
  okTx: string | null;
  selected: number;
  ledger: Ledger | null;
};

export const initialState: DemoState = {
  wallet: "disconnected",
  address: "mn_shield-addr_preview1q9x7c4m2v8k3s6ft2n",
  contractAddress: "",
  mode: "honest",
  committed: false,
  busy: null,
  error: null,
  okTx: null,
  selected: 0,
  ledger: null,
};
