# First posts — Parity on X

Four posts for the launch of [@paritycompany](https://x.com/paritycompany), in order.
Post them over a couple of days rather than all at once; post 1 is the pin.

Before posting, check the Midnight account's real handle and add the mention to post 1 —
do not guess it. The contract address is `ec99ff0a…5dc9` on Preview, if you want it in a reply.

---

## Post 1 — Launch. Pin this one.

Image: [`brand/posts/post-1.png`](../brand/posts/post-1.png)

> From 2027, every EU employer with 150+ staff must publish its gender pay gap.
>
> Nobody can verify that number. Checking it needs the individual salaries — which data-protection law forbids disclosing.
>
> Parity proves the figure without revealing anyone's pay.
>
> Built on Midnight.

*277 characters.* The problem first, the product second. Nobody cares what you built until they believe the problem is real.

---

## Post 2 — Why this is not a solved problem

Image: [`brand/posts/post-2.png`](../brand/posts/post-2.png)

> The UK's pay-gap regulator flags suspicious filings by statistical implausibility.
>
> 30 accuracy letters in 2024. 42 in 2025.
>
> Fines issued to date: zero.
>
> That is not weak enforcement. It is missing evidence — the only proof of a filing is the payroll nobody is allowed to see.

*277 characters.* Concrete numbers, checkable by anyone. Establishes that the gap is structural, not a matter of trying harder.

---

## Post 3 — The privacy model

Image: [`brand/posts/post-3.png`](../brand/posts/post-3.png)

> Public on-chain:
> · the payroll's Merkle root
> · each group's headcount and total pay
> · how many workers confirmed
>
> Never transmitted:
> · every individual salary
> · which row is yours
>
> One circuit computes both, so the figure cannot come from a payroll other than the one committed.

*278 characters.* The disclosure surface, stated plainly. Builders will check this claim, so it has to be exact.

---

## Post 4 — The demo, with the video attached

Image: [`brand/posts/post-4.png`](../brand/posts/post-4.png)

> Live on Midnight.
>
> File an honest payroll. Then file a tampered one — and watch a worker's confirmation fail while the coverage rate stalls.
>
> Records invented to move an average are never confirmed by anyone.
>
> The lie surfaces. No salary does.
>
> parity-tech.vercel.app

*267 characters.* Ends on the demo. Attach `docs/demo/parity-demo.mp4` directly rather than
linking it — native video outperforms a link. Put the YouTube cut
(https://youtu.be/luBz-gQ5mzI) in a reply, so the post itself keeps the video inline.

---

## Profile bio (160 character limit)

> Verifiable gender pay-gap reporting. The figure is provable; the salaries stay private. Built on Midnight.

*106 characters.*

## Profile assets

- Avatar: `brand/avatar.png` (800×800)
- Header: `brand/x-banner.png` (3000×1000, safe area kept clear of the avatar crop)
- Website field: `https://parity-tech.vercel.app/`
- Post images: `brand/posts/post-1.png` … `post-4.png` (1600×900 at 2×)

Every asset is generated from the SVG sources next to it; `./brand/render.sh`
re-exports the PNGs after any edit.
