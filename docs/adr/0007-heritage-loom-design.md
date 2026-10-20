# 0007 · The Heritage Loom design, in Persian and RTL

Date: 2026-10-17 · Status: accepted (owner: "the design is this design; code logic is yours")

- The site's look follows the owner's `heritage-loom-explorer` repo: cream and alabaster linen, charcoal type, champagne gold, madder accents, floating pill header, 3D hero, filterable gallery with knot zoom, room visualizer, quick-view modal, drawer, storytelling footer.
- Fonts: the design's Cormorant Garamond (display) and Jost (text) stay for Latin. Neither has Persian glyphs, so each falls back to its closest Persian face: Markazi Text (Naskh serif) for display, Vazirmatn for text. Next's metric fallback is turned off for the Latin fonts because the local fallback has Arabic glyphs and would win.
- Tracked uppercase eyebrows become small medium-weight text: Persian has no capitals and letter-spacing breaks joins. Italics are not used on Persian.
- `gold` (#d4af37, 1.97:1 on cream) is decorative only; text uses `gold-text` (#7d5f10, 5.6:1).
- One light theme; `next-themes` and the dark tokens are removed.
- The hero image is the owner's own carpet in the existing cloth solver, not a still photo. The design's mouse tilt drives the 3D group (`PointerTilt`), and the hero's wind is softened (`calm`) so the carpet floats rather than flaps. Silk sheen is capped at 0.35 on every scene: full sheen washed the photos gold on cream.
- The design's shop parts are kept in shape but made honest: no prices exist yet, so cards show "استعلام قیمت"; the cart is an inquiry list posted to the API; the currency switcher is dropped. The design's generated rug photos are not used; its two warm room photos are cropped so no generated carpet remains.
