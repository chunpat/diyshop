# DIY Shop — personalized gift storefront

Responsive Callie-inspired gift storefront with an English shopping experience and a Chinese management dashboard. The current deployment runs on an independent Cloudflare Worker with a D1 database and email/password authentication. The original Sites/Vinext entry point is retained for compatibility.

Store: https://callie.chunpat.cc/ · Admin: https://callie.chunpat.cc/admin

## Cloudflare setup

Use Node >=22.13.0, then run `npm ci` and `npm run build:cloudflare`. See [the Cloudflare guide](cloudflare/README.md) for authentication, database migrations, deployment and current integration limits. The existing `cloudflare/wrangler.jsonc` targets the current store; change its account and database identifiers before deploying to a different account. Deployment credentials and Worker secrets are configured outside Git.

Run `npm run check`, `npm test`, `npm run test:password` and `npm run test:accounts` to verify the application. To deploy to the configured account, authenticate with Wrangler, apply migrations with `npm run db:migrate:cloudflare`, then run `npm run deploy:cloudflare`.

## Features

- 53 reference products; server-managed price, stock and availability
- Live personalization previews for configured corduroy and Christmas tote products, including multiple names, zoom and cart previews
- English product customization and shipping → payment → review checkout
- Signed-in account profile, shopping bag and wishlist, synchronized to the database
- Personalized orders with shipping addresses and server-calculated USD totals
- Atomic stock reservation, idempotent checkout, version checks for stale carts and inventory edits
- Unpaid order cancellation restores stock and releases welcome coupon use
- One-use HELLOCALLIE coupon (10% off)
- Chinese admin UI at `/admin`: logout, product/image/description edits, order details and fulfillment, support inbox and subscriber list
- Staff accounts with administrator, operator and read-only roles, explicit permissions, activation/reset links and account disabling
- Manual offline payment confirmation requires a receipt note; status transitions are enforced server-side
- User-scoped customer records; server-enforced staff permissions; same-origin mutation checks

## Limitations

Online payment, refunds, shipping/tax calculation, carrier integration, email delivery and real reviews are not configured. No payment credentials are requested or collected. New orders reserve inventory and remain awaiting payment until cancelled or manually confirmed by the administrator. Pending orders do not expire automatically. Initial catalog stock is a sample value of 100 per product; set actual stock in admin before commercial use. Subscription and support messages are saved but no outbound emails are sent.

## Legacy Sites local development

1. Use Node >=22.13.0 and install dependencies.
2. Copy `.env.example` to `.dev.vars` (ignored). The supplied portable starter's development sign-in uses `seedy@sites.test`.
3. Run `npm run build` once to generate local Worker configuration.
4. Apply unapplied migrations in filename order:

   `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/<filename>.sql`

5. Run `npm run dev` and open http://127.0.0.1:5173. Follow the displayed sign-in link.

Hosted authentication is managed by Sites. Mock sign-in is only available in portable loopback development and is excluded from production builds. The initial catalog is inserted idempotently on the first administrator storefront visit. An empty fresh admin dashboard can also be initialized by visiting the storefront first. Seed data is outside schema migrations and never overwrites edits.

## Verification

- `npm run check`: TypeScript and browser JavaScript syntax
- `npm test`: SQLite-backed API tests for authorization, ownership, CSRF, price validation, stock rollback, order retries, concurrent checkout, cancellation, fulfillment, subscriptions and support
- With the local dev server running, `node tests/http.mjs`: real local D1 and HTTP concurrency checks using the starter's local sign-in; creates and cancels local test orders

Local and hosted databases are separate. All QA orders were created locally.

## Main API routes

`GET /api/me`, `GET /api/products`, `GET|PUT /api/state`, `GET|POST /api/orders`, `POST /api/orders/:id/cancel`, `POST /api/newsletter`, `POST /api/support`, `GET /api/admin/dashboard`, `PATCH /api/admin/products/:id`, `PATCH /api/admin/orders/:id`, `PATCH /api/admin/support/:id`.

Order and admin monetary fields use integer cents. Public catalog `price` uses dollars to match presentation code. Order creation requires an `Idempotency-Key` header and the latest saved cart version. Admin changes require server-side permission checks; the legacy Sites entry point uses an email allowlist. Generated database migrations and their metadata are tracked; never edit an applied migration.
