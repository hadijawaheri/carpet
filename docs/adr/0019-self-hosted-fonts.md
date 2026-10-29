# 0019 · Self-hosted fonts

Date: 2026-10-29 · Status: accepted

- **Why:** `next/font/google` downloads the fonts while `next build` runs. Builds failed at random in CI and locally (about one run in four) with "next/font/google queries have exactly one entry", and a Vercel or server build would fail the same way whenever Google Fonts is slow or unreachable from the builder.
- **What:** the four families (Cormorant Garamond, Jost, Markazi Text, Vazirmatn) are committed under `apps/web/src/app/fonts` as variable WOFF2 files from Fontsource 5.3.0, each with its SIL OFL licence. `next/font/local` loads them, keeping the same CSS variables, so `globals.css` and every component are unchanged.
- **Subsets:** Cormorant and Jost ship their Latin file, as before. Markazi Text and Vazirmatn ship only their Arabic-script file (Persian letters and digits, ZWNJ, Arabic punctuation): in both font stacks Latin text is set by Cormorant or Jost first, so their Latin files were never used.
- Variable files cover every weight the design uses (300–600) in one request per family and style, instead of one per weight.
- To update a font, replace the file from the same Fontsource package and keep its licence beside it.
