# Product Proposal

**Idea: original — not taken from the provided list.**

---

## What is the product, and who uses it?

**Parity is a gender pay-gap report that can be verified without anyone seeing a single salary.**

### The problem

Directive (EU) 2023/970 required transposition into national law by **7 June 2026** — only
**4 of 27 member states met it**. First reporting period commences **2027**, on 2026 pay data,
for every employer with 150+ employees. Three things collide:

1. **The figure is self-computed and structurally unauditable.** The employer calculates its own
   pay gap from its own payroll and files it. Verifying the arithmetic requires the individual
   salaries — exactly what data-protection law forbids disclosing. Enforcement is reduced to
   guessing from outside: the UK's EHRC flags filings by *statistical implausibility* ("medians
   that are statistically impossible", figures that look "too perfect"), wrote to 30 employers in
   2024 and 42 in 2025, and has issued **zero fines to date**. That is not weak enforcement — it
   is an evidence problem. **Nobody can prove the number is wrong.**

2. **The Directive and the GDPR pull in opposite directions.** A worker may request pay data for
   their category — but in a category of three, the average discloses an identifiable colleague's
   pay. Member states' proposed fix is to route requests through works councils, labour
   inspectorates, or equality bodies: a trusted third party allowed to see everything. The
   smallest teams get the weakest version of the right.

3. **"Work of equal value" needs comparison that competition law forbids.** Useful comparators sit
   at other employers, but sharing wage data with competitors — including via a third-party
   aggregator — is an antitrust exposure enforcers are actively targeting in labour markets.

Non-compliance shifts the burden of proof onto the employer and exposes three years of back-pay
claims — with no trustworthy way to show they got it right.

### The product

Three parts. **Part 2 is the core**; the others support it.

**1 — Commit before computing.** The employer commits its payroll as a Merkle root over
`{employee commitment, pay, gender, job category}`. The published gap is computed *inside the
circuit* from that root. It cannot publish a figure inconsistent with what it committed to,
re-draw category boundaries until the number flatters it, or revise the snapshot afterwards.

**2 — Employees confirm their own row; the confirmation rate is public.** Part 1 still allows
committing fake payroll. So each employee proves in zero knowledge that **the record filed under
their identity matches what they were actually paid** — checked against their own payslip — and
confirms or disputes it. A nullifier bound to `{employee key, reporting period}` allows exactly
one submission each. What becomes public is never a salary, but the **coverage figure**:

> *Committed: 847 records. Confirmed by the worker: 812. Unconfirmed: 32. Disputed: 3.*

This replaces "does this number look statistically odd" with a direct measure of how much of the
filing is independently attested. Ghost records inserted to shift an average are never confirmed
and surface in the unconfirmed count. Fraud stops being one person editing a spreadsheet and
becomes a conspiracy of hundreds — while the attempt shows up as a stalled confirmation rate.

**3 — Individual pay answers that identify no one.** Today the employer must refuse a small-category
request on data-protection grounds, or hand an inspectorate everyone's salary. Instead the contract
answers the **predicate** — *"is my pay below the committed average for my category and gender?"* —
as a verified yes/no against the same root. Actionable for the worker; no colleague exposed; no
third party holding data. This is the "alternative measure" the Directive asks member states to invent.

### Who uses it

- **Employers (150+ staff, EU)** — file a figure they can evidence, and answer individual pay
  requests without data-protection exposure, which they currently cannot do at all.
- **Employees** — confirm or dispute their own record, and get a verified answer about their own pay.
- **Works councils, unions, equality bodies** — see the gap *and* the coverage figure, without being
  handed a salary database they must then defend.
- **Regulators** — replace statistical guesswork with a direct integrity signal.

---

## Why Midnight specifically?

**The requirement is literally "verifiable yet private", and both halves are legally binding.** The
Directive mandates the disclosure; the GDPR mandates the minimisation. A conventional database means
trusting whoever holds it; a transparent chain publishes the salaries. Both are legally excluded here
— not merely worse.

**The current answer is a trusted third party, and it is a bad one.** Inspectorates and works councils
holding all pay data can be under-resourced, captured, breached, or subpoenaed. Midnight's shielded
data stays with each holder rather than aggregating into a central store — the honeypot is removed
rather than defended.

**Selective disclosure must be auditable, because a data protection officer will ask.** Compact's
`disclose(...)` discipline makes the complete list of what leaves private state readable in the
source and enumerable in a compliance review — privacy enforced by the type system, not by developer
discipline.

**Public verifiable state and private inputs must coexist in one contract.** The counters, published
gap, and nullifier set are public ledger state anyone can recompute; salaries, genders, and Merkle
paths are witnesses that never leave the employee's machine. That combination *is* the product.

**Nullifiers give one-confirmation-per-employee without an identity register** — and because the
nullifier is bound to the period, year-over-year filings cannot be joined to track an individual.

---

## Data Model

