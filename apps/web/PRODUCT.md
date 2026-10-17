# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary: people reviewing Hadi's design work (employers, clients, design leads) who open the site from a résumé or portfolio link. They judge UI/UX skill, craft and originality within the first screens.
- Secondary: visitors curious about Iranian carpets: how material (silk, wool, machine-made), knot density and size change a carpet's look and price.
- Selling carpets is a minor, later goal (open question: real cart or not).

## Product Purpose

A showcase site about Iranian carpets whose real job is to prove Hadi's design, UI and UX ability. Success: a reviewer leaves remembering the site as unusually modern, three-dimensional and professional, more so than established rug stores such as thepersianrugstore.com and rugeast.com, which Hadi named as references to surpass.

## Positioning

Carpets you can touch: real carpet photos turned into 3D cloth that the visitor grabs by a corner and shakes, so silk, hand-knotted wool and machine-made carpets visibly differ in weight, drape and sheen. Paired with research that explains knot density (raj, shaneh, takham), materials and price.

## Operating Context

- Viewed mostly on desktop from a résumé link; must hold up on phones.
- Persian, right-to-left. UI copy in Persian; code in English.

## Capabilities and Constraints

- Next.js App Router + React Three Fiber, shadcn/Radix + Tailwind v4, pnpm monorepo (see CLAUDE.md, PROJECT_BLUEPRINT_SHADCN.md).
- 3D cloth solver with silk / wool / machine presets already exists.
- Pages planned: landing (moving 3D carpet), carpet/buy page (grab-and-shake 3D), research articles and facts.
- Deploy target: Vercel, later.

## Brand Commitments

- Palette pinned by Hadi: Iranian carpet red and cream.
- Never draw, generate or use cartoon carpets. Every carpet image comes from Hadi's own photos.
- Must feel "much more modern, more 3D and more professional" than the two reference stores.

## Evidence on Hand

- Carpet photos in apps/web/public/carpets (five; two are only 736 px wide, all flagged placeholder).
- Editorial photo: apps/web/public/editorial/carpet-horse.jpg (horse draped in a carpet, 736 px).
- No prices, customers, testimonials or sales figures exist. Do not invent them. Density ranges in the research data are unsourced drafts.

## Product Principles

1. The carpet is the interface: real photos, touched in 3D, lead every key surface.
2. Show the difference between materials, don't just state it.
3. Knowledge earns trust: facts are precise, labelled when unsourced.
4. Craft over decoration: every detail should read as deliberate to a design reviewer.

## Accessibility & Inclusion

- WCAG AA contrast; reduced-motion users get a still carpet (no wind); browsers without WebGL get the photo; keyboard access to every control.
