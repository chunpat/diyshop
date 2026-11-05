# Standalone Cloudflare deployment

This deployment belongs to the user's Cloudflare account and is independent of Sites. The existing Sites deployment remains unchanged.

## Architecture

The storefront, admin UI and shared `lib/api.ts` backend are reused. `cloudflare/worker.ts` is bundled directly into a small Cloudflare Worker to reduce framework overhead. Cloudflare D1 stores application data. Static assets are uploaded with the Worker. HTML canonicalization is disabled (`assets.html_handling=none`) so `/admin` can safely serve `/admin.html` without a redirect loop.

The user selected standalone email/password authentication instead of activating Cloudflare Zero Trust. Zero Trust was not activated. `AUTH_MODE=password` enables `cloudflare/password-auth.ts`; caller-supplied Sites identity headers are never trusted. Business API routes and protected HTML pages require an authenticated account session; administrative routes additionally enforce assigned permissions. Public `/login` and one-time `/setup` pages are available. Static scripts and reference images contain no account data and can be served directly.

## Current resources

- Account: `2a1f005a143e83feb871d22ea1678d91`
- Domain: `callie.chunpat.cc`
- Worker: `callie-gift-studio`
- D1: `callie-store-db` (`a1e4baca-238f-48fa-bbd0-21c7a2baa444`)
- workers.dev and preview URLs are disabled.
- Administrator email is configured through the Worker `ADMIN_EMAILS` secret.

The initial database seed contains 52 reference products; the live-preview catalog update adds product 52 for a total of 53. Product stock starts at the sample value of 100. Existing Sites account/cart/order data is not copied into this database. The earlier account deployment remains retained with its routes disabled; its records are retained locally outside Git.

## Authentication

- The owner sets their own password through a one-time setup link. The setup key is sent in the URL fragment, removed from the address bar by the page, and submitted only over HTTPS to the setup API.
- The setup endpoint initially requires the random `SETUP_KEY` Worker secret. After initialization `/setup` redirects to `/login`. A single-owner primary key prevents reinitialization, including concurrent requests.
- Passwords use a unique salt, PBKDF2-SHA256 at 100,000 iterations (the Workers Web Crypto ceiling), and an HMAC pepper stored separately as the `AUTH_PEPPER` Worker secret. Plaintext passwords are never stored.
- Sessions use random 256-bit tokens, hashed in D1. Cookies are `Secure`, `HttpOnly`, `SameSite=Strict`, and expire after seven days. Sign-out revokes the current session.
- Sign-in/setup are limited to ten attempts per IP-derived bucket per 15 minutes. Raw IP addresses are not persisted. Cross-origin mutation requests are rejected.
- `SETUP_KEY` can be removed once initialization is complete. Do not replace `AUTH_PEPPER` after a password is set: rotation requires resetting the password too.
- This is a private application with an owner and invited staff accounts. Public customer registration, email verification and password recovery emails are not implemented.

## Commands

- `npm run build:cloudflare`
- `npm run test:cloudflare` (Access-token compatibility tests)
- `npm run test:password` (standalone authentication and protected-route tests)
- `npm run db:migrate:cloudflare`
- `npm run deploy:cloudflare`

`cloudflare/wrangler.jsonc` is the source of truth for this deployment. Do not use the placeholder D1 binding in the framework-generated `dist/server/wrangler.json` for this account. Migrations are shared with Sites and applied using Wrangler's remote migration journal. Applied migrations remain immutable.

Use IPv4-first Node networking on this machine because IPv6 connections to the Cloudflare token endpoint timed out. For a future login, the official device flow avoids local callback conflicts:

`NODE_OPTIONS=--dns-result-order=ipv4first npm exec --yes --package=wrangler@4.157.0 -- wrangler login --device --scopes account:read user:read workers_scripts:write d1:write zone:read`

OAuth credentials live only in the standard local Wrangler credentials directory. They are not stored in this repository or bundled into the Worker. No Workers paid plan or Zero Trust subscription was activated. Runtime usage is governed by the account's current plan and limits.

## Remaining commerce integrations

Online payment, shipping/tax calculation, carrier integration and email delivery remain unconfigured. Orders are saved awaiting payment and reserve inventory. Unpaid order cancellation restores stock.

The custom domain is attached using the Cloudflare Workers Domains API with Workers Scripts permission. It is retained separately from legacy zone Workers Routes, which the current OAuth grant does not manage. The domain association is recorded locally in `deployment.json` (excluded from Git).

## Storefront checkout flow

The storefront is English-only (USD). `public/commerce.js` and `public/commerce.css` provide product personalization, an editable cart, and shipping → payment → review checkout with session-only draft retention. Product-specific choices are declared in `db/customizations.json` and validated by the API; the initial configuration covers the flower/animal patch corduroy bag. Other catalog items retain name/message personalization and optional wrapping.

