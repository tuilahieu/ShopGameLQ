# Frontend architecture

The frontend is migrating to a feature-oriented structure without changing
existing routes or UI behavior.

## Target structure

```text
src/
  app/              application composition, providers, router, bootstrap
  features/         business capabilities (storefront, checkout, admin, ctv)
  shared/
    api/            transport and API primitives
    components/     reusable, business-agnostic components
    hooks/          reusable hooks
    lib/            formatters, storage and generic utilities
  theme/css/        all CSS, grouped by base/shared/product responsibility
```

The legacy `pages`, `components`, `hooks`, `utils`, `api`, and `layouts`
directories remain valid during incremental migration. New business code
should be placed under `features`; new generic code should be placed under
`shared`. The `@` alias always resolves to `src`.

## Dependency direction

```text
app -> features -> shared
```

- `shared` must not import from `features` or `app`.
- A feature must not reach into another feature's private folders. Export a
  public entry module when cross-feature reuse is intentional.
- `app` owns composition only: routing, providers and browser startup.
- Route components remain lazy-loaded to keep customer and admin bundles
  isolated.

## Styling

`theme/css/index.css` is the only global stylesheet imported by the JavaScript
entry. Its import order is intentional. Component CSS also lives below
`theme/css/<product>/components` and may be imported by its owning component
when code splitting is useful. Do not add CSS files outside `theme/css`.

## Migration sequence

1. Move one route family into `features/<name>`.
2. Replace deep relative imports with `@/shared/...` or a feature public API.
3. Move its route-specific CSS into `theme/css/<product>/pages`.
4. Run `npm run lint` and `npm run build` before migrating the next family.
