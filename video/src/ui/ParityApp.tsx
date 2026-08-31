// A faithful re-render of the product's own UI (src/components/*.tsx), driven
// by a plain state object instead of the live Midnight hook — so the video
// shows the real interface, with the real copy, without needing a funded
// wallet and a live proof server inside the renderer.
import type { DemoState } from "./state";
import { WORKFORCE, payGap } from "./state";

const euro = (n: number) => `€${n.toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;
export function ParityMark() {
  return (
    <svg className="mark" viewBox="0 0 320 320" aria-hidden="true">
      <defs>
        <linearGradient id="parity-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9838" />
          <stop offset="1" stopColor="#F26F1A" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="76" fill="url(#parity-mark)" />
      <path
        fill="#ffffff"
        fillRule="evenodd"
        d="M98 70 H182 A53 53 0 0 1 182 176 H138 V250 H98 Z
           M138 104 H180 A21 21 0 0 1 180 146 H138 Z"
      />
    </svg>
  );
}

const short = (a: string) => (a.length > 18 ? `${a.slice(0, 10)}…${a.slice(-6)}` : a);

function WalletConnect({ state }: { state: DemoState }) {
  if (state.wallet === "connected") {
    return (
      <div className="wallet connected">
        <span className="dot" />
        <code>{short(state.address)}</code>
        <button className="ghost">Disconnect</button>
      </div>
    );
  }
  return (
    <button className="primary">
      {state.wallet === "connecting" ? "Connecting…" : "Connect Lace wallet"}
    </button>
  );
}

function Intro() {
  return (
    <section className="panel intro">
      <h2>Why this exists</h2>
      <p>
        From 2027 every EU employer with 150+ staff must publish its gender pay gap. Nobody can
        check whether that number is true: verifying it would require the individual salaries,
        which data-protection law forbids disclosing. So regulators are reduced to flagging
        filings that look <em>statistically implausible</em> — and have issued almost no fines.
      </p>
      <p>
        Parity closes that gap. Connect a wallet to file a payroll, then check it as the workers
        it describes.
      </p>
    </section>
  );
}

/**
 * The coverage bar's widths are passed in explicitly rather than derived from
 * the counters, so a scene can animate the bar growing across frames instead
 * of snapping between two states.
 */
export function ParityApp({
  state,
  confirmedWidth,
  disputedWidth,
  spinnerAngle = 0,
}: {
  state: DemoState;
  confirmedWidth?: number;
  disputedWidth?: number;
  spinnerAngle?: number;
}) {
  const { ledger, committed } = state;
  const gap = ledger && committed
    ? payGap(ledger.groupAPaySum, ledger.groupACount, ledger.groupBPaySum, ledger.groupBCount)
    : null;

  const total = ledger?.committedCount ?? 0;
  const confirmations = ledger?.confirmations ?? 0;
  const disputes = ledger?.disputes ?? 0;
  const unconfirmed = Math.max(total - confirmations - disputes, 0);

  const confirmedPct = confirmedWidth ?? (total ? (confirmations / total) * 100 : 0);
  const disputedPct = disputedWidth ?? (total ? (disputes / total) * 100 : 0);

  return (
    <div className="shell">
      <header className="site-header">
        <div className="brand">
          <ParityMark />
          <div>
            <h1>Parity</h1>
            <p className="tagline">
              A gender pay-gap filing that can be verified — without anyone seeing a single salary.
            </p>
          </div>
        </div>
        <WalletConnect state={state} />
      </header>

      <main>
        {state.wallet !== "connected" ? (
          <Intro />
        ) : (
          <>
            <section className="panel contract">
              <label className="field">
                <span>Filing contract address</span>
                <input
                  readOnly
                  value={state.contractAddress}
                  placeholder="Deploy a new filing, or paste an existing contract address"
                />
              </label>
              <button className="ghost">Join</button>
            </section>

            {state.busy && (
              <div className="banner busy">
                <span
                  className="spinner"
                  style={{ transform: `rotate(${spinnerAngle}deg)` }}
                />
                {state.busy}
                <em>Proof generation runs locally — your private inputs never leave this machine.</em>
              </div>
            )}

            {state.error && (
              <div className="banner error">
                {state.error}
                <button className="ghost">Dismiss</button>
              </div>
            )}

            {state.okTx && !state.busy && (
              <div className="banner ok">
                Submitted on-chain · <code>{state.okTx}</code>
              </div>
            )}

            <div className="panels">
              <section className="panel">
                <h2>
                  <span className="step">1</span>
                  The employer files
                </h2>
                <p className="lede">
                  The payroll snapshot is committed as a Merkle root, and the published figures are
                  computed from that same snapshot <strong>inside one circuit</strong>. There is no
                  step where a gap could be computed from one dataset and a different one committed.
                </p>

                <fieldset className="modes">
                  <legend>Which payroll does the employer file?</legend>
                  <label className={state.mode === "honest" ? "mode on" : "mode"}>
                    <input type="radio" readOnly checked={state.mode === "honest"} />
                    <span>
                      <strong>The truth</strong>
                      <em>Every row matches the worker's real payslip.</em>
                    </span>
                  </label>
                  <label className={state.mode === "tampered" ? "mode on" : "mode"}>
                    <input type="radio" readOnly checked={state.mode === "tampered"} />
                    <span>
                      <strong>Tampered</strong>
                      <em>One row is filed higher than it really is, to flatter the gap.</em>
                    </span>
                  </label>
                </fieldset>

                <div className="actions">
                  <button className="primary">Deploy a new filing</button>
                  <button className="primary" disabled={committed}>
                    {committed ? "Payroll committed" : "Commit payroll"}
                  </button>
                </div>
                <p className="note">
                  Nothing about an individual is disclosed here — not a salary, not a name. Only the
                  root and the per-group totals become public.
                </p>
              </section>

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
                          {ledger!.groupACount} people · {euro(ledger!.groupAPaySum)} total
                        </dd>
                      </div>
                      <div>
                        <dt>Group B</dt>
                        <dd>
                          {ledger!.groupBCount} people · {euro(ledger!.groupBPaySum)} total
                        </dd>
                      </div>
                    </dl>
                    <p className="note">
                      Totals only. A group below the minimum publishable size is refused outright,
                      because an aggregate over one or two people <em>is</em> their pay.
                    </p>
                  </>
                )}
              </section>

              <section className="panel">
                <h2>
                  <span className="step">3</span>
                  Each worker checks their own row
                </h2>
                <p className="lede">
                  A worker proves in zero knowledge that the record filed under their identity
                  matches their own payslip. If it does not, they can prove <em>that</em> instead —
                  without revealing either figure.
                </p>

                <label className="field">
                  <span>Acting as</span>
                  <select value={state.selected} onChange={() => undefined}>
                    {WORKFORCE.map((w, i) => (
                      <option key={w.name} value={i}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="payslip">
                  Your own payslip says <strong>{euro(WORKFORCE[state.selected].salary)}</strong>.
                  <em>Held locally. Never sent anywhere.</em>
                </p>

                <div className="actions">
                  <button className="primary" disabled={!committed}>Confirm my record</button>
                  <button className="ghost" disabled={!committed}>Dispute my record</button>
                </div>
              </section>

              <section className="panel wide">
                <h2>
                  <span className="step">4</span>
                  Coverage — how much of the filing is independently attested
                </h2>
                <div className="coverage">
                  <div className="bar">
                    <span className="fill confirmed" style={{ width: `${confirmedPct}%` }} />
                    <span className="fill disputed" style={{ width: `${disputedPct}%` }} />
                  </div>
                  <div className="counts">
                    <span><strong>{total}</strong> committed</span>
                    <span className="ok"><strong>{confirmations}</strong> confirmed by the worker</span>
                    <span className="pending"><strong>{unconfirmed}</strong> unconfirmed</span>
                    <span className="bad"><strong>{disputes}</strong> disputed</span>
                  </div>
                </div>
                <p className="note">
                  This is the number that makes the gap above trustworthy. Records invented to move
                  an average are never confirmed by anyone, so they surface here as a stalled
                  confirmation rate — while no individual salary is ever exposed.
                </p>
              </section>
            </div>
          </>
        )}
      </main>

      <footer className="site-footer">
        <p>
          Built on Midnight. Salaries are private witnesses: they are used to compute the published
          aggregates inside the circuit, and never leave the machine that supplied them.
        </p>
      </footer>
    </div>
  );
}
