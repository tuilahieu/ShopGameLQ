# CSS structure

All frontend CSS lives in this directory. Do not add stylesheets beside React
components or pages.

```text
css/
  index.css                 global cascade entry and import order
  base/
    legacy.css              pre-refactor global compatibility layer
    foundation.css          tokens, reset and shared primitives
  shared/
    app-shell.css           loading, motion, media and shared shell polish
  storefront/
    layout.css              customer route layouts
    theme.css               customer visual theme (formerly client-toy.css)
    editorial.css           final storefront composition overrides
    system.css              canonical storefront components and tokens
    pages/                  route-specific customer styles
    components/             styles owned by a customer component
  admin/
    workspace.css           admin/CTV workspace visual system
    ui-components.css       admin UI components and shell refinements
```

## Rules

- Preserve the order in `index.css`; later files intentionally refine earlier
  compatibility layers.
- Scope product styles below `.client-page` or `.workspace-shell`.
- Put route-only rules in `storefront/pages` and component-only rules in the
  appropriate `components` directory.
- Bundle loading uses the branded overlay. Page skeletons are only for data
  loading and must mirror the loaded layout at desktop and mobile breakpoints.
- Respect `prefers-reduced-motion` for animation.
