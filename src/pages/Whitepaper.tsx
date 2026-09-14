import { CONTRACT_ADDRESS, NETWORK_LABEL, REPO_URL } from "../utils/network.js";

const TOC = [
  ["abstract", "Abstract"],
  ["problem", "1. The problem"],
  ["goals", "2. Design goals"],
  ["protocol", "3. Protocol"],
  ["construction", "4. Cryptographic construction"],
  ["disclosure", "5. Disclosure surface"],
  ["threats", "6. Threat model and limits"],
  ["midnight", "7. Why Midnight"],
  ["roadmap", "8. Roadmap"],
  ["deployment", "9. Deployment"],
  ["references", "References"],
] as const;

/** The long-form technical description. Every contract-level claim here is
 *  checked against contracts/parity.compact — keep the two in sync. */
export function Whitepaper() {
  return (
    <div className="paper-layout">
      <aside className="toc" aria-label="Contents">
        <p className="eyebrow">Contents</p>
        <ol>
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  // Hash routing owns location.hash, so scroll instead of navigating.
                  e.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </aside>

      <article className="paper">
        <header className="paper-head">
          <p className="eyebrow">Whitepaper · v1.0 · September 2026</p>
          <h1>Parity: verifiable pay-gap reporting without disclosing salaries</h1>
          <p className="paper-sub">
            A zero-knowledge protocol on Midnight that binds a published gender pay gap to a committed
            payroll, and lets every worker attest to their own record.
          </p>
        </header>

        <section id="abstract">
          <h2>Abstract</h2>
          <p>
            Pay-transparency law requires employers to publish their gender pay gap, while
            data-protection law forbids disclosing the salaries needed to verify it. The result is a
            figure that is mandatory and unauditable. Parity resolves the tension in three steps. The
            employer commits its payroll as a Merkle root and computes the published aggregates from
            that same snapshot inside a single circuit. Each worker then proves in zero knowledge
            whether the record filed under their identity matches their own payslip, and confirms or
            disputes it exactly once. What becomes public is never a salary but a{" "}
            <strong>coverage figure</strong> — how much of the filing has been independently
            attested. Fabricated records are never confirmed, so manipulation surfaces as a stalled
            confirmation rate rather than an undetectable edit.
          </p>
        </section>

        <section id="problem">
          <h2>1. The problem</h2>
          <p>
            Directive (EU) 2023/970 obliges every EU employer with 150 or more staff to report its
            gender pay gap, with the first reporting period in 2027 on 2026 pay data. Three conflicts
            make the obligation hard to satisfy honestly and impossible to check:
          </p>
          <ol>
            <li>
              <strong>The figure is self-computed.</strong> The employer calculates the gap from its
              own payroll. Auditing the arithmetic requires the individual salaries. UK enforcement
              illustrates the outcome: filings are flagged by statistical implausibility, and no fines
              have been issued to date — an evidence problem, not a policy one.
            </li>
            <li>
              <strong>Transparency conflicts with the GDPR.</strong> Workers may request pay data for
              their category, but in a category of three the average identifies a colleague. The
              current remedy routes requests through a trusted third party that sees everything.
            </li>
            <li>
              <strong>Comparison across employers is restricted.</strong> Sharing wage data between
              competitors raises antitrust exposure, even through an intermediary.
            </li>
          </ol>
        </section>

        <section id="goals">
          <h2>2. Design goals</h2>
          <dl className="defs">
            <div><dt>Binding</dt><dd>The published figures must be computed from exactly the payroll that was committed — no second dataset.</dd></div>
            <div><dt>Attestable</dt><dd>Each worker can check the record filed about them against their own payslip.</dd></div>
            <div><dt>Private</dt><dd>No individual salary, identity, or row index is ever disclosed on-chain.</dd></div>
            <div><dt>Sybil-resistant</dt><dd>Each worker acts at most once per filing, without an identity register.</dd></div>
            <div><dt>Auditable</dt><dd>The complete disclosure surface is enumerable in the contract source.</dd></div>
          </dl>
        </section>

        <section id="protocol">
          <h2>3. Protocol</h2>
          <h3>3.1 Commit (employer)</h3>
          <p>
            The employer calls <code>commitPayroll</code> with the full snapshot as private
            witnesses: salaries, identity commitments, pay-group flags, and active flags. The circuit
            builds the Merkle root and, in the same invocation, sums salaries per pay group. It
            discloses only the root, the per-group headcount and pay total, and the number of
            committed records. A filing can be committed once.
          </p>
          <h3>3.2 Attest (worker)</h3>
          <p>
            A worker supplies their secret key, their payslip values, and the Merkle path to their
            leaf. <code>confirmRecord</code> recomputes the leaf from the worker's own data and walks
            the path; if the result equals the committed root, the filed record matches the payslip
            and the confirmation counter increments. If it does not, no confirmation proof can exist.
            The worker instead calls <code>disputeRecord</code>, which proves their identity is in
            the root under a record that differs from their payslip, and increments the dispute
            counter.
          </p>
          <h3>3.3 Coverage (anyone)</h3>
          <p>
            The public state yields three numbers: committed, confirmed, disputed. Their difference
            is the unconfirmed count. A trustworthy filing converges on full confirmation; a filing
            padded with invented records cannot, because no real worker holds the key to confirm them.
          </p>
        </section>

        <section id="construction">
          <h2>4. Cryptographic construction</h2>
          <p>All hashes are Midnight's <code>persistentHash</code>, domain-separated by a fixed prefix.</p>
          <pre className="formula">{`id        = H("parity:id:",   sk)
record    = H("parity:rec:",  groupTag, H(salary))
leaf      = H("parity:leaf:", id, record)
node      = H("parity:node:", left, right)
nullifier = H("parity:nul:",  reportingPeriod, sk)`}</pre>
          <ul>
            <li>
              <strong>Tree.</strong> A binary Merkle tree of depth 4 (16 leaves). Unused slots hold a
              fixed empty leaf so the root is independent of how many workers exist.
            </li>
            <li>
              <strong>Nullifier.</strong> Bound to the reporting period and the worker's key. It is
              stored in a public set; a second action by the same worker on the same filing is
              rejected, and filings from different periods cannot be linked.
            </li>
            <li>
              <strong>Minimum group size.</strong> The contract refuses to publish if either pay
              group has fewer than three members, because an aggregate over one or two people is
              their pay.
            </li>
          </ul>
        </section>

        <section id="disclosure">
          <h2>5. Disclosure surface</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Data</th><th>Where it lives</th><th>Visible to</th></tr>
              </thead>
              <tbody>
                <tr><td><code>payrollRoot</code></td><td>Public ledger</td><td>Everyone</td></tr>
                <tr><td>Headcount and pay total per group</td><td>Public ledger</td><td>Everyone</td></tr>
                <tr><td><code>committedCount</code>, <code>confirmations</code>, <code>disputes</code></td><td>Public ledger</td><td>Everyone</td></tr>
                <tr><td><code>nullifiers</code></td><td>Public ledger</td><td>Everyone</td></tr>
                <tr><td>Individual salaries</td><td>Private witness</td><td>No one</td></tr>
                <tr><td>Worker secret key</td><td>Private witness</td><td>No one</td></tr>
                <tr><td>Merkle path (which row is whose)</td><td>Private witness</td><td>No one</td></tr>
                <tr><td>Which worker confirmed or disputed</td><td>Never computed</td><td>No one</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Every value that crosses from private to public passes through an explicit{" "}
            <code>disclose(…)</code> in the contract, so a data-protection reviewer can enumerate the
            complete surface from the source.
          </p>
        </section>

        <section id="threats">
          <h2>6. Threat model and limits</h2>
          <ul>
            <li>
              <strong>Consistency, not truth.</strong> Zero knowledge proves the figures are consistent
              with the committed data, not that the data is true. Worker attestation raises the cost of
              lying and makes it visible; payroll-provider countersigning is the full fix and is future
              work.
            </li>
            <li>
              <strong>Classification is contested.</strong> Parity makes the arithmetic trustworthy, not
              the job categories fair. It cannot adjudicate "work of equal value".
            </li>
            <li>
              <strong>Small groups leak.</strong> Mitigated by the minimum group size of three.
            </li>
            <li>
              <strong>Key custody.</strong> Workers must hold a key. At scale, a works council as issuer
              and wallet-derived keys are the likely answer.
            </li>
            <li>
              <strong>Legal status.</strong> No regulator accepts a ZK proof as a statutory filing today.
              The realistic entry point is a supplementary assurance layer.
            </li>
          </ul>
        </section>

        <section id="midnight">
          <h2>7. Why Midnight</h2>
          <p>
            The requirement is "verifiable yet private", and both halves are legally binding. A
            conventional database requires trusting its holder; a transparent chain would publish the
            salaries. Midnight places public, recomputable ledger state and private witnesses in one
            contract, and Compact's <code>disclose(…)</code> discipline makes privacy a property of the
            type system rather than of developer care. Nullifiers provide one-action-per-worker without
            an identity register.
          </p>
        </section>

        <section id="roadmap">
          <h2>8. Roadmap</h2>
          <ol className="roadmap">
            <li><strong>Now — Preprod MVP.</strong> Commit, confirm, dispute, and coverage, live and tested with early users.</li>
            <li><strong>Next — scale.</strong> Increase tree depth beyond 16 leaves toward the Directive's 150+ threshold, and measure proof cost.</li>
            <li><strong>Then — pay predicates.</strong> Let a worker ask "is my pay below my category's average?" and receive a verified yes/no.</li>
            <li><strong>Later — provider countersigning.</strong> Payroll systems sign the committed dataset, closing the "consistent but untrue" gap.</li>
          </ol>
        </section>

        <section id="deployment">
          <h2>9. Deployment</h2>
          <dl className="defs">
            <div><dt>Network</dt><dd>{NETWORK_LABEL}</dd></div>
            <div><dt>Contract</dt><dd><code className="wrap">{CONTRACT_ADDRESS}</code></dd></div>
            <div><dt>Language</dt><dd>Compact 0.23, Midnight.js SDK</dd></div>
            <div><dt>Source</dt><dd><a href={REPO_URL} target="_blank" rel="noreferrer">github.com/artomily/parity</a></dd></div>
          </dl>
        </section>

        <section id="references">
          <h2>References</h2>
          <ol className="refs">
            <li><a href="https://www.consilium.europa.eu/en/policies/pay-transparency/" target="_blank" rel="noreferrer">Directive (EU) 2023/970 on pay transparency — Council of the EU</a></li>
            <li><a href="https://www.lewissilkin.com/insights/2026/03/26/gender-pay-gap-reporting-enforcement-zero-fines-to-date-but-rising-checks" target="_blank" rel="noreferrer">Gender pay gap reporting enforcement: zero fines to date — Lewis Silkin</a></li>
            <li><a href="https://www.activemind.legal/guides/pay-transparency-data-protection/" target="_blank" rel="noreferrer">Pay transparency and data protection — activeMind.legal</a></li>
            <li><a href="https://worldatwork.org/publications/workspan-daily/tread-lightly-in-sharing-salary-data-during-budget-planning" target="_blank" rel="noreferrer">Antitrust limits on sharing salary data — WorldatWork</a></li>
          </ol>
        </section>
      </article>
    </div>
  );
}
