import type { TxProgress } from "../hooks/useMidnight.js";

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
      {progress.txId && (
        <p className="tx-id">
          Transaction <code>{progress.txId}</code>
        </p>
      )}
    </div>
  );
}
