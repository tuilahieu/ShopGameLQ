# Shop Liên Quân — Design System

This document records the visual direction approved on the Home page. Page-specific work must preserve behavior and apply these rules without changing unrelated routes.

## Direction

- Editorial game-store presentation with warm paper surfaces and restrained tactile depth.
- Client rollout is reviewed in two-page batches; shared tokens and shell fixes apply to every client route in the same implementation pass.
- Storefront may be expressive; Admin and CTV use a denser operational variant of the same brand.
- Avoid neon-purple gaming UI, generic blue dashboard cards, excessive pills, and oversized empty card bodies.

## Theme architecture — source of truth

Theme implementation must use three layers. Components may consume semantic or component tokens, never raw palette values.

```text
Primitive palette
    ↓
Semantic roles: canvas / section / card / text / action / status
    ↓
Component roles: button / input / card / modal / navigation / skeleton
```

- `Light` is warm paper, dark ink, brick red, and muted gold.
- `Dark` is warm charcoal—not navy, pure black, or inverted Light mode.
- Dark mode must visibly separate four depth levels: canvas → section → card → elevated overlay.
- Brand red has separate tokens for **text/icon accents** and **filled controls**. A bright coral that works as text must not automatically become a button background.
- Page CSS may override spacing or composition, but may not invent another palette.

### Semantic color tokens

| Semantic role | Light mode | Dark mode | Intended use |
| --- | --- | --- | --- |
| `--client-canvas` | `#fff8e9` | `#111620` | Body/page backdrop behind every section |
| `--client-section` | `#fffdf8` | `#202229` | Page-level panels and category sections |
| `--client-card` | `#ffffff` | `#2b2e38` | Product, category, order, profile, and form cards |
| `--client-surface-subtle` | `#f8efd9` | `#343844` | Image wells, table rows, input groupings, quiet callouts |
| `--client-surface-elevated` | `#fffefa` | `#303440` | Modal, popover, drawer, sticky purchase bar |
| `--client-text` | `#202027` | `#fffaf0` | Headings, product names, important values |
| `--client-text-secondary` | `#575765` | `#d8d1c6` | Descriptions, labels, metadata |
| `--client-text-muted` | `#62677a` | `#bcb5ab` | Timestamps, helper text, tertiary copy |
| `--client-divider` | `#d8d0c3` | `#4d5360` | Non-interactive dividers inside a surface |
| `--client-border` | `#b9b0a3` | `#737b89` | Card and section boundaries |
| `--client-control-border` | `#777069` | `#8b94a3` | Inputs, selects, checkboxes, inactive controls |
| `--client-accent-text` | `#9f3025` | `#ff826f` | Kicker, active link, icon, inline accent |
| `--client-primary` | `#c64232` | `#b94334` | Filled primary button only |
| `--client-primary-hover` | `#ad3629` | `#a6382c` | Hover/focus-hover primary button |
| `--client-primary-pressed` | `#8e2c23` | `#84291f` | Pressed primary button and tactile lower edge |
| `--client-on-primary` | `#ffffff` | `#ffffff` | Text/icon on filled primary controls |
| `--client-gold` | `#95520f` | `#ffd18a` | Price, sale value, premium emphasis |
| `--client-gold-soft` | `#fff0d5` | `#473823` | Price and promotion background |
| `--client-success` | `#276a4c` | `#7bddab` | Available, completed, valid |
| `--client-success-soft` | `#e5f3eb` | `#1d3d33` | Success callout background |
| `--client-danger` | `#a52a24` | `#ff8c84` | Error, sold, destructive text/icon |
| `--client-danger-soft` | `#fff0ee` | `#492725` | Error callout background |
| `--client-warning` | `#8a570d` | `#f4ca72` | Pending and attention states |
| `--client-warning-soft` | `#fff4d7` | `#44371e` | Warning callout background |
| `--client-focus` | `#263fc3` | `#ffd166` | Keyboard focus ring only |
| `--client-scrim` | `rgb(25 20 18 / 0.52)` | `rgb(4 5 8 / 0.76)` | Modal/drawer background isolation |

### Measured contrast baseline

These pairs are fixed acceptance values, calculated using WCAG relative luminance. A replacement color must meet or exceed the same applicable threshold.

