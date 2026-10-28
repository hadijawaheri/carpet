# 0012 · Every carpet has its own page

Date: 2026-10-28 · Status: accepted (owner asked for a page per carpet with a fixed address and WhatsApp and Telegram sharing)

- **`/carpets/[slug]`** shows what the quick view shows (photo or 3D, knot loupe, facts, material feel, inquiry buttons) at an address that can be shared, plus four more carpets, same material first. The quick view links to it, and each gallery card's name is a link.
- **The showroom frame moved into the `(marketing)` layout.** Header, footer, inquiry drawer and quick view are rendered once by `ShowroomShell`, so the wishlist and the inquiry list survive moving between the gallery and a carpet page. The header's links go to `/#…`, and on other pages its search and wishlist button open the gallery with `?q=` or `?filter=wishlist`.
- **Data**: `getCarpet(slug)` asks the API for one carpet. A 404 from the API is trusted; any other failure falls back to the bundled catalogue, like the list. A slug that fails `carpetSlugSchema` never reaches the API.
- **Sharing** uses plain links (`wa.me/?text=`, `t.me/share/url`) and a copy button; no third-party script loads, so the CSP is unchanged. Links are absolute from `NEXT_PUBLIC_SITE_URL`.
- **SEO**: each page has its own title, description, canonical and Open Graph image (the carpet photo). The sitemap lists every carpet and robots.txt points to it.
- **Unknown carpets** render the not-found page with `noindex`. The status stays 200 because the root `loading.tsx` streams before the page knows the slug is unknown; dropping that loading state for a status code was not worth it.