`POST /api/checkout/quote` validates the saved cart version, aggregate stock and coupon without reserving inventory. Quotes and orders use server prices. Shipping preference and the optional order note are stored in the order address document and displayed in the admin detail view. Standard/expedited/urgent are preferences only; no shipping rate or delivery date is promised. Shipping/tax remain unconfigured and excluded from the item total. No new database migration is needed for this flow.

## Live personalization preview

`public/live-preview.js` composes text, color and accessory layers locally in Canvas 2D. Products 0 and 3 use the corduroy template; product 52 uses the Christmas jute tote template. Each configuration declares its preview type/base image in `db/customizations.json`. Templates for other products must be configured individually; their original reference photos remain available.

Multiple names become separate ordinary cart lines. Duplicate designs merge by the existing canonical key; existing server pricing, aggregate stock validation and idempotent checkout remain authoritative. Cart and checkout thumbnails are rebuilt from the saved name/options, at 260px resolution to limit memory. Large previews support live editing, zoom, close-up view and pointer dragging. No image uploads, generation API calls or new customer data fields are needed during personalization.

The new tote is catalog item 52 (base $17, one supported small open-top style). Apply the idempotent `cloudflare/seed-live-preview.sql` to an existing database after deploying this version. The store's independent listing, catalog imagery and preview are design references, with shipping, tax and payment still requiring separate configuration. Generated asset paths, exact prompts and font license attribution are documented in `docs/live-preview-assets.md`.

## Staff accounts and permissions

Migration `0003_accounts_and_product_details.sql` extends the existing authentication table without changing the owner's password hash or existing session identifiers. The `owner` identity is immutable through the account-management API. Other accounts have independent hashed passwords, sessions, enabled state, role and explicit permission lists.

The backend exposes product, order, support, subscriber and account-management scopes. The dashboard returns only the permitted business datasets; every administrative mutation checks its required scope. Role presets are administrator, operator and read-only. A manager cannot grant scopes they do not possess or manage higher-privilege accounts. Read-only roles cannot receive write scopes, and write scopes require the matching read scope. Account changes use optimistic versions and a transaction guard; changes revoke all affected sessions and invitations. Owner/self privilege changes are blocked.

Account creation atomically stores a pending account and a single-use activation token hash. The activation URL is returned only to the requesting administrator, carries its secret in the fragment, expires in 24 hours and is not emailed automatically. Password reset links expire in one hour. Regeneration invalidates older links; successful password setup consumes the invite and revokes prior sessions. Tokens and password material are omitted from directory responses and audit details. The account holder chooses their password on `/activate`; administrators never set member passwords through the account editor.

`/admin` now includes logout, product image/description editing and account management. Product image URLs accept HTTPS or local assets paths; descriptions are plain text. Product cover images remain separate from per-product live-preview templates.

Validation: `npm run check`, `npm test`, `npm run test:password`, and `npm run test:accounts`. Browser QA uses disposable in-memory owner/operator/viewer accounts. No staff fixtures or test passwords are added to the live database.

## Product media and editable templates

Migration `0004_square_ultron.sql` adds a product gallery, optional database customization overrides, and an uploaded-media table. Existing products fall back to the versioned catalog templates until an administrator saves an override. The first gallery item is the cover; uploads do not publish a product change until Save is clicked. The storefront renders the saved gallery and uses the same database configuration for preview and server-side cart/checkout validation.

The current OAuth grant does not include R2 access. This small-store implementation stores bounded, base64-encoded raster media in D1 using existing bindings, with a 100 MiB encoded-media budget enforced atomically. Browser uploads accept JPEG/PNG/WebP sources up to 10 MiB, scale to at most 1600 px, retain transparency through WebP, and compress to at most 768 KiB. Raw uploads are streamed with a hard byte limit; the server checks signatures and MIME, enforces `products.write` and same-origin mutations, and serves images to authenticated users with `nosniff`. SVG/HTML uploads are not supported. The budget is an application safeguard, not a guarantee of free hosting; actual D1 storage and usage limits still apply. For a larger catalog, migrate image bytes behind the stable `/api/media/:id` URLs to object storage.

Removing a gallery entry removes its product association. Uploaded files are retained so saved orders and previous links remain valid; unused uploads also count toward the media budget. There is no automatic garbage collection or destructive asset deletion in this version. External HTTPS gallery links remain supported, but editable preview bases must be uploaded or local assets to keep Canvas same-origin.

The admin editor exposes a maximum of 12 product images, cover ordering, preview template/base, enabled design styles, bottom-text toggle, name limit, multi-name toggle, and existing color/style/accessory option lists. Template geometry remains the existing corduroy/tote geometry: uploaded bases must match it; arbitrary photos do not automatically gain print-region detection. Disabling or removing an option can require shoppers to reselect configurations already in their carts. Existing orders retain their stored personalization.

Verification includes bounded/invalid/unauthorized uploads, byte-for-byte image retrieval, quota rejection, persisted galleries and templates, missing-image rejection, stale-update protection, and cart validation against database template changes. Local browser QA also checks WebP compression/upload/re-read, gallery cover sorting, saved styles and name limits.
