# Backend Architecture

The backend is a feature-based modular monolith. Each business capability owns
its HTTP, application, and persistence files under `src/modules`.

```text
src/
├── app.js                     # HTTP composition root
├── server.js                  # Process lifecycle and startup migrations
├── config/                    # Environment, HTTP, database and OpenAPI config
├── database/
│   ├── models.js              # Sequelize model registry and associations
│   └── migrations/            # Ordered schema changes
├── modules/
│   ├── admin/
│   ├── assistant/
│   ├── auth/
│   ├── catalog/
│   ├── commerce/
│   ├── orders/
│   ├── payments/
│   ├── promotions/
│   ├── settings/
│   ├── storefront/
│   ├── uploads/
│   ├── users/
│   └── wallet/
└── shared/
    ├── middlewares/           # Cross-cutting HTTP policies
    └── utils/                 # Domain-neutral helpers
```

## Dependency direction

The normal request flow is:

```text
route -> middleware -> controller -> service -> Sequelize model -> MariaDB
```

- A route declares the endpoint and HTTP middleware.
- A controller translates HTTP input/output and coordinates the use case.
- A service owns reusable business rules and database transactions.
- A model owns Sequelize metadata only.
- `shared` must stay domain-neutral; business rules belong to a module.
- Cross-module imports should target a service or model explicitly. Modules
  must not import another module's controller or route.
- All model associations are registered once in `database/models.js` to avoid
  circular initialization and inconsistent aliases.

The application remains one deployable process and one database. Splitting a
module into a separate service requires a concrete scaling or ownership need,
not only a folder boundary.
