# @farsh/api

NestJS 12 (ESM) API for Farsh on port 7781. MongoDB (replica set) via Mongoose, Zod contracts from `@farsh/contracts`, OTP sign-in with httpOnly cookie sessions. Visitor-facing messages are Persian; every error is an `ApiErrorBody` with a machine-readable `code`.

## Run locally

```bash
pnpm --filter @farsh/contracts build
cp infra/.env.example infra/.env                   # set MONGO_ROOT_PASSWORD and MONGO_APP_PASSWORD
docker compose -f infra/docker-compose.yml up -d   # replica set with auth on 127.0.0.1:27018
cp apps/api/.env.example apps/api/.env             # MONGO_APP_PASSWORD in DATABASE_URL, both secrets: openssl rand -base64 48
pnpm --filter @farsh/api seed                      # indexes + the 5 catalogue carpets
pnpm --filter @farsh/api dev                       # http://127.0.0.1:7781
```

The API connects as `farsh_app`, created on the first start with `readWrite` on the `farsh` database only; `root` is for backups and admin work. With `SMS_PROVIDER=console` the OTP is printed in the API log. Set `OTP_FIXED_CODE=123456` for automated tests (both are refused when `NODE_ENV=production`).

## Seed and admin

| Command                                                | Effect                                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm --filter @farsh/api seed`                        | Syncs indexes, inserts catalogue carpets whose slug has no live document. Re-running is safe and keeps an admin's edits. |
| `pnpm --filter @farsh/api seed -- --overwrite`         | Same, but resets existing catalogue carpets to the values in `packages/contracts/src/carpet/carpet-catalog.ts`.          |
| `pnpm --filter @farsh/api seed -- --admin 09xxxxxxxxx` | Also makes that mobile an admin (creates the user if needed). The role is in the JWT, so the person signs in again.      |
| `pnpm --filter @farsh/api db:indexes`                  | Only syncs indexes (needs a prior build). `scripts/deploy.sh` runs it, since production boots with `autoIndex` off.      |

`seed` builds first, then runs `dist/cli/seed.js` with `apps/api/.env`.

## Endpoints

Base path `/v1` (URI versioning). In production the browser reaches them through the web app's `/api/*` rewrite.

| Method | Path                            | Access                    | Notes                                                                                                          |
| ------ | ------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/auth/otp/request`          | public, 3/min/IP          | `{ mobile }` → 204 for any number; 2 min cooldown per mobile                                                   |
| POST   | `/v1/auth/otp/verify`           | public, 10/min/IP         | `{ mobile, code }` → sets `access_token` (15 min) and `refresh_token` (30 days) cookies, `{ data: { user } }`  |
| GET    | `/v1/auth/me`                   | signed in                 | `{ data: { user } }`                                                                                           |
| POST   | `/v1/auth/refresh`              | refresh cookie, 30/min/IP | 204 + rotated cookies; reuse of a rotated token after 10 s revokes the family; no session outlives 90 days     |
| POST   | `/v1/auth/logout`               | public                    | 204, revokes the family, clears cookies                                                                        |
| PATCH  | `/v1/users/me`                  | signed in                 | `{ firstName?, lastName? }` → `{ data: user }`                                                                 |
| DELETE | `/v1/users/me`                  | signed in, 10/min/IP      | `{ code }` from a fresh `otp/request` → 204, soft delete, revokes every session; the mobile can register again |
| GET    | `/v1/carpets`                   | public                    | `?page&limit&search&material=silk\|wool\|machine` → `{ data: Carpet[], meta }`                                 |
| GET    | `/v1/carpets/:slug`             | public                    | `{ data: Carpet }` or 404                                                                                      |
| POST   | `/v1/carpets`                   | admin                     | `Carpet` body → 201 `{ data }`; 409 on a taken slug                                                            |
| PATCH  | `/v1/carpets/:slug`             | admin                     | partial `Carpet` (slug cannot change)                                                                          |
| DELETE | `/v1/carpets/:slug`             | admin                     | 204, soft delete                                                                                               |
| POST   | `/v1/inquiries`                 | public, 5/min/IP          | `createInquirySchema` → 201 `{ data: InquiryDto }`; 400 if a slug is not a live carpet                         |
| GET    | `/v1/inquiries`                 | admin                     | `?page&limit&search&status` newest first; mobiles masked                                                       |
| GET    | `/v1/inquiries/:id`             | admin                     | full mobile, for calling the visitor back                                                                      |
| PATCH  | `/v1/inquiries/:id/status`      | admin                     | `{ status: new\|contacted\|closed }`                                                                           |
| POST   | `/v1/newsletter/subscriptions`  | public, 5/min/IP          | `{ email }` → 204, idempotent                                                                                  |
| GET    | `/health/live`, `/health/ready` | public, unversioned       | Terminus; `ready` pings Mongo                                                                                  |

A Bearer token in `Authorization` is accepted wherever the access cookie is.

Writes (`POST`, `PATCH`, `PUT`, `DELETE`) whose `Origin` (or `Referer`) is not in `CORS_ORIGINS` get 403, on top of `SameSite=Lax` cookies; requests with neither header pass, since they come from no browser page.

## Tests

`pnpm --filter @farsh/api test` runs unit specs (`src/**/*.spec.ts`) and e2e specs (`test/**/*.e2e-spec.ts`) against an in-memory replica set from `mongodb-memory-server`. Its install script is not allowed to run, so it downloads mongod on the first test run. Offline, point it at a local binary:

```bash
export MONGOMS_SYSTEM_BINARY=$(which mongod) MONGOMS_SYSTEM_BINARY_VERSION_CHECK=false
```