| Pair | Ratio | Requirement |
| --- | ---: | --- |
| Light primary text / card | `16.19:1` | Pass AA/AAA |
| Light secondary text / section | `6.99:1` | Pass AA |
| Light muted text / section | `5.52:1` | Pass AA |
| White / Light primary button | `4.97:1` | Pass AA for normal text |
| Light accent text / section | `7.07:1` | Pass AAA |
| Light focus ring / section | `8.00:1` | Clearly visible |
| Dark primary text / card | `13.02:1` | Pass AA/AAA |
| Dark secondary text / section | `10.48:1` | Pass AA/AAA |
| Dark muted text / card | `6.67:1` | Pass AA |
| White / Dark primary button | `5.36:1` | Pass AA for normal text |
| Dark accent text / section | `6.56:1` | Pass AA |
| Dark border / card | `3.18:1` | Pass non-text boundary target |
| Dark focus ring / section | `11.01:1` | Clearly visible |

### Surface and elevation contract

| Level | Light mode | Dark mode | Border and shadow |
| --- | --- | --- | --- |
| Canvas | Warm illustrated background under a `86–92%` cream wash | Same artwork under an `88–94%` charcoal wash | Artwork must never reduce text contrast |
| Section | `--client-section` | `--client-section` | 1px `--client-border`; short tinted shadow |
| Card | `--client-card` | `--client-card` | Must be visibly different from section; dark card boundary uses `--client-border` at full opacity |
| Subtle/inset | `--client-surface-subtle` | `--client-surface-subtle` | Divider only; no floating shadow |
| Elevated | `--client-surface-elevated` | `--client-surface-elevated` | Strong border plus overlay shadow; reserved for modal/popover/drawer |

Never place section and card on the same background value in Dark mode. Never use transparent `color-mix()` as the only dark boundary; provide the solid token first.

## Typography

- Display: `Georgia, "Times New Roman", serif`; both fallbacks must render Vietnamese diacritics as complete glyphs.
- Body: `"Avenir Next", Avenir, "Segoe UI", Helvetica, Arial, sans-serif`.
- Use serif for page titles, section headings, category names, and product names only.
- Use tabular figures for prices, balances, counts, IDs, and timers.

### Text role mapping

| Content | Font treatment | Light color | Dark color |
| --- | --- | --- | --- |
| Page title / section title | Display, 700, tight tracking | `--client-text` | `--client-text` |
| Card title / product name | Display, 700 | `--client-text` | `--client-text` |
| Body and description | Body, 400–500, line-height `1.5–1.7` | `--client-text-secondary` | `--client-text-secondary` |
| Label / metadata | Body, 600 | `--client-text-secondary` | `--client-text-secondary` |
| Helper / timestamp | Body, 400 | `--client-text-muted` | `--client-text-muted` |
| Eyebrow / active link | Body, 800, slight positive tracking | `--client-accent-text` | `--client-accent-text` |
| Price / monetary value | Body, 800–900, tabular figures | `--client-gold` | `--client-gold` |
| Button label | Body, 800 | `--client-on-primary` | `--client-on-primary` |

- Body copy is never rendered with opacity. Use the correct semantic text token.
- Placeholder may use muted text, but entered values must use primary text.
- Text over an image requires a solid/gradient scrim that independently passes contrast; text-shadow alone is not sufficient.

## Layout

- Client storefront is **mobile-first without exceptions**: the default CSS/DOM order targets a 360px touch viewport; tablet and desktop are progressive enhancements using `min-width` queries.
- Storefront maximum content width: approximately `94rem` with adaptive gutters.
- Product/category grids: 2 columns on mobile, 3 on tablet, and no more than 4 on desktop.
- Four-card rows stretch evenly across the available content width; incomplete rows keep the same column tracks and start from the left instead of being recentered or resized.
- Cards size to content. Do not impose a tall aspect ratio on an entire card.
- Use a consistent 4/8px spacing rhythm.

## Component theme specification

All component states are defined for both themes. Hover is an enhancement; focus, pressed, disabled, loading, success, and error states must also be distinguishable without hover.

### Page shell and navigation

