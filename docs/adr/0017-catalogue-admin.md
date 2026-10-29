# 0017 · The catalogue is edited in the dashboard

Date: 2026-10-29 · Status: accepted (owner asked for a catalogue admin panel: photo, size, raj, material, price; task C4, plan in issue #15)

- **`/dashboard/catalogue`** lists the stored carpets. **`/catalogue/new`** adds one and **`/catalogue/edit/[slug]`** edits or removes one. The edit page lives under `/edit` so that a slug of `new` cannot collide with the create page. Every page calls `requireRole("admin")`; the API's `@Roles("admin")` is the real check.
- **Admin pages read the API directly**, uncached and without the showroom's bundled fallback. The admin must see what is stored, and an outage must show as an error instead of as the sample catalogue.
- **The form's fields live in contracts** (`carpetFormSchema`). They take text as typed, Persian digits included, and turn it into the API's shapes on submit (`toCarpetFields`). Prices are entered in tomans and stored in integer rials. Errors are in Persian, next to their field. A taken slug's 409 also lands on the slug field.
- **Clearing a field clears it on the API.** An update may now send `null` for `priceRial`, `density` or `provenance`. The API unsets the field rather than storing null. Absent still means "leave as is".
- **The photo is uploaded as soon as it is picked** (`POST /v1/media/carpets`, ADR 0016). The form then saves `image` and `imageAspect` with the other fields. Photos over 4 MB are first shrunk in the browser to 2400 px JPEG, because the upload passes through Vercel's rewrite and its body limit.
- **The showroom updates on the next visit.** After each create, update or delete, a server action calls `updateTag("carpets")` instead of waiting out the one-minute cache. The action checks the admin role, so nobody else can force refetches.
- **Removing is a soft delete** behind a confirmation dialog. The record stays in the database, and the slug becomes free again.
- The profile page links to the catalogue for admins only.
