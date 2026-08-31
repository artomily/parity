# Parity — MVP Demo Video Script

A shot-by-shot script for the ~3 minute submission demo. Every number and label below
matches the real app; the run order is the one from [USAGE.md](USAGE.md).

**Setup before you hit record**

- Browser at `https://parity-tech.vercel.app/`, Lace unlocked and funded, zoom ~125%.
- Close every other tab. Hide bookmarks. Full screen.
- Do the whole flow once as a rehearsal — proof generation takes a few seconds and you
  want to know how long your pauses need to be.
- Record at 1080p and speak over it live. One take is fine; the dispute at the end is
  the moment that matters, so protect that.

---

## Shot 1 — The problem (0:00–0:25)

*On screen:* the Parity landing view, wallet not yet connected.

> From 2027, every EU employer with 150 or more staff has to publish its gender pay gap.
> Nobody can check whether that number is true. The employer computes it from its own
> payroll, and verifying the arithmetic would need the individual salaries — which
> data-protection law forbids disclosing. The UK's regulator has sent dozens of accuracy
> letters and issued zero fines. That isn't weak enforcement. It's missing evidence.
>
> This is Parity. It's built on Midnight, and it closes that gap.

## Shot 2 — Connect (0:25–0:35)

*Action:* click **Connect Lace wallet**. Let the extension popup appear and approve it.

> One wallet connect. No account, no sign-up, no personal data.

## Shot 3 — File the honest payroll (0:35–1:05)

*Action:* under **Which payroll does the employer file?** leave **The truth** selected.
Click **Deploy a new filing**, then **Commit payroll**. Let the proof spinner run — do
not cut this.

> The employer commits its payroll as a Merkle root, and the published figures are
> computed from that same snapshot inside one circuit. So there's no step where you
> could compute the gap from one dataset and commit a different one.
>
> That spinner is real work — your browser is generating a zero-knowledge proof.

## Shot 4 — What became public (1:05–1:30)

*Action:* scroll to **What became public**. Hold on it. Point at the group totals.

> Here's the whole filing, on-chain. The pay gap, each group's headcount, each group's
> *total* pay. What you do not see is a single salary — because a single salary was
> never sent. It stayed on this machine as a private witness.

## Shot 5 — Workers confirm (1:30–2:00)

*Action:* in **Each worker checks their own row**, pick a worker. Point at the payslip
figure and the "Held locally. Never sent anywhere." line. Click **Confirm my record**.
Repeat for two or three more workers, quickly. Let the coverage bar move.

> Now each worker checks the row filed about them. Their payslip figure is held locally.
> Confirming proves the record filed under their identity matches it — without revealing
> which row is theirs, what they earn, or what the employer claimed they earn.
>
> And the coverage figure is public: how many records were committed, how many confirmed.

## Shot 6 — The tampered filing (2:00–2:35)

*Action:* switch the payroll to **Tampered**. Deploy and commit again. Confirm as
Worker 02, 03, 04 — all succeed.

> Now the same employer files a tampered payroll: one worker's pay inflated, to make the
> gap look smaller. Watch — the other workers still confirm fine. Nothing about their
> rows changed.

## Shot 7 — The catch (2:35–3:00) — **the money shot**

*Action:* select **Worker 01**. Click **Confirm my record**. Let it fail on camera. Then
click **Dispute my record**. Hold on the coverage bar with the dispute showing.

> Worker 01 is the one who was lied about. Their confirmation fails — the record filed
> about them is not what they were paid. So they dispute it, and the dispute lands
> on-chain.
>
> Look at the coverage bar. The confirmation rate has stalled, a dispute is showing —
> and not one salary has appeared anywhere. Records invented to move an average are
> never confirmed by anyone, so they surface as a stalled confirmation rate.
>
> Fraud stops being one person editing a spreadsheet, and becomes a conspiracy that
> hundreds of people have to actively join. That's Parity.

## Shot 8 — Close (3:00–3:15)

*On screen:* the README on GitHub, showing the CI badge and the contract address table.

> Contract's live on Midnight, CI is green, code and docs are public. Links below.