| Component | Light mode | Dark mode |
| --- | --- | --- |
| Body/client canvas | Cream wash over game artwork | Charcoal wash over the same artwork; no bright patches behind copy |
| Header/top bar | Elevated paper with subtle divider | `--client-surface-elevated` with full `--client-border` bottom edge |
| Desktop nav text | Secondary text; active uses accent text + soft red background | Secondary text; active uses accent text + dark brick-tinted background |
| Mobile bottom nav | Elevated paper, top divider | Elevated charcoal, strong top divider; active icon and label both change |
| Drawer/popover | Elevated paper | Elevated charcoal; no transparent glass without a solid fallback |
| Footer | Section paper, structural top line | Section charcoal, full-opacity structural line |

### Sections, cards, and media

| Component | Light mode | Dark mode |
| --- | --- | --- |
| Page-level section | `--client-section` | `--client-section` |
| Category/product/order card | White `--client-card` | Lighter charcoal `--client-card`, never same as section |
| Card border | 1px `--client-border`, may be visually subtle | 1px full `--client-border`; minimum 3:1 against card |
| Card shadow | Short warm gray downward shadow | Near-black shadow plus visible border; shadow alone is insufficient |
| Card hover | Slight rise, stronger border, deeper shadow | Same motion; border brightens to `--client-control-border` |
| Card pressed | Return downward, shorter shadow | Same; no color-only feedback |
| Image well | Soft paper | `--client-surface-subtle` |
| Image boundary | Divider between image and copy | Full divider so dark card does not merge with dark image edges |
| Empty image fallback | Soft paper + primary text/icon | Subtle charcoal + primary text/icon |

Cards size to content. An incomplete row keeps normal track width and starts from the left; it must not create a giant empty card or stretch one card across the section.

### Buttons and links

| Variant/state | Light mode | Dark mode |
| --- | --- | --- |
| Primary default | Brick `--client-primary`, white label, pressed-red lower edge | Darker brick `--client-primary`, white label, pressed-red lower edge |
| Primary hover | `--client-primary-hover`, rises 2px | `--client-primary-hover`, rises 2px |
| Primary pressed | `--client-primary-pressed`, moves down 2px | `--client-primary-pressed`, moves down 2px |
| Primary disabled | Subtle surface, muted text, no shadow | Subtle surface, muted text, no shadow |
| Outline default | Transparent/card background, control border, accent text | Card background, control border, light accent text |
| Ghost/text link | Accent text with underline on hover/focus | Light accent text with underline on hover/focus |
| Destructive | Danger text/border; filled only after confirmation | Light danger text on danger-soft; filled background must keep 4.5:1 label contrast |

- Filled buttons are at least `44px` high and retain a visible boundary in both themes.
- Never use bright coral as a filled Dark-mode CTA when white text falls below `4.5:1`.
- Icons inherit the label color. Icon-only buttons require an accessible name and `44×44px` hit area.

### Forms and filters

| Part | Light mode | Dark mode |
| --- | --- | --- |
| Field background | Card white | `--client-surface-elevated` |
| Field border | `--client-control-border` | `--client-control-border` |
| Field value | Primary text | Primary text |
| Placeholder | Muted text | Muted text |
| Hover | Stronger border | Stronger/lighter border |
| Focus | 3px `--client-focus` ring + border | 3px gold `--client-focus` ring + border |
| Invalid | Danger border, danger text, danger-soft message | Light danger border/text, dark danger-soft message |
| Disabled/read-only | Different surface and cursor; retain legible value | Same; disabled must not resemble editable state |

Labels remain visible above or beside fields. Error text is placed next to its field and is never communicated by color alone.

### Price, badges, and statuses

| Meaning | Light mode | Dark mode |
| --- | --- | --- |
| Price / sale value | `--client-gold` on normal surface | Light `--client-gold` on charcoal |
| Available / completed | Success text + success-soft background + icon/text | Light success text + dark success-soft background + icon/text |
| Pending / attention | Warning text + warning-soft | Light warning text + dark warning-soft |
| Sold / error | Danger text + danger-soft | Light danger text + dark danger-soft |
| ID / neutral tag | Secondary text + subtle surface + border | Secondary text + subtle surface + full divider |
| Sale badge | Dark readable text on warm gold | Near-black text on light gold; do not put white on yellow |

Pills are reserved for statuses and compact metadata. Category names and primary actions remain rectangular controls.

### Tables, summaries, and credentials

