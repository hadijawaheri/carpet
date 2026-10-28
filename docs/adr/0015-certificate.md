# 0015 · A printable certificate with a QR code

Date: 2026-10-28 · Status: accepted (owner asked for an authenticity certificate per carpet with a QR code)

- **`/carpets/[slug]/certificate`** is a one-page, printable record: the carpet's measured facts, its provenance, its photo and a QR code. The QR holds the certificate's own address, so a printed tag on the carpet leads back to the live record. Printing hides the site's header, footer and buttons. The page is `noindex`; the carpet page is the one to index.
- **Provenance is new, optional data in contracts** (`provenance`: origin, workshop, weaver, Persian woven year), stored on the API's carpet document and editable through the existing admin `PATCH /v1/carpets/:slug`. Nothing is filled in by default: empty fields read "ثبت نشده".
- **A certificate only vouches when it can.** Until a carpet is no longer a placeholder and has a recorded origin, the page says it is a preview, not proof of authenticity.
- **The QR is drawn on the server** with `qrcode` as an SVG and shown through `<img src="data:…">`: no client script, no inline markup, and the CSP (`img-src data:`) is unchanged.
- Not done yet: a signed or tamper-evident certificate number. If the owner wants certificates that cannot be forged by copying the page, that needs a server-issued code and its own ADR.
