# 0014 · Knot calculator

Date: 2026-10-28 · Status: accepted (owner asked for a raj and knot-density calculator)

- **`/encyclopedia/knot-calculator`** turns raj (hand-knotted) or shaneh × tarakom (machine-made) and a size into knots per m², per square inch (the unit foreign sellers quote) and in the whole carpet, plus knot spacing for raj. It is linked from the encyclopedia index and from density articles.
- The maths lives in `lib/density.ts` next to `knotsPerSquareMetre`, so carpet pages and the calculator agree. Raj results say "about", because raj counts only the width; machine results say "points of pile", not knots.
- Inputs accept Persian, Arabic-Indic and Latin digits with separators (`parseCount`) and reject values outside a plausible range, so a slipped digit shows an error instead of a silly number. A wrong size only hides the whole-carpet total.
- `MaterialPills` moved to `components/shared`, since it is no longer showroom-only.
