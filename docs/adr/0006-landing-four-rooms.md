# 0006 · The landing keeps four rooms; research gets its own route

Date: 2026-10-12 · Status: accepted · Amends 0005

- A 16-design competition on the landing page chose to keep the museum hall (0005) and cut it down, because the page tried to show too much and claimed things it could not source.
- The landing is hall, study, collection, closing. The research catalogue and the three-material table move to `/research`, where draft markers read as a work in progress, not as an unfinished landing.
- Every 3D stage carries a "shake the carpet" button, so the grab has a keyboard route. Under reduced motion the button stays focusable but inert (`aria-disabled`), the cloth ignores grabs and material kicks, and the wind is off.
- The procedural knot normal map and the front photo reused as a reverse are removed: no carpet texture is generated. The reverse is a plain cloth colour until the owner supplies photographs of a back (this replaces the "knotted back" line of 0005).
- Unit definitions (raj, shaneh) and knot counts stay labelled as drafts until each has a source. The landing study states no unsourced figure.
- The loupe is pinned to the highest-resolution photo so its zoom shows real pixels whichever carpet hangs in the hall.
- `SHAKE_STRENGTH` (0.08) is a starting value tuned by eye, not a measurement.
