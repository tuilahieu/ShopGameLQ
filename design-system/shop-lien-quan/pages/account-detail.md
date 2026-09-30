# Account detail — page override

Inherits `../MASTER.md`. This file only records page-specific decisions.

- Default/mobile order: back link → gallery → purchase information → fixed purchase bar.
- At `64rem+`, use a two-column gallery/purchase layout; the purchase panel may become sticky.
- Gallery media reserves `4 / 3`; old WebKit receives an explicit height fallback. Thumbnails scroll horizontally and never widen the page.
- The purchase panel is a two-column definition-list treatment for labels and values, with wrapping values and tabular prices.
- Pinch/pan and `color-mix()` are progressive enhancements; zoom buttons and solid color/border fallbacks remain functional.
- Loading shell uses the same one-column default, `64rem+` two-column breakpoint, media ratio, border, radius, and shadow.

## Page color contract

| Part | Light | Dark |
|---|---|---|
| Page/canvas | warm cream `#fff8e9` | charcoal canvas `#111620` |
| Gallery shell | paper `#fffdf8`, border `#b9b0a3` | section `#202229`, border `#737b89` |
| Main image stage | near-black `#171c26`, strong border `#777069` | near-black `#080c12`, strong border `#8b94a3` |
| Purchase card | white `#ffffff` | raised charcoal `#2b2e38` |
| Primary/secondary text | `#202027` / `#575765` | `#fffaf0` / `#d8d1c6` |
| Price panel | gold-soft `#fff0d5`, price `#95520f` | brown-gold `#473823`, price `#ffd18a` |
| Availability | green-soft `#e5f3eb`, green `#276a4c` | deep green `#1d3d33`, mint `#7bddab` |
| Important notice | danger-soft `#fff0ee`, danger `#a52a24` | deep red `#492725`, coral `#ff8c84` |
| Primary CTA | brick `#c64232` + white | deep brick `#b94334` + white |

## Image viewer modal

- Light separates header `#f8efd9`, body `#f2eadc`, footer `#fffefa`, and near-black media stage `#0b1018`.
- Dark separates header `#2b2e38`, body `#171b24`, footer `#20242e`, and media stage `#06090e`; dialog and controls use the strong `#8b94a3` boundary.
- The footer stacks controls above the buy CTA on mobile. At `48.0625rem+`, zoom controls and CTA form two columns.
- `vh` precedes `dvh`, solid borders precede enhanced colors, and all essential selectors avoid `:has()` so old Safari/WebKit keeps the same hierarchy.