- Table/header background: subtle surface in both themes.
- Body rows alternate only when it improves scanability; use section/card tokens, not opacity.
- Row dividers use `--client-divider`; interactive row focus uses `--client-focus`.
- Labels use secondary text; values use primary text; monetary totals use gold.
- Login credentials render as a two-column definition list when space allows and stack below `24rem`.
- Copy buttons have a visible boundary and confirmation text/icon; copied state is not color-only.

### Modal, drawer, toast, and sticky bars

| Component | Light mode | Dark mode |
| --- | --- | --- |
| Scrim | Warm black at `52%` | Near-black at `76%` |
| Dialog surface | Elevated paper | Elevated charcoal clearly lighter than canvas |
| Dialog border | Strong control border | Full `--client-control-border` |
| Header/footer | Subtle surface | Subtle charcoal, separated by divider |
| Toast | Elevated surface with semantic side edge | Elevated surface with light semantic side edge |
| Sticky purchase bar | Elevated surface + top divider | Elevated charcoal + strong top divider and shadow |

Backdrop blur is optional enhancement. Without blur, the solid scrim and dialog must still isolate content clearly.

### Skeleton and loading states

- Skeleton shell uses the same theme tokens as the final section/card, including Dark-mode borders.
- Shimmer base/highlight in Light: `#e7dfd2` / `#f8f2e8`.
- Shimmer base/highlight in Dark: `#3b404c` / `#555c69`.
- Dark shimmer must be visible but quieter than real text; it may not flash white.
- Skeleton preserves the exact final grid, card dimensions, image ratio, padding, radius, border, and shadow.

### Radius, shadow, and focus

- Radius: `0.4rem–0.85rem` for controls/cards and up to `1rem` for page-level surfaces.
- Light surface shadow: short warm-gray lower edge plus low-opacity ambient shadow.
- Dark surface shadow: near-black lower edge; always paired with a visible border.
- Keyboard focus: 3px ring with 2px offset. Light uses blue; Dark uses gold.
- Never remove focus outline unless the component supplies the approved replacement.

## Page-specific theme behavior

### Home

- Light: cream canvas, paper section, white cards, brick CTA, dark editorial headings.
- Dark: `#202229` section and `#2b2e38` cards. The old `#090a0e` structural line is prohibited because it disappears against charcoal.
- Category cards, account cards, trust blocks, flash sale, and hero each need an explicit Dark surface and boundary.
- The animated “ACC GIÁ RẺ” heading uses a light coral/gold gradient in Dark mode and must retain a solid-color fallback.

### Account catalogue

- Light category view uses paper section with white category cards.
- Dark category view uses `--client-section`; category cards use `--client-card`; both may not use the same `--catalogue-paper` value.
- Kicker and links use the lighter Dark accent-text token. Stock CTA uses the darker filled-primary token with white text.
- Catalogue skeleton uses the same section/card separation as loaded content.

### Account detail

- Gallery and purchase panel use card surface; the page behind them uses canvas/section surface.
- Image stage remains near-black in both themes, with a visible gallery boundary.
- Price panel uses gold-soft; specification rows use dividers visible in both themes.
- Confirmation and success dialogs use elevated surface and the same credentials treatment as order history.

### Purchased accounts

- Order cards use card surface against the page canvas; footer divider stays visible in Dark mode.
- Credential modal uses elevated surface, strong border, primary/secondary text mapping, and success callout tokens.

## Theme implementation plan

1. **Consolidate tokens:** define the semantic table once in `foundation.css`/the client theme scope and map existing legacy names to it temporarily.
2. **Remove palette conflicts:** replace Home-only, catalogue-only, and `client-toy.css` Dark values that redefine the same semantic role differently.
3. **Fix depth first:** apply canvas → section → card → elevated surfaces and full Dark borders before polishing accents.
4. **Map typography:** replace opacity and raw gray declarations with primary/secondary/muted roles.
5. **Map controls:** migrate buttons, inputs, filters, navigation, focus, disabled, validation, and copy actions.
6. **Map feedback:** migrate price, success, warning, danger, sold, empty, error, toast, and loading states.
7. **Synchronize skeletons:** make every loading shell consume the same component tokens as its final UI.
8. **Remove raw page colors:** after visual parity, page files may retain only documented component tokens or approved artwork overlays.
9. **Verify both themes together:** no page is complete if only one theme passes.

