# 0013 · The encyclopedia is drafts in code

Date: 2026-10-28 · Status: accepted (owner asked for encyclopedia articles on knots, shaneh and raj; drafting by Claude, the text approved by the owner)

- **`/encyclopedia`** lists the articles and **`/encyclopedia/[slug]`** shows one. The header links to it. Unknown slugs are a 404 (`dynamicParams = false`).
- **Articles live in `apps/web/src/features/encyclopedia/data/articles.ts`**, validated against `articleSchema` from contracts (the existing summary plus `sections`). There is no CMS and no API endpoint yet: five articles do not justify one, and the owner reviews them as a diff. Moving them to the API is the step if the owner wants to edit them without a PR.
- **Every article is a draft** (`isDraft: true`) and says so at the top, until the owner approves its text. Figures are only arithmetic (raj to knots per m², shaneh × tarakom) or common trade usage; regional claims are worded as tendencies.
- Reading time is counted from the text at 200 words a minute, not typed in by hand.
