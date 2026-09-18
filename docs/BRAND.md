# Parity — Brand Brief

## Tagline

> A gender pay-gap filing that can be verified — without anyone seeing a single salary.

Short form, for tight spaces: **The figure is provable. The salaries stay private.**

## Three Key Messages

1. **Proof, not promises.** Today a pay-gap figure is whatever the employer says it is. With
   Parity the published figure and the committed payroll leave the same circuit, so the number
   cannot come from a payroll other than the one on record.
2. **Every worker is a check.** Each worker confirms or disputes the row filed about them, once,
   in zero knowledge. A lie now needs hundreds of people to go along with it, not one person
   editing a spreadsheet.
3. **Transparency without exposure.** The EU Pay Transparency Directive demands disclosure and
   the GDPR demands minimisation. Parity satisfies both at once: the gap and coverage are public,
   and no salary, identity or row is ever revealed.

## Color Palette

Taken from the live product (`src/App.css`), so the brand and the app always match.

| Role | Name | Hex |
|------|------|-----|
| Primary | Parity Orange | `#F26F1A` |
| Primary (hover / pressed) | Deep Orange | `#E0620F` |
| Accent — verified / confirmed | Proof Green | `#2E9E6B` |
| Accent — disputed | Signal Red | `#E2574C` |
| Text | Ink | `#33404F` |
| Secondary text | Slate | `#6B7A8C` |
| Background | Cream | `#FFF9F2` |
| Private-data tint | Warm Tint | `#FFF4E8` |

Orange means *private input*; green means *public, verified output*. The diagrams in the README
use the same split, so the colors carry the privacy model.

## X Profile Bio

> Verifiable gender pay-gap reporting. The figure is provable; the salaries stay private. Built on Midnight.

*106 characters (limit 160).*

## X Banner Concept

The shipped banner is [`brand/x-banner.png`](../brand/x-banner.png) (3000×1000). The concept:

- **Left side:** a column of blurred, cream-on-orange salary rows — private inputs, deliberately
  unreadable.
- **Centre:** they funnel into a single circuit mark (the Parity logo), drawn as a narrow gate.
- **Right side:** only three clean, legible outputs come out, in Proof Green: the pay gap, the
  headcount per group, and a coverage line such as *"7 of 10 confirmed · 1 disputed"*.
- **Tagline** set small along the bottom right: *The figure is provable. The salaries stay
  private.*
- Keep the bottom-left ~400 px clear, where X overlays the avatar.
