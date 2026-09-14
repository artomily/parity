import { href } from "../hooks/useRoute.js";
import {
  CONTRACT_ADDRESS,
  FAUCET_URL,
  LACE_URL,
  NETWORK_LABEL,
  VIDEO_URL,
  shortHex,
} from "../utils/network.js";

const PROBLEMS = [
  {
    stat: "0",
    label: "fines issued",
    title: "The number cannot be checked",
    body:
      "Employers compute their own pay gap and file it. Checking the arithmetic needs the individual salaries — which data-protection law forbids disclosing. Regulators are left flagging filings that merely look implausible.",
  },
  {
    stat: "3",
    label: "people is enough to identify one",
    title: "Transparency collides with the GDPR",
    body:
      "A worker may request pay data for their category, but in a small category the average reveals a colleague's salary. Today the only fix is a trusted third party who sees everything.",
  },
  {
    stat: "2027",
    label: "first reporting period",
    title: "The deadline is already here",
    body:
      "Directive (EU) 2023/970 makes pay-gap reporting mandatory for every EU employer with 150+ staff, with the burden of proof shifting onto the employer.",
  },
];

const STEPS = [
  {
    n: "01",
    who: "Employer",
    title: "Commit, then compute",
    body:
      "The payroll is committed as a Merkle root, and the published per-group totals are computed from that same snapshot inside one circuit. A figure cannot come from one dataset while another is committed.",
  },
  {
    n: "02",
    who: "Every worker",
    title: "Confirm your own row",
    body:
      "Each worker proves in zero knowledge that the record filed under their identity matches their payslip — or proves that it does not. One action each, enforced by a nullifier.",
  },
  {
    n: "03",
    who: "Anyone",
    title: "Read the coverage",
    body:
      "What becomes public is never a salary but a coverage figure: how many records exist, how many were confirmed, how many disputed. Invented rows are never confirmed, so fraud shows up as a stalled rate.",
  },
];

const AUDIENCE = [
  ["Employers", "File a figure you can evidence, and answer pay requests without data-protection exposure."],
  ["Workers", "Check and challenge what was filed about you — without revealing what you earn."],
  ["Works councils & unions", "Get an integrity signal instead of a salary database you would have to defend."],
  ["Regulators", "Replace statistical guesswork with a direct measure of how much of a filing is attested."],
];

export function Landing() {
  return (
    <div className="landing">
      {/* ---------------- hero ---------------- */}
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Zero-knowledge pay transparency</p>
          <h1 className="hero-title">
            A pay-gap report anyone can verify. <span>Without seeing a single salary.</span>
          </h1>
          <p className="hero-sub">
            Parity lets an employer publish its gender pay gap as a figure that can be checked — and
            lets every worker confirm the row filed about them, in zero knowledge, on Midnight.
          </p>
          <div className="actions">
            <a className="button primary big" href={href("app")}>
              Launch the app
            </a>
            <a className="button ghost big" href={href("whitepaper")}>
              Read the whitepaper
            </a>
          </div>
          <p className="hero-meta">
            <span className="live-dot" aria-hidden="true" /> Live on {NETWORK_LABEL} ·{" "}
            <code title={CONTRACT_ADDRESS}>{shortHex(CONTRACT_ADDRESS)}</code> ·{" "}
            <a href={VIDEO_URL} target="_blank" rel="noreferrer">Watch the 2-min demo</a>
          </p>
        </div>

        {/* A static preview of the one number the product exists to publish. */}
        <div className="hero-card" aria-label="Example filing">
          <div className="hero-card-head">
            <span>Example filing · 10 workers</span>
            <span className="tag ok">Illustration</span>
          </div>
          <div className="gap">
            <span className="gap-value">14.2%</span>
            <span className="gap-label">reported pay gap</span>
          </div>
          <div className="bar" role="img" aria-label="80% confirmed, 10% disputed">
            <span className="fill confirmed" style={{ width: "80%" }} />
            <span className="fill disputed" style={{ width: "10%" }} />
          </div>
          <div className="counts">
            <span><strong>10</strong> committed</span>
            <span className="ok"><strong>8</strong> confirmed</span>
            <span className="bad"><strong>1</strong> disputed</span>
          </div>
          <div className="hero-card-foot">
            <span className="lock" aria-hidden="true">●</span> 0 salaries disclosed
          </div>
        </div>
      </section>

      {/* ---------------- problem ---------------- */}
      <section className="section">
        <div className="section-head">
          <p className="eyebrow">The problem</p>
          <h2>Pay transparency is mandatory. Verifying it is impossible.</h2>
        </div>
        <div className="grid three">
          {PROBLEMS.map((p) => (
            <article key={p.title} className="card">
              <div className="stat">
                {p.stat}
                <span>{p.label}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="section" id="how">
        <div className="section-head">
          <p className="eyebrow">How it works</p>
          <h2>Three moves turn a claim into evidence.</h2>
        </div>
        <div className="grid three">
          {STEPS.map((s) => (
            <article key={s.n} className="card step-card">
              <div className="step-top">
                <span className="step-n">{s.n}</span>
                <span className="who">{s.who}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- privacy ---------------- */}
      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Privacy model</p>
          <h2>Exactly what goes public — and what never does.</h2>
        </div>
        <div className="grid two">
          <article className="card privacy pub">
            <h3>Public, on-chain</h3>
            <ul>
              <li>Payroll Merkle root</li>
              <li>Headcount and pay total per group</li>
              <li>Records committed, confirmed, disputed</li>
              <li>Spent nullifiers</li>
            </ul>
          </article>
          <article className="card privacy priv">
            <h3>Private, never leaves the device</h3>
            <ul>
              <li>Every individual salary</li>
              <li>Worker identity keys</li>
              <li>Which row belongs to which worker</li>
              <li>Who confirmed or disputed</li>
            </ul>
          </article>
        </div>
        <p className="fine">
          Groups smaller than three are refused outright: an aggregate over one or two people is
          their pay. Every disclosure is a <code>disclose(…)</code> call in the contract, so the full
          surface can be audited line by line.
        </p>
      </section>

      {/* ---------------- audience ---------------- */}
      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Who it is for</p>
          <h2>One filing, four parties who can finally trust it.</h2>
        </div>
        <div className="grid four">
          {AUDIENCE.map(([t, b]) => (
            <article key={t} className="card compact">
              <h3>{t}</h3>
              <p>{b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- try it ---------------- */}
      <section className="section cta" id="try">
        <div>
          <p className="eyebrow">Try it on Preprod</p>
          <h2>Be one of the first 50 testers.</h2>
          <p>
            File a payroll as the employer, then confirm — or dispute — a record as a worker. It takes
            about five minutes, and your feedback shapes what we build next.
          </p>
        </div>
        <ol className="checklist">
          <li>
            Install <a href={LACE_URL} target="_blank" rel="noreferrer">Lace</a> and set Midnight to{" "}
            <em>Preprod</em>
          </li>
          <li>
            Fund it from the <a href={FAUCET_URL} target="_blank" rel="noreferrer">Preprod faucet</a>
          </li>
          <li>Wait a few minutes for DUST to generate</li>
          <li>
            <a href={href("app")}>Launch the app</a> and connect
          </li>
        </ol>
      </section>
    </div>
  );
}
