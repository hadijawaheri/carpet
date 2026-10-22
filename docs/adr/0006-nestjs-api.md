# 0006 · NestJS API in apps/api

Date: 2026-10-17 · Status: accepted · Supersedes 0002

The shop now takes inquiries, newsletter sign-ups and needs an admin to edit the catalogue, so `apps/api` is added in the blueprint's layout (§3, §7, §8): NestJS 12 (ESM, Vitest), MongoDB replica set through Mongoose, Zod schemas from `packages/contracts` via a hand-written `createZodDto` + global pipe, OTP sign-in with a 15-minute JWT and a rotating opaque refresh token in httpOnly cookies, global Throttler → JwtAuth → Roles guards, Terminus health, pino logs with request ids and redaction. The web app reaches it through its `/api/*` rewrite.

Modules: auth, users, carpets (public list/detail, admin CRUD with soft delete), inquiries (public create, admin list/status), newsletter (idempotent subscribe). The five catalogue carpets in contracts are the seed.

Deviations from the blueprint:

- (Redis and migration points superseded by 0010.) **API runs as one PM2 fork process by default.** Without `REDIS_URL` the throttler is per worker, and the inquiry/OTP limits are the main abuse guard. With `REDIS_URL` the counters live in Redis (`infra/redis/redis-throttler.storage.ts`, one Lua script per hit) and the API can run in cluster mode.
- **Migrations are a small in-repo runner, not `migrate-mongo`** (`src/database/migrator.ts`): forward-only, applied in id order, recorded in `migrations`, guarded by a lock document. `scripts/deploy.sh` runs `db:migrate` then `db:indexes` (`connection.syncIndexes()`) before the reload; production boots with `autoIndex` off.
- **Persian messages are enforced in the exception filter**: an exception whose message has no Persian letters (Nest's "Cannot GET /x", throttler, body-parser) gets a Persian default for its status, and every 5xx answers with the generic Persian message. Health checks therefore return 503 without Terminus details in the body.
- **Admin inquiry lists mask the mobile** (`maskMobile`); the single-inquiry endpoint carries the full number so the owner can call back.
- **Refresh only reads the cookie.** Bearer access tokens are accepted, but a non-browser client cannot refresh yet.
- **The seed keeps admin edits** (`$setOnInsert`); `--overwrite` resets catalogue carpets to the contracts values. `--admin 09…` promotes a mobile.
- `mongodb-memory-server` stays out of `onlyBuiltDependencies` (listed in `ignoredBuiltDependencies`), so it downloads mongod on the first test run; offline runs use `MONGOMS_SYSTEM_BINARY`.
- OTPs go out through a Melipayamak pattern (`MELIPAYAMAK_API_KEY`, `MELIPAYAMAK_BODY_ID`); a failed send answers 503 `SMS_UNAVAILABLE` and clears the code so the cooldown does not trap the visitor.