### Theme acceptance checklist

- Primary and secondary normal text reach at least `4.5:1` on their actual surface.
- Large display text reaches at least `3:1`; target remains `4.5:1` where practical.
- Control boundaries, meaningful icons, selected states, and focus indicators reach at least `3:1` against adjacent colors.
- Section and card are visually distinct at 360, 390, 768, 1024, 1440, and 1920px.
- Light and Dark screenshots are captured for default, hover, focus, pressed, disabled, loading, empty, error, and modal states.
- Contrast is measured from final composed colors, including image overlays and transparency.
- Dark mode contains no pure black page surface, no low-opacity gray body text, and no navy/purple card drift.
- Safari/WebKit fallback declarations appear before `color-mix()` or other progressive enhancements.

## Images — non-negotiable

- 100% of content images must expose a loading state until the image has loaded and `decode()` has completed.
- Use `SafeImage` for content images. Specialized images such as payment QR and assistant avatar must implement the same loading/decode/error contract.
- Loading state uses a reserved aspect ratio plus shimmer; never show a blank slot or cause layout shift.
- Failed images show a stable fallback in the same media slot.
- Below-fold images use native lazy loading; hero images may be eager/high priority.

## Skeleton loading — non-negotiable

- Skeleton must be a data-empty version of the final rendered component: identical container width, grid, aspect ratio, padding, radius, border, and shadow.
- Page surfaces and card shells are static UI and must render immediately. Only data-dependent regions such as images, text, counts, prices, tags, and action labels use shimmer.
- Card skeletons fill exactly one responsive row: 2 cards on mobile, 3 on tablet, and 4 on desktop. Never render arbitrary extra rows while waiting for data.
- The loading-to-content handoff must not resize the surrounding shell or cause visible layout shift.

## Motion and accessibility

- Animate only `transform` and `opacity` for interaction feedback.
- Respect `prefers-reduced-motion`.
- Normal text contrast must meet WCAG AA.
- Every icon-only control needs an accessible name; decorative icons are hidden from assistive technology.
- No horizontal page overflow at 360, 390, 768, 1024, 1440, or 1920px.

## Browser compatibility — non-negotiable

- Ship both modern and legacy JavaScript bundles. Baseline support: Safari/iOS Safari 12+, Chromium/Chrome 64+, Edge 79+, and Firefox 68+; current stable Safari, Chromium, and Firefox remain the primary QA targets.
- Core browsing, authentication, checkout, purchased credentials, and copy actions must work without `:has()`, `color-mix()`, dynamic viewport units, `aspect-ratio`, Pointer Events, or `crypto.randomUUID()` support.
- Newer CSS may enhance the presentation only after a plain-value fallback. Pair `vh` before `dvh`, physical positioning before logical inset properties where fixed UI is critical, and fixed/min-height media fallbacks before `aspect-ratio`.
- Hover, pinch, pointer capture, backdrop blur, and smooth motion are enhancements. Every primary action must remain available through click/tap and keyboard controls.
- QA each client batch at 360px and 390px first, then 768px and desktop. Include Safari/WebKit and Chromium, keyboard navigation, reduced motion, 200% zoom, slow image loading, image failure, and loading-to-content layout stability.

## Client site plan — two-page review batches

| Batch | Pages | Required loaded and loading composition |
| --- | --- | --- |
| 1 | Account detail (`/account/:id`) + purchased accounts (`/my-orders`) | Detail is gallery above purchase/specification content on mobile and two columns on large screens. Orders are one column on mobile and two from tablet. Purchase success and order credentials reuse one dialog treatment. |
| 2 | Home (`/`) + catalogue (`/accounts`) | Home keeps hero, notice, category/account discovery, sale, and trust regions. Catalogue keeps category selection and filtered-results modes. Both skeletons render one responsive card row only. |
| 3 | Login (`/login`) + register (`/register`) | One focused auth card, visible labels, stable captcha slot, validation adjacent to fields, and no theme flash. Auth skeleton preserves card width, fields, and submit position. |
| 4 | Profile (`/profile`) + recharge (`/nap-tien`) | Profile separates identity/navigation from account and transaction cards. Recharge keeps intro, two numbered steps, action row, QR/payment dialog, expiry, success, and failure states. |
| 5 | Terms (`/terms`) + contact (`/contact`) | Terms use intro plus readable policy cards; contact uses compact support-channel rows. The 404 route inherits the same shell, surfaces, actions, and footer acceptance criteria. |

