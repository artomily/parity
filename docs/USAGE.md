# How to Use Parity

Parity lets an employer publish a gender pay-gap figure that other people can actually
verify — and lets each worker check the row filed about them, without anyone's salary
being revealed to anyone.

You will play both roles: first the employer filing a payroll, then the workers checking it.

---

## What You Need

1. **A Midnight wallet.** Install [Lace](https://www.lace.io/) in your browser.
2. **Some test funds.** Open the wallet and fund it from the Preprod faucet. You need a
   small balance to submit transactions.
3. **A proving setup.** Lace can generate proofs for you. If your wallet asks for a proof
   server instead, run one locally:
   ```
   docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0
   ```
4. That's all. No account, no sign-up, no personal data.

---

## Step-by-Step Guide

### Part 1 — File a payroll, as the employer

1. Open the app and click **Connect Lace wallet**. Your address appears in the header.
2. Choose which payroll the employer files:
   - **The truth** — every row matches what the worker is really paid.
   - **Tampered** — one worker's pay is filed higher than it really is, to make the gap
     look smaller. Try this one second; it is what the rest of the product exists to catch.
3. Click **Deploy a new filing**. This creates one contract for one reporting period and
   one job category. Copy the contract address that appears.
4. Click **Commit payroll**. Your browser now proves, in zero knowledge, that the figures
   about to be published were computed from exactly the payroll being committed. This takes
   a few seconds — proof generation is real work.
5. Look at **What became public**. You will see the reported pay gap and each group's
   headcount and *total* pay. You will not see anybody's salary, because it was never sent.

### Part 2 — Check the filing, as the workers

6. In **Each worker checks their own row**, pick a worker from the dropdown. The panel shows
   that worker's own payslip figure. This is held locally and never transmitted.
7. Click **Confirm my record**. Your browser proves that the row filed under this worker's
   identity matches this worker's payslip — without revealing either number.
8. Repeat for several workers. Watch the **Coverage** bar fill up.

### Part 3 — Catch the tampering

9. Go back and file the **Tampered** payroll instead, then commit it.
10. Confirm as Worker 02 through Worker 10. Each one succeeds.
11. Now confirm as **Worker 01**. It fails: the record filed about them is not what they were
    paid. The app offers a dispute instead.
12. Click **Dispute my record**. The dispute is recorded on-chain.
13. Look at the coverage bar. The confirmation rate has stalled below full, and a dispute is
    showing — **while no salary has appeared anywhere**. That is the whole product in one
    screen: the lie became visible, the pay did not.

---

## What Gets Proved (and What Stays Private)

**Public — anyone can read this on-chain:**

- Which reporting period and job category the filing covers.
- The Merkle root committing to the payroll snapshot.
- Each pay group's headcount and *total* pay, and the gap derived from them.
- How many records were committed, confirmed, and disputed.
- The set of spent nullifiers — one per worker per filing.

**Private — never leaves the machine that supplied it:**

- Every individual salary, on both the employer's side and the worker's.
- Each worker's identity key and their pay group.
- The Merkle path proving which row in the tree is theirs.
- What the employer filed about any particular worker.

**Proved without being revealed:**

- *By the employer:* "the aggregate figures I am publishing were computed from exactly the
  snapshot I committed to." There is no step at which a gap could be computed from one
  dataset and a different one committed.
- *By a worker:* "the record filed under my identity matches my own payslip" — or, in a
  dispute, "it does not" — without revealing which row is theirs, what they earn, or what
  the employer claimed they earn.

**Deliberate limits, stated plainly:**

- Aggregates leak when a group is tiny: with one person in a group, the group total *is*
  their salary. The contract therefore refuses to publish for groups below three.
- A confirmation reveals that *someone* confirmed — never who, and never their pay group.
- Zero-knowledge proves the arithmetic is consistent with the committed data. It does not
  prove the committed data is true. What it does is make a lie require hundreds of people
  to actively participate, instead of one person editing a spreadsheet.
- One job category, one snapshot, and 16 records per contract. Sized for a working MVP.

---

## Troubleshooting

**"No Midnight wallet detected."**
Lace is not installed or not enabled for this site. Install it, reload the page, and wait a
few seconds — the app polls for the wallet for five seconds before giving up.

**Proof generation hangs, or the wallet reports no proof server.**
Your wallet does not support delegated proving. Start a local proof server with
`docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0` and set its URL (`http://localhost:6300`)
in the wallet's settings.

**"The filed record does not match this payslip."**
This is not a bug — it is the product working. The employer filed something different from
what this worker was paid. Use **Dispute my record** instead.

**"This worker has already confirmed or disputed this filing."**
Each worker gets exactly one action per reporting period, enforced by a nullifier. Pick a
different worker, or deploy a fresh filing.

**"A pay group is below the minimum publishable size."**
The payroll has fewer than three people in one of the groups, so publishing an aggregate
would identify them. Add more records to that group.

**"Could not reach the proof server or indexer."**
Check your network, and confirm your wallet is set to the same network as the app (Preprod).

**Transaction fails with a fee or balance error.**
The wallet needs test funds. Top it up from the Preprod faucet and try again.
