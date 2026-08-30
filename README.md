# Parity

![CI](https://github.com/artomily/parity/actions/workflows/ci.yml/badge.svg)

> A gender pay-gap filing that can be verified — without anyone seeing a single salary.

## Live Demo

**https://parity-tech.vercel.app/**

## Demo Video

[docs/demo/parity-demo.mp4](docs/demo/parity-demo.mp4) — a 2m 39s walkthrough of the full flow:
the employer commits a payroll, the figures become public, workers confirm their own rows, and a
tampered filing is caught by a worker's dispute while no salary is ever exposed.

The video is generated from source, not screen-captured: [`video/`](video/) is a Remotion project
that renders the product's own UI and narrates it with the macOS speech synthesiser, so it can be
re-rendered whenever the interface changes (`cd video && npm install && npm run build`).

## Contract Address

| Network  | Address                                   |
|----------|-------------------------------------------|
| Preprod  | `[ADDRESS — paste after running the deploy]` |

## What This Product Does

From 2027, every EU employer with 150+ staff must publish its gender pay gap under Directive
(EU) 2023/970. **Nobody can check whether that number is true.** The employer computes it from
its own payroll and files it, and verifying the arithmetic would require the individual
salaries — exactly what data-protection law forbids disclosing. So regulators are reduced to
guessing from the outside: the UK's regulator flags filings by *statistical implausibility*,
sent accuracy letters to 30 employers in 2024 and 42 in 2025, and has issued **zero fines to
date**. That is not weak enforcement; it is missing evidence. The same wall blocks workers: a
worker may legally request pay data for their job category, but in a category of three the
average identifies a colleague, so the employer must refuse.

Parity resolves it in three moves. The employer commits its payroll as a Merkle root, and the
published figures are computed from that same snapshot **inside one circuit** — so there is no
step at which a gap could be computed from one dataset and a different one committed. Then each
worker proves in zero knowledge that the record filed under their identity matches their own
payslip, and confirms or disputes it; one action each, enforced by a nullifier. What becomes
public is never a salary, but the **coverage figure** — *"10 records committed, 7 confirmed by
the worker, 1 disputed."* Records invented to move an average are never confirmed by anyone, so
they surface as a stalled confirmation rate. Fraud stops being one person editing a spreadsheet
and becomes a conspiracy that hundreds of people must actively join.

It is used by **employers** (who can finally evidence a figure, and answer individual pay
requests without data-protection exposure), by **workers** (who can check and challenge what was
filed about them), and by **works councils, unions, and regulators** (who get an integrity signal
instead of a database of salaries they would then have to defend). Midnight is required because
the Directive mandates the disclosure while the GDPR mandates the minimisation: both are legally
binding and in direct tension, so a conventional database (trust the holder) and a transparent
chain (publishes the salaries) are each ruled out — not merely worse. Midnight is where public
verifiable state and private witnesses live in one contract, and where `disclose(...)` makes the
complete disclosure surface auditable by a compliance reviewer rather than a promise about what a
server does.

## Privacy Model

- **What is PUBLIC (on-chain, anyone can see):**
  - `reportingPeriod` / `jobCategory` — which filing this contract instance covers.
  - `payrollRoot` — the Merkle root committing to the payroll snapshot.
  - `groupACount` / `groupBCount` — headcount per pay group.
  - `groupAPaySum` / `groupBPaySum` — **aggregate** pay per group (the gap is derived from these).
  - `committedCount`, `confirmations`, `disputes` — the coverage counters.
  - `nullifiers` — the set of spent action nullifiers.

- **What is PRIVATE (private witness, never on-chain):**
  - `employerSalaries()` / `employerIds()` / `employerGroupA()` / `employerActive()` — the full
    payroll snapshot, supplied by the employer.
  - `employeeSecretKey()` — the worker's identity key.
  - `employeeSalary()` / `employeeIsGroupA()` — the worker's own payslip values.
  - `merkleSiblings()` / `merklePathIndices()` — the private path proving which row is theirs.
  - `employerClaimedRecordHash()` — what the employer filed about this worker.

- **What the user PROVES without revealing:**
  - *Employer:* "the aggregates I am publishing were computed from exactly the snapshot committed
    in `payrollRoot`" — individual salaries are summed inside the circuit, and only per-group
    totals and counts are disclosed.
  - *Worker:* "the record filed under my identity matches my own payslip" — or, via
    `disputeRecord`, "it does not" — without revealing which leaf is theirs, what they earn, or
    what the employer claimed they earn.

**Honest scope note.** An aggregate over a tiny group still leaks: with one worker in a group,
the group total *is* their salary. The contract therefore enforces a minimum publishable group
size of three and refuses the filing otherwise. A confirmation discloses that *someone*
confirmed — never who, and never their pay group. And zero-knowledge proves the arithmetic is
consistent with the committed data, not that the committed data is true; payroll-provider
countersigning is the real fix for that, and is future work. See
[docs/USAGE.md](docs/USAGE.md) for the full list.

## Tech Stack

Midnight network · Compact `0.23` · Midnight.js SDK · Lace wallet (DApp connector) ·
React 19 + Vite 7 · TypeScript · Vitest · GitHub Actions

## Prerequisites

- [Lace wallet](https://www.lace.io/) browser extension, funded from the Preprod faucet
- Node.js v22
- Docker (only if your wallet does not support delegated proving — see below)

## Setup & Run Locally

1. Clone and install:
   ```
   git clone https://github.com/artomily/parity.git && cd parity && npm install
   ```
2. Install the Compact compiler, if you do not have it:
   ```
   npm install -g @midnight-ntwrk/compact-compiler
   ```
3. Compile the contract (this generates `managed/`, including the ZK keys):
   ```
   npm run compact
   ```
4. Start a local proof server, only if your wallet cannot prove for you:
   ```
   docker run -p 6300:6300 midnightnetwork/proof-server
   ```
5. Run the app:
   ```
   npm run dev
   ```
6. Open the printed URL, connect Lace, and follow [docs/USAGE.md](docs/USAGE.md).

## Run Tests

```
npm test
```

Ten tests run the *compiled* circuits through an in-memory simulator — no proof server or live
network needed. They cover the in-circuit aggregation, the Merkle record check, the coverage
counters, the nullifier set, the minimum-group-size rule, and an explicit assertion that no
individual salary ever reaches public ledger state.

To recompile the contract first:

```
npm run test:compile
```

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to `main` and on every
pull request. It checks out the repo, installs Node v22 and the dependencies, installs the Compact
compiler, compiles `contracts/parity.compact` from source, and runs the full test suite against
the freshly compiled circuits. `managed/` is deliberately not committed — CI regenerates it, so a
green badge means the contract in the repo genuinely compiles and its tests genuinely pass.

## Usage Guide

See [docs/USAGE.md](docs/USAGE.md).

## Product X Profile

[**@paritycompany**](https://x.com/paritycompany)