Each review batch must be shown in Light and Dark at mobile width first. A batch is not accepted until its skeleton, empty/error state, modal where applicable, focus state, and old-WebKit fallback preserve the same information architecture as loaded content.

## Full-site Admin and CTV rollout

Admin and CTV inherit the same semantic meanings as the storefront, but use a compact sans-serif operational layout. They may reduce decorative spacing; they may not weaken contrast, touch targets, state feedback, or browser support.

### Operational theme mapping

| Component role | Light mode | Dark mode |
| --- | --- | --- |
| Workspace canvas | Warm gray-paper `#f6f3ee` | Charcoal `#111620` |
| Card / toolbar / table row | White `#ffffff` | Raised charcoal `#202229` |
| Inset row / filter / table head | Warm inset `#f3eee6` | Lighter inset `#2b2e38` |
| Primary text | Ink `#202027` | Warm white `#fffaf0` |
| Secondary / muted text | `#575765` / `#62677a` | `#d8d1c6` / `#bcb5ab` |
| Structural / control border | `#d8d0c3` / `#a69d90` | `#4d5360` / `#737b89` |
| Filled primary action | Brick `#c64232` with white text | Dark brick `#b94334` with white text |
| Text/icon accent | Dark brick `#9f3025` | Coral `#ff826f` |
| Success / destructive / warning | `#276a4c` / `#a52a24` / `#8a570d` | `#7bddab` / `#ff8c84` / `#f4ca72` |
| Modal / popover | White card plus strong border and scrim | Raised charcoal plus strong border and dark scrim |

- The top navigation exposes every route on desktop; the drawer exposes the same groups on mobile.
- Tables use compact semantic cards at `<= 672px`, with field labels and a dedicated mobile sort control. Wider screens keep the sortable table viewport, sticky selector/action columns, and horizontal scrolling where required. Mobile forms stack to one column.
- Create/edit/destructive actions use inline validation, toast feedback, and a real confirmation dialog; native `alert()` is not an accepted state.
- Table loading, empty, API error, filtered-empty, saving, disabled, success, and destructive states are required—not optional polish.
- Admin verification, custom selects, and portalled dialogs carry their own theme variables so they remain correct without `:has()`.

### Admin and CTV review batches

| Batch | Routes | Acceptance focus |
| --- | --- | --- |
| A1 | Admin shell + verification + `/admin` + `/admin/users` | Navigation parity, gate contrast, KPI hierarchy, responsive tables, balance adjustment modal. |
| A2 | `/admin/accounts` + `/admin/orders` | Dense inventory workflow, image loading/failure, bulk selection, edit/confirm dialogs, sticky table actions. |
| A3 | `/admin/transactions` + `/admin/sales` | Monetary alignment, filters, pending/success states, account selector modal, discount calculations. |
| A4 | `/admin/discounts` + `/admin/categories` | Create/edit forms, validation, enable/disable state, empty/error recovery. |
| A5 | `/admin/account-types` + `/admin/banks` | Configuration forms, image/QR previews, ordering/status actions, delete confirmation. |
| A6 | `/admin/setting` + `/admin/logs` | Long-form settings navigation, secret controls, upload states, webhook feedback, audit-table readability. |
| C1 | `/ctv` + `/ctv/accounts` | Mobile-first KPI cards, account create/edit form, image preview, availability status, hide confirmation. |
| C2 | `/ctv/orders` + shared CTV shell | Order history table, error/empty/loading states, Light/Dark navigation and old-WebKit interaction fallback. |

Every operational batch is reviewed at 360/390px first, then 768px and desktop in both themes. A batch must also pass keyboard-only use, 200% zoom, reduced motion, slow/failing images, and the legacy production bundle before it is marked complete.

## Full-site execution queue — exactly two screens per review

The implementation stops for review after each row. Shared shell/token fixes may be made globally, but visual composition changes for later rows are not considered approved early.

