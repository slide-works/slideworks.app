# SlideWorks design assets

Reference material for anything that should look like SlideWorks: the website, the docs, a social post or a slide.

These are placeholders (SW-105). The palette is **Cobalt**, the default from SW-1 D4 and SW-2 D2; the type is **Plus Jakarta Sans** for headings and **Inter** for body text. The mark is a stand-in (two stacked slides on a cobalt gradient square) until a real one is designed.

| Path | What it is |
|---|---|
| `brand/favicon.svg` | The mark, switching between light and dark with the visitor's theme. |
| `tokens/tokens.css` | Website tokens: colour, fonts, radii and shadows, light and dark. `site/tokens.css` is a copy. |
| `social/og-card.html` | The 1200×630 social card. `social/og-image.png` and `site/og-image.png` are its screenshot. |

## Palette: Cobalt

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#f4f5f7` | `#0f1424` | Page background |
| `--color-surface` | `#ffffff` | `#171d31` | Cards, bars, inputs |
| `--color-border` | `#dcdfe7` | `#2c3552` | Borders and dividers |
| `--color-text` | `#161b2e` | `#eef1fa` | Body text |
| `--color-muted` | `#59607a` | `#a3abc6` | Secondary text |
| `--color-accent` | `#2f5bea` | `#7f9cff` | Primary actions, links, focus |
| `--color-accent-soft` | `#e6ecfd` | `#1d2a5c` | Selected and hover backgrounds |

The brand gradient for the mark and highlighted headline words is `#2f5bea → #1e3a8a` in light and `#7f9cff → #4f74f5` in dark.

## To do

- A real mark, logo lockups and a 512×512 avatar for the GitHub org.
- Replace the live mock-ups on the page with the shipped screens where they differ, once the first release is out.
