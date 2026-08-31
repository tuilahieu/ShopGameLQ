# Production checklist

This project intentionally does not include a GitHub Actions deployment workflow. Deploy from a reviewed commit on the server or through the team's existing release system.

## One-time server setup

1. Create `/var/www/SHOPLIENQUAN`, install Node 20+, MySQL, Nginx and PM2.
2. Clone the intended branch. The current storefront is on `develop`; do not pull `main` unless it has been merged.
3. Create `backend/.env` from `backend/.env.example` and set:
   - `NODE_ENV=production`
   - exact HTTPS `CORS_ORIGINS`
   - strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
   - a base64 32-byte `ACCOUNT_CREDENTIALS_ENCRYPTION_KEY`
   - production DB credentials and `DB_SSL=true` where required
   - `TRUST_PROXY=loopback` when Nginx is on the same host
   - SePay HMAC secret only after staging verification
4. Configure Nginx from `ops/nginx/shoplienquan.conf.example` and enable HTTPS.
5. Use a persistent volume for `backend/uploads`, or migrate uploads to object storage before running multiple instances.

## Each release

```sh
cd /var/www/SHOPLIENQUAN
git pull --ff-only origin develop

cd backend
npm ci --omit=dev
npm run migrate:status
npm run migrate
npm test
pm2 startOrRestart ../ops/pm2/ecosystem.config.cjs --update-env

cd ../frontend
npm ci
npm run build
```

Publish the resulting `frontend/dist` to the Nginx root, then verify:

```sh
curl -fsS https://shop.example.com/healthz
curl -fsS https://shop.example.com/readyz
```

Before enabling SePay, perform a small staging payment and verify that duplicate webhook delivery credits the wallet once, amount/code mismatches are rejected, and the order purchase flow delivers the encrypted credential only to the owner.
