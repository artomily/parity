import { useEffect, useState } from "react";
import type { TxProgress } from "../hooks/useMidnight.js";

// What is actually happening while the user waits, and roughly how long it takes.
const WAITING: Record<string, string> = {
  proving:
    "Your browser is generating a zero-knowledge proof from your private inputs. This usually takes 20–60 seconds, and nothing private leaves this machine.",
  signing: "Lace is asking you to approve and pay the fee in DUST. Check the Lace popup.",
  submitted:
    "The transaction is on its way to Midnight Preprod. Waiting for it to be included in a block, usually under a minute.",
};

function useElapsed(since: number, running: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return Math.max(0, Math.round((now - since) / 1000));
}

const STEPS = [
  { phase: "proving", label: "Building proof" },
  { phase: "signing", label: "Approve in Lace" },
  { phase: "submitted", label: "Submitted" },
  { phase: "confirmed", label: "Confirmed" },
] as const;

/** A four-step view of the transaction the user is waiting on. */
export function TxStepper({ progress }: { progress: TxProgress }) {
  const failed = progress.phase === "failed";
  const current = failed ? -1 : STEPS.findIndex((s) => s.phase === progress.phase);
  const waiting = WAITING[progress.phase];
  const elapsed = useElapsed(progress.startedAt, !!waiting);

  return (
    <div className="tx-status">
      <ol className="stepper" aria-label="Transaction progress">
        {STEPS.map((s, i) => {
          const state = failed ? "idle" : i < current || progress.phase === "confirmed" ? "done" : i === current ? "active" : "idle";
          return (
            <li key={s.phase} className={`step-item ${state}`} aria-current={state === "active" ? "step" : undefined}>
              <span className="step-dot">{state === "done" ? "✓" : i + 1}</span>
              {s.label}
            </li>
          );
        })}
      </ol>
      {waiting && (
        <p className="waiting">
          {waiting} <span className="elapsed">{elapsed}s elapsed</span>
        </p>
      )}
      {progress.txId && (
        <p className="tx-id">
          Transaction <code>{progress.txId}</code>
        </p>
      )}
    </div>
  );
}
