import { useState } from "react";
import type { Ledger } from "../../managed/contract/index.js";
import { WORKFORCE, payGap } from "../utils/filing.js";
import type { FilingMode } from "../hooks/useMidnight.js";

const euro = (n: bigint | number) =>
  `€${Number(n).toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;

/**
 * The core feature. Three panels, in the order the product actually works:
 *   1. the employer commits a payroll snapshot and publishes aggregates
 *      computed from it inside the same circuit;
 *   2. each worker checks the row filed under their identity against their own
 *      payslip and confirms or disputes it;
 *   3. the coverage figure shows how much of the filing is independently
 *      attested — which is the number that makes the gap trustworthy.
 */
export function PayrollFiling({
  ledgerState,
  filingMode,
  setFilingMode,
  onDeploy,
  onCommit,
  onConfirm,
  onDispute,
  busy,
  contractAddress,
}: {
  ledgerState: Ledger | null;
  filingMode: FilingMode;
  setFilingMode: (m: FilingMode) => void;
  onDeploy: () => void;
  onCommit: () => void;
  onConfirm: (i: number) => void;
  onDispute: (i: number) => void;
  busy: string | null;
  contractAddress: string;
}) {
  const [selected, setSelected] = useState(0);
  const committed = ledgerState?.payrollCommitted ?? false;
  const disabled = busy !== null;

  const gap =
    ledgerState && committed
      ? payGap(
          ledgerState.groupAPaySum,
          ledgerState.groupACount,
          ledgerState.groupBPaySum,
          ledgerState.groupBCount,
        )
      : null;

  const confirmations = Number(ledgerState?.confirmations ?? 0n);
  const disputes = Number(ledgerState?.disputes ?? 0n);
  const total = Number(ledgerState?.committedCount ?? 0n);
  const unconfirmed = Math.max(total - confirmations - disputes, 0);
  const coverage = total > 0 ? Math.round((confirmations / total) * 100) : 0;

  return (
    <div className="panels">
      {/* ---------------- 1. Employer ---------------- */}
      <section className="panel">
        <h2>
          <span className="step">1</span>
          The employer files
        </h2>
        <p className="lede">
          The payroll snapshot is committed as a Merkle root, and the published figures are computed
          from that same snapshot <strong>inside one circuit</strong>. There is no step where a gap
          could be computed from one dataset and a different one committed.
        </p>

        <fieldset className="modes" disabled={disabled || committed}>
          <legend>Which payroll does the employer file?</legend>
          <label className={filingMode === "honest" ? "mode on" : "mode"}>
            <input
              type="radio"
              name="mode"
              checked={filingMode === "honest"}
              onChange={() => setFilingMode("honest")}
            />
            <span>
              <strong>The truth</strong>
              <em>Every row matches the worker's real payslip.</em>
            </span>
          </label>
          <label className={filingMode === "tampered" ? "mode on" : "mode"}>
            <input
              type="radio"
              name="mode"
              checked={filingMode === "tampered"}
              onChange={() => setFilingMode("tampered")}
            />
            <span>
              <strong>Tampered</strong>
              <em>One row is filed higher than it really is, to flatter the gap.</em>
            </span>
          </label>
        </fieldset>

        <div className="actions">
          <button className="primary" onClick={onDeploy} disabled={disabled}>
            Deploy a new filing
          </button>
          <button className="primary" onClick={onCommit} disabled={disabled || !contractAddress || committed}>
            {committed ? "Payroll committed" : "Commit payroll"}
          </button>
        </div>
        <p className="note">
          Nothing about an individual is disclosed here — not a salary, not a name. Only the root and
          the per-group totals become public.
        </p>
      </section>

      {/* ---------------- 2. Published figures ---------------- */}
      <section className="panel">
        <h2>
          <span className="step">2</span>
          What became public
        </h2>
        {!committed ? (
          <p className="empty">No payroll committed yet.</p>
        ) : (
          <>
            <div className="gap">
              <span className="gap-value">{gap!.toFixed(1)}%</span>
              <span className="gap-label">reported pay gap</span>
            </div>
            <dl className="figures">
              <div>
                <dt>Group A</dt>
                <dd>
                  {String(ledgerState!.groupACount)} people · {euro(ledgerState!.groupAPaySum)} total
                </dd>
              </div>
              <div>
                <dt>Group B</dt>
                <dd>
                  {String(ledgerState!.groupBCount)} people · {euro(ledgerState!.groupBPaySum)} total
                </dd>
              </div>
            </dl>
            <p className="note">
              Totals only. A group below the minimum publishable size is refused outright, because
              an aggregate over one or two people <em>is</em> their pay.
            </p>
          </>
        )}
      </section>

      {/* ---------------- 3. Worker attestation ---------------- */}
      <section className="panel">
        <h2>
          <span className="step">3</span>
          Each worker checks their own row
        </h2>
        <p className="lede">
          A worker proves in zero knowledge that the record filed under their identity matches their
          own payslip. If it does not, they can prove <em>that</em> instead — without revealing
          either figure.
        </p>

        <label className="field">
          <span>Acting as</span>
          <select
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
            disabled={disabled}
          >
            {WORKFORCE.map((w, i) => (
              <option key={w.name} value={i}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <p className="payslip">
          Your own payslip says <strong>{euro(WORKFORCE[selected].salary)}</strong>.
          <em>Held locally. Never sent anywhere.</em>
        </p>

        <div className="actions">
          <button className="primary" onClick={() => onConfirm(selected)} disabled={disabled || !committed}>
            Confirm my record
          </button>
          <button className="ghost" onClick={() => onDispute(selected)} disabled={disabled || !committed}>
            Dispute my record
          </button>
        </div>
      </section>

      {/* ---------------- 4. Coverage ---------------- */}
      <section className="panel wide">
        <h2>
          <span className="step">4</span>
          Coverage — how much of the filing is independently attested
        </h2>
        <div className="coverage">
          <div className="bar" role="img" aria-label={`${coverage}% confirmed`}>
            <span className="fill confirmed" style={{ width: `${total ? (confirmations / total) * 100 : 0}%` }} />
            <span className="fill disputed" style={{ width: `${total ? (disputes / total) * 100 : 0}%` }} />
          </div>
          <div className="counts">
            <span><strong>{total}</strong> committed</span>
            <span className="ok"><strong>{confirmations}</strong> confirmed by the worker</span>
            <span className="pending"><strong>{unconfirmed}</strong> unconfirmed</span>
            <span className="bad"><strong>{disputes}</strong> disputed</span>
          </div>
        </div>
        <p className="note">
          This is the number that makes the gap above trustworthy. Records invented to move an
          average are never confirmed by anyone, so they surface here as a stalled confirmation rate
          — while no individual salary is ever exposed.
        </p>
      </section>
    </div>
  );
}