| Review | Screen 1 | Screen 2 | Main deliverable |
| ---: | --- | --- | --- |
| 01 | Account detail `/account/:id` | Purchased accounts `/my-orders` | Gallery + purchase panel; order-card grid + synchronized credential modal. |
| 02 | Home `/` | Catalogue `/accounts` | Discovery hierarchy, category/product cards, filters, responsive one-row skeletons. |
| 03 | Login `/login` | Register `/register` | Focused auth flow, inline validation, captcha stability, redirect notice. |
| 04 | Profile `/profile` | Recharge `/nap-tien` | Account/transaction information; bank selection, payment intent, QR modal and expiry states. |
| 05 | Terms `/terms` | Contact `/contact` | Readable policy structure and compact support channels. The 404 screen is bundled with this review because it reuses the same shell and actions. |
| 06 | Admin verification screen | Admin dashboard `/admin` | Secure-entry states, navigation shell, KPI hierarchy, recent activity and system health. |
| 07 | Users `/admin/users` | Accounts `/admin/accounts` | Search/filter tables, permission and balance actions, inventory create/edit/bulk workflows. |
| 08 | Orders `/admin/orders` | Transactions `/admin/transactions` | Order/account status legibility, money alignment, date/type filters and recovery states. |
| 09 | Sales `/admin/sales` | Discounts `/admin/discounts` | Account selector modal, calculated prices, promotion CRUD and enabled/expired states. |
| 10 | Categories `/admin/categories` | Account types `/admin/account-types` | Taxonomy forms, ordering/status controls, media previews and delete safeguards. |
| 11 | Banks `/admin/banks` | Settings `/admin/setting` | Bank/QR setup, long settings navigation, uploads, secrets and webhook feedback. |
| 12 | Logs `/admin/logs` | CTV dashboard `/ctv` | Audit-table scanning plus CTV KPI/action hierarchy within the shared workspace shell. |
| 13 | CTV accounts `/ctv/accounts` | CTV orders `/ctv/orders` | Mobile-first listing workflow, image upload/preview, selling states and order history. |

### Review output for every pair

Each review handoff includes the same evidence so approval is comparable:

1. Mobile Light at `390px` for both screens; add `360px` when content or controls approach the viewport edge.
2. Mobile Dark at `390px` for both screens, including at least one loading/error/empty state relevant to the pair.
3. Desktop Light and Dark at `1440px`; add `768px` for any grid, table, or two-column form transition.
4. Modal/drawer/popover opened where the screens contain one; focus ring and keyboard close must be visible.
5. Slow-image and failed-image state for screens containing account art, avatar, QR, banner, or uploaded media.
6. Confirmation that modern build, legacy build, lint, no horizontal page overflow, and no console error pass.

Approval of one theme or one breakpoint does not approve the pair. Requested revisions stay inside the active pair unless they expose a shared token or shell defect.

## Page-by-page composition contract

### Storefront

- **Home:** header and announcement; editorial hero; category discovery; newest/sale account grids; trust/support section; footer. Mobile keeps the CTA and first products above unnecessary decorative content.
- **Catalogue:** category mode when no type is selected; results mode with title, result count, filters and account grid when selected. Filter controls stack on mobile and never force page-level horizontal scrolling.
- **Account detail:** back navigation; media gallery; availability/ID; title and price; benefits/specification rows; discount field; purchase action; warning; image viewer and purchase result dialogs.
- **Purchased accounts:** one card per purchase with stable image ratio, purchase metadata and a single credentials action. Credentials never appear as an uncontrolled alert.
- **Login/Register:** one primary task per card, permanent labels, password affordance, adjacent field errors, reserved captcha height, clear cross-link and success/redirect notice.
- **Profile:** identity summary; account actions; password/account form; transaction/history surfaces. Sensitive values and destructive actions must be visually separated.
- **Recharge:** current balance; numbered amount/bank steps; selected-bank summary; submission feedback; payment modal with QR, account details, copy actions, countdown, paid/expired/error states.
- **Terms:** narrow readable measure, section navigation where useful, numbered policy cards and update metadata.
- **Contact:** primary support channel first, consistent icon rows, clear external-action labels and response expectations.
- **404:** concise explanation, return-home and browse-accounts actions; never a blank shell.

### Admin

