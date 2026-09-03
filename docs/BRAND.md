# BPS — Demo Brand System

Working brand system used in this storefront. Small enough to hold in your head; every value lives in `frontend/src/styles.css` under `:root`.

## Idea

Transit ephemera as streetwear. The boarding pass is the hero object — it's honest paper: it says exactly where you're going and when. Everything in the UI borrows from things you'd find in an airport: departure boards, rubber stamps, perforated stubs, barcodes, gate and seat codes.

## Palette

| Token | Hex | Use |
|---|---|---|
| Paper | `#F3F0E9` | Page background, pass stock |
| Ink | `#0E0E10` | Type, borders, dark sections |
| Safety Orange | `#FF4F12` | The one loud accent. Headline emphasis, eyebrows, hover states |
| Signal Yellow | `#F2C230` | Departure-board data, info stamps, shipping bar |
| Stamp Red | `#C8102E` | Errors, sale strikethrough context |
| Tarmac Grey | `#6B6E70` | Secondary text, muted labels |

Rule: orange is a hit, not a fill. One per component, max.

## Type

- **Display** — Barlow Condensed 700/800, all caps, tight leading (`.86–.95`). Headlines, product names, buttons.
- **Data** — Space Mono. SKUs, prices, gate codes, PNRs, labels. Anything that would be printed by a machine.
- **Body** — Inter 400/500. Descriptions and UI copy only.

Self-hosted via Fontsource — no external font requests.

## Motifs

- **Boarding pass** — main + detachable stub, dashed perforation with punched circles (`.perf`)
- **Departure board** — dark section, yellow mono data, blinking BOARDING status
- **Stamps** — bordered mono tags, rotated −1.5°: BOARDING · LIMITED · STANDBY · DEPARTED · NEW · SALE
- **Barcodes** — seeded CSS barcodes, stable per SKU / PNR
- **Hard shadows** — `14px 14px 0 ink` on the pass; `10px 10px 0` on modals. Print-like, not soft.
- **Grid paper** — faint 48px grid behind the hero

## Vocabulary

Status words come from the board, not from retail:

| Retail | BPS |
|---|---|
| In stock | Boarding |
| Low stock | Limited |
| Sold out | Standby |
| Discontinued | Departed |
| Cart | Bag |
| Checkout | Gate |
| Order # | PNR |
| Order history | My trips |
| Waitlist | Standby list |

## Lanes

| Lane | Code | Voice |
|---|---|---|
| Transit Minimal | TM | Tonal, quiet, one orange hit |
| Destination Loud | DL | Big graphics, capsule drops, colour |
| Tarmac Utility | TU | Workwear, canvas, reflective, hi-vis |

Capsule 001: **E.A.R.T.H.** — "Earth is a giant escape game."

## Open items for the real brand

- Trademark search on "Boarding Pass Clothing" and "BPS" before any public use
- Final wordmark (the demo uses a type-only lockup)
- Photography direction per lane
