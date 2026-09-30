# Project Agent Rules

## Loading states

- Loading a route bundle or lazy-loaded JavaScript chunk must use the dedicated branded loading overlay. Do not use a page-content skeleton for bundle loading.
- Keep bundle loading visually distinct from data loading so users do not see two different page skeletons in sequence.
- Use page skeletons only while waiting for the data that the mounted page will render.
- Every data skeleton must match the final rendered content it represents: same section order, layout direction, approximate dimensions, card count or visible density, spacing, aspect ratios, and responsive behavior.
- A skeleton must follow the same desktop and mobile composition as the real component. If content is hidden, reordered, converted to a horizontal rail, or resized at a breakpoint, its skeleton must do the same.
- Do not use a generic skeleton when the destination page has a specialized layout. Update the specialized skeleton whenever the corresponding UI structure changes.
- Skeleton containers must not introduce extra borders, wrappers, height, padding, or full-width constraints that are absent from the final content.
- Loading states must preserve the page footprint closely enough to avoid visible layout shifts when real data replaces the skeleton.
- When changing a page UI, verify both its loading and loaded states at desktop and mobile breakpoints before considering the work complete.
- Respect `prefers-reduced-motion` for all loading animations.

## Verification

- After changing loading behavior or skeleton styling, run the frontend lint and production build.
- Visually compare each specialized skeleton against the actual data-rendered page at the same viewport size.