| Data Point | Type | Disclosed To |
|------------|------|--------------|
| `reportingPeriod` — which filing this instance is for | Public ledger | Everyone |
| `payrollRoot` — root committing to the payroll snapshot | Public ledger | Everyone |
| `categoryCount` — workers per job category | Public ledger | Everyone |
| `publishedGap` — computed pay gap per category | Public ledger | Everyone |
| `confirmed` / `unconfirmed` / `disputed` — coverage counters | Public ledger | Everyone |
| `nullifiers` — spent confirmation nullifiers | Public ledger | Everyone |
| Result of a predicate query | Disclosed to the asking worker only | That worker |
| `employeeSecretKey()` — identity key | Private witness | No one |
| `salary()` — the worker's pay | Private witness | No one |
| `gender()` / `jobCategory()` — classification | Private witness | No one |
| `merkleSiblings()` / `merklePathIndices()` — path proving the row is in the root | Private witness | No one |
| Which worker filed a given confirmation or dispute | Never computed on-chain | No one |
| Any individual salary | Never disclosed, at any point | No one |
| Whether a specific named worker has confirmed yet | Not derivable from public state | No one |

**Honest scope note.** Parity discloses aggregates and coverage, never an individual salary — but an
aggregate over a tiny category still leaks: in a category of one, the average *is* that person's pay.
The contract therefore enforces a **minimum category size**, below which no gap is published and only
the Part 3 predicate is answerable. `categoryCount` is public so that self-serving category boundaries
are visible. This is a limitation of the product, not of the cryptography.

---

## Mainnet Feasibility

**Realistic — but only if the scope stays narrow.**

Already working and reused: Merkle membership proofs, per-period nullifiers, an enumerable
`disclose(...)` surface, the compile/test/CI pipeline, and a headless deploy path. The membership and
double-submission cryptography is not the risk. The new work is bounded and known:

1. **Aggregation over private values** — summing private salaries into a public per-category average
   is materially harder than incrementing a counter, and is the core new circuit. Proof cost must be
   measured, not assumed.
2. **Tree depth** — currently depth 4 (16 leaves, demo-sized). The Directive's threshold is 150+
   employees, so depth is now the headline engineering task, not a footnote.
3. **The comparison predicate** and the minimum-category-size rule guarding it.
4. **Key custody across 150+ non-technical employees** — works council as issuer and recovery path;
   deriving the key from the wallet rather than storing a loose secret is the likely answer.

### Open problems, and what I would solve first

- **ZK proves consistency with committed data, not that the data is true.** Part 2 raises the cost of
  lying and makes the attempt visible, but does not eliminate it. The real fix is the payroll provider
  (Workday, SAP, ADP) countersigning the committed dataset — an integration, and explicitly future work.
- **Job classification is the real battleground, and ZK cannot adjudicate it.** "Equal value" is
  contested and partly subjective. Parity makes the *arithmetic* trustworthy, not the *categories* fair.
  Publishing category sizes is a partial mitigation.
- **No regulator accepts a ZK proof as a statutory filing today.** The realistic entry point is a
  supplementary assurance layer for works councils, unions, and employers evidencing good faith — not a
  replacement for the legal submission.
- **The adopter is the party being audited.** Partly answered by the mandate, partly by self-interest
  (Part 3 solves a problem they have no answer to today). Still the main risk — commercial, not technical.

Keep it small: one reporting period per contract, one committed snapshot, aggregates only, a hard
minimum category size — and make that narrow version dependable before adding cross-employer comparison
or multi-year trends.

The likeliest reason to miss Mainnet is not the contract but wallet and infrastructure maturity: this
project already hit a multi-day Preprod wallet-sync bug worked around by switching networks (documented
in the README). That upstream instability, not the ZK logic, is the schedule risk worth naming.

---

### Sources

- [Directive (EU) 2023/970 (European Council)](https://www.consilium.europa.eu/en/policies/pay-transparency/) · [June 2026 deadline (Ogletree)](https://ogletree.com/insights-resources/blog-posts/the-june-2026-eu-pay-transparency-directive-implementation-deadline-looms/) · [Implementation status and risks (Littler)](https://www.littler.com/news-analysis/asap/european-pay-transparency-directive-implementation-challenges-status-and-risks)
- [Enforcement: zero fines to date, rising checks (Lewis Silkin)](https://www.lewissilkin.com/insights/2026/03/26/gender-pay-gap-reporting-enforcement-zero-fines-to-date-but-rising-checks) · [Pay Transparency Directive FAQs (Lewis Silkin)](https://www.lewissilkin.com/insights/2026/06/25/pay-transparency-directive-faqs)
- [Directive vs GDPR (activeMind.legal)](https://www.activemind.legal/guides/pay-transparency-data-protection/) · [Antitrust limits on sharing pay data (WorldatWork)](https://worldatwork.org/publications/workspan-daily/tread-lightly-in-sharing-salary-data-during-budget-planning)
- [Decentralized inverse transparency with blockchain — adjacent prior art (arXiv 2304.11033)](https://arxiv.org/pdf/2304.11033)
