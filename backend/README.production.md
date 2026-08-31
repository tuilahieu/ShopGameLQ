# Production backend guide

## Architecture after the refactor

`routes → middleware → controllers → services → Sequelize models/MySQL`

Controllers remain compatibility adapters for the existing API. Financial changes now go through `services/wallet.service.js`; it requires a locked user row and writes the balance plus immutable transaction record in one database transaction. A purchase locks the buyer, game account, sale and voucher rows. `Idempotency-Key` (16–128 URL-safe characters) is required on `POST /api/orders/buy` and on admin wallet adjustments; keep the same key when retrying a request after a network failure.

Game-account login data is AES-256-GCM encrypted. The application decrypts it only after ownership is verified (successful purchase replay or order detail). Migration `20260822_002_financial_invariants.js` encrypts existing plaintext `list_acc_game.login` rows and removes any historic plaintext credential from idempotency responses.

## Database and migration policy

Do not run `sequelize.sync()` in any environment with real data. Apply schema changes once, before deployment:

```sh
npm ci
npm run migrate:status
npm run migrate
```

`schema_migrations` records applied files. Migration `20260822_001_production_hardening.js` adds indexes matched to current catalogue, order, wallet, sale and voucher queries and creates `idempotency_keys`. Migration `20260822_002_financial_invariants.js` encrypts legacy credentials and adds a unique `orders.acc_id` backstop so one inventory account can never have two orders. It refuses to apply if historical duplicate orders exist; reconcile those rows before rerunning it. Both are intentionally non-transactional because MySQL DDL implicitly commits. Take a tested backup and use an online-schema-change tool for large tables before adding indexes in a busy production database.

The current tables are suitable for a small single-currency digital-goods shop once this migration is applied, but retain legacy Vietnamese names. Do not rename them in-place during launch; do that only through an expand/migrate/contract plan. Money is currently stored as VND integer `BIGINT`, which is correct as long as every write remains a safe integer. `users.money` is a cached wallet balance while `transactions` is the ledger: monitor for divergence and never edit either manually in SQL.

The next database evolution should add `payment_intents`/`payment_events` (provider event ID unique), `order_events`, `refunds`, `refresh_sessions`, `outbox_events`, and an append-only `audit_events` table with actor, target, request ID and before/after data. Replace the overloaded tiny-int statuses with documented enums/state transitions; add a `pending_review` inventory state if CTV listings require moderation. Keep variable game metadata in validated JSON rather than adding ad-hoc `TEXT` fields, and give encrypted credentials an explicit key/version column when legacy data is migrated.

## Required deployment configuration

Use `.env.example` as the complete contract. In production set a random `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and a base64 32-byte `ACCOUNT_CREDENTIALS_ENCRYPTION_KEY`; set `CORS_ORIGINS` to exact HTTPS frontend origins and `DB_SSL=true` where required. Store these in a secret manager, never in `setting` or git.

### Client IPs and reverse proxies

`::1` is the IPv6 loopback address. It is expected when the browser or Vite development proxy calls an API on the same machine; it cannot reveal the browser's public Internet IP. A browser must not supply a public IP header itself, because it is forgeable.

In production put the API behind a reverse proxy and configure the API to trust only that proxy. The app then uses Express's resolved client IP consistently for registration, login, audit logs and rate limiting.

```env
# Directly exposed API: keep this false.
TRUST_PROXY=false

# Nginx on the same host:
TRUST_PROXY=loopback

# Nginx in a Docker bridge network (replace with the actual, restricted subnet):
# TRUST_PROXY=172.18.0.0/16
```

For a same-host Nginx proxy, preserve the forwarding chain:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_pass http://127.0.0.1:3000;
```

Never set `TRUST_PROXY=true` if users can connect directly to Node, and do not trust a broad public range. With Cloudflare or another CDN, configure Nginx's real-IP module using that provider's published proxy CIDRs before forwarding the request.

Start `npm run migrate` as a release step, then `npm start`. `/healthz` is a liveness endpoint and `/readyz` checks MySQL for traffic gating. The supplied Dockerfile runs as the non-root `node` user; mount object storage instead of its local `uploads` directory for replicas.

## Launch blockers / features still required

The repository now contains a SePay webhook with raw-body HMAC verification, a unique provider event ID, and idempotent wallet crediting. It still needs a staging/live end-to-end verification with SePay, reconciliation alerts, and a manual review procedure before accepting money. Never accept an amount/username from the browser as proof of payment.

Also required for a serious production shop:

- Redis-backed distributed rate limiting and session/revocation storage (the built-in limiter is per-process only).
- Multiple refresh-token sessions with device metadata; the legacy user table supports one active refresh token only.
- Object storage plus malware/content scanning for uploads; MIME checks alone do not prove image content.
- A proper order state machine, refunds/disputes, support tickets, notification outbox, tax/invoice rules, and immutable admin audit events.
- Monitoring/alerting (structured logs to a collector, error tracking, DB/queue metrics), daily encrypted backups, restore drills, and a tested incident runbook.
- Privacy/terms/age policy, retention/deletion policy, fraud controls, and a PCI-safe payment-provider integration.

## Safety behaviour changed deliberately

Deleting a category, account type, or unsold account now hides it instead of cascading deletion. A sold account cannot be deleted. This preserves order and financial audit history. Public listing endpoints continue to expose only active entries.