- **Verification:** introduction/trust context and focused verification card. Invalid, rate-limited, loading and expired-session states remain in the same geometry.
- **Dashboard:** KPI cards, trend/supporting labels, operational summary and prioritized quick actions. Color is supplementary—not the sole indicator.
- **Users:** search plus pagination; role/status badges; balance adjustment modal with amount, description, idempotent submit and inline error; permission/ban actions require clear consequences.
- **Accounts:** filter/search; responsive create/edit form; image and gallery preview; inventory table; bulk selection bar; sold/hidden safeguards; loading skeleton mirrors table columns.
- **Orders:** searchable order/account/buyer information, credentials-safe display, status and timestamp scanning; empty/error states include a recovery action.
- **Transactions:** amount values use tabular figures and signed/status treatment; filters remain usable at 360px; pending/success/error remain readable without color.
- **Sales:** sale summary; selectable unsold-account modal; original and final prices; start/end validity and active state.
- **Discounts:** code details, amount/type, limits and validity; create/edit validation; enable/disable and destructive confirmation.
- **Categories:** compact taxonomy form plus ordered list/table; active visibility; image preview if present; deletion reports dependent data clearly.
- **Account types:** category relationship, name/description, dynamic fields or metadata, visibility/order and guarded deletion.
- **Banks:** bank identity, owner/account number, QR preview, enabled/default state and safe edit/delete workflow.
- **Settings:** sticky local section navigation on desktop and linear flow on mobile; branding/media, contact, payment, security, assistant and webhook sections; dirty/saving/saved/error feedback per section.
- **Logs:** filterable audit table with actor, action, target, time and detail; long payloads truncate safely and remain accessible on demand.

### CTV

- **Dashboard:** four concise metrics that become a 2-column then 1-column layout as needed, followed by the two highest-priority actions.
- **Accounts:** create/edit form above the list on mobile; type, price, description and image inputs; stable preview; selling/hidden/sold state; guarded hide action.
- **Orders:** account, buyer, price and purchase-time fields; semantic cards with mobile sorting on narrow screens and a full table viewport above mobile; loading, filtered-empty, API error and pagination states.

## Component and interaction completion matrix

Every reusable component must be complete before the final route using it is submitted for review.

| Component | Required states |
| --- | --- |
| Button / icon button | Default, hover enhancement, keyboard focus, pressed, disabled, busy; minimum `44px` touch target for primary mobile actions. |
| Input / textarea / select | Empty, value, placeholder, focus, invalid, disabled, helper/error text; native keyboard and old-WebKit fallback. |
| Card | Default, actionable hover/focus, selected where applicable, disabled/sold, loading shell and image failure. |
| Data table | Loading, populated, empty, filtered-empty, API error, sorting, selection, pagination and narrow-screen overflow. |
| Modal / drawer / popover | Open/close animation, reduced motion, scrim, initial focus, focus trap, Escape/close button, focus return and portalled Light/Dark tokens. |
| Toast / inline feedback | Success, error and informational tone; screen-reader announcement; no replacement of field-level validation. |
| Upload / media preview | Idle, choosing, uploading, decoding, loaded, failed, retry/remove; fixed geometry throughout. |
| Skeleton | Same outer shell, columns, padding, border, image ratio and responsive breakpoint as loaded content. |

## Current implementation checkpoint — 2026-09-29

- Foundation tokens, Dark contrast rules, browser baseline and two-screen review workflow are documented.
- Account detail, its image viewer/purchase dialogs, and purchased-account credential treatment have received the first engineering pass; Review 01 still requires explicit visual approval.
- Shared Admin/CTV navigation, warm Light/charcoal Dark semantic palette, portalled modal theme, custom-select fallback, UTF-8/password fallback and legacy idempotency-key fallback have received an engineering pass; operational batches remain pending explicit visual approval in the queue above.
- All Admin routes now use the shared operational shell and shared card/form/table/error/empty/modal primitives. Dashboard and settings have geometry-matched loading compositions; users and inventory include guarded actions and inline validation.
- CTV dashboard, accounts and orders have been migrated to the same system. Narrow data tables now become labeled cards with mobile sorting instead of forcing page-level horizontal scrolling; they remain pending Review 12/13 approval rather than implicitly approved.
- Engineering verification currently passes ESLint plus modern and legacy production bundles. Chromium smoke checks at `390px` pass without horizontal overflow for CTV accounts, Admin users/confirmation modal, and Admin settings in the tested themes.
- No later batch is marked complete until its Light/Dark screenshots and state checklist are reviewed.
