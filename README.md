# Callie full-stack gift storefront

Responsive Callie-inspired storefront with a Vinext server and Cloudflare D1 database, deployed through Sites. The site stays private. The current owner is the administrator; hosted `ADMIN_EMAILS` controls the server-side administrator allowlist.

## Features

- 52 seeded products; server-managed price, stock and availability
- Signed-in account profile, shopping bag and wishlist, synchronized to the database
- Personalized orders with shipping addresses and server-calculated USD totals
- Atomic stock reservation, idempotent checkout, version checks for stale carts and inventory edits
- Unpaid order cancellation restores stock and releases welcome coupon use
- One-use HELLOCALLIE coupon (10% off)
- Chinese admin UI at `/admin`: overview, product edits, order details and fulfillment, support inbox and subscriber list
- Manual offline payment confirmation requires a receipt note; status transitions are enforced server-side
- Owner-scoped customer records; administrator allowlist; same-origin mutation checks

## Limitations

Online payment, refunds, shipping/tax calculation, carrier integration, email delivery and real reviews are not configured. No payment credentials are requested or collected. New orders reserve inventory and remain awaiting payment until cancelled or manually confirmed by the administrator. Pending orders do not expire automatically. Initial catalog stock is a sample value of 100 per product; set actual stock in admin before commercial use. Subscription and support messages are saved but no outbound emails are sent.

## Local development

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

Order and admin monetary fields use integer cents. Public catalog `price` uses dollars to match presentation code. Order creation requires an `Idempotency-Key` header and the latest saved cart version. Admin changes require server-side owner email authorization. Generated database migrations and their metadata are tracked; never edit an applied migration.
