# 0002 · Web and contracts first, API later

Date: 2026-10-09 · Status: accepted (owner chose "site first")

The site's first job is to show design; the 3D pages, catalogue and articles need no server. `apps/api` (NestJS, auth, OTP) is added in the blueprint's layout when the shop takes orders. Carpet data is already defined in `packages/contracts` so the API can reuse it.
