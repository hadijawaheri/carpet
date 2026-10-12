# 0008 · Room designer, second pass: a rug that stays where it is left, and a room a professional would use

Date: 2026-10-12 · Status: accepted · Extends 0007 · Revises the rug's back in 0006

The owner's review of 0007: it read as a beginner's tool. A grabbed rug sprang back to its place and showed white underneath, only the shake moved it, paintings stayed on one wall, and there was no way to show a carpet tableau (تابلو فرش). This pass answers each point.

## Rug physics

- On the floor the rug no longer returns to a rest pose. There is no restoring force at all: real gravity (9.8 m/s²), static friction, sliding grip and a much weaker bend stiffness. A corner lifted and laid over the rug stays folded until the visitor presses "flatten" (`ClothSolver.flatten`).
- Folding needs the cloth to lie on itself. The solver has a cheap 2.5D self-collision: triangles are bucketed on a grid, and a particle above a triangle of the rug (not one of its near neighbours) is held one pile thickness above it. Pile thickness per material is new in the contracts (`ClothPhysics.pileHeight`).
- The rug sleeps after it has been still for 45 steps, so a settled room costs no physics. Measured in Node: about 3 ms per step on a 3 m rug while a corner is held, 0.2 ms flat.
- The sway a hanging carpet makes when its material changes is skipped on the floor: with nothing pulling it back it would be left in the rug as wrinkles.

## The rug's underside and edge (revises 0006)

- 0006 gave the hanging carpet a plain back. A lifted rug showed that back as a white sheet, which read as wrong. The back is now the photo seen from behind (the design mirrored, as on a knotted carpet's reverse), darkened. This is still the owner's photo, not a drawn carpet. A real photo of a rug's back from the owner would replace it.
- The pile now has a thickness: a band runs round the rug's edge, and the top surface sits that thickness above the floor.

## Data

- `carpet.kind` is `rug` or `tableau`. Tableaux hang on walls; the floor picker lists rugs only. The catalogue has no tableau photos yet, so the tableau picker shows the rug photos and says it is doing so.
- The rug's size is a length in centimetres (`lengthCm`, 60–600) instead of a scale of the sample. The width always follows the photo, so the design is never stretched. The panel offers the sizes buyers ask for by name (پادری, ذرع‌ونیم, ۳/۶/۹/۱۲ متری) as approximate lengths, and the real size when the catalogue entry is not a placeholder.
- New items: floor lamp, plant, cabinet (console, TV unit, bookcase) and pouf. Sofas gain a style, an L chaise and leg colour; tables a side height and dining chairs; paintings what they hold (colours, a carpet tableau, the visitor's photo) and a frame (thin with a mat, wood, gold, none); curtains heavy or sheer.
- The room gains a time of day (morning, noon, evening, night) and a floor finish (planks, herringbone, stone tiles, concrete).
- Links from 0007's unreleased layout (`rug.scale`) no longer parse; they fall back to the default room with the notice 0007 already shows.

## Editing

- Every floor piece and the rug can be turned freely with a knob on a ring round it, settling on the nearest 15° within about 2°. Paintings and windows can be carried round a corner onto another wall: the drag follows the pointer on the window, not on the mesh, because a piece moved to another wall is re-created under it.
- Undo and redo (Ctrl+Z, Ctrl+Shift+Z or Ctrl+Y) keep 80 steps. A drag or one slider gesture is one step.
- A small toolbar floats over the selection (turn, duplicate, delete, next wall), tape measures show the gap to the nearest walls, and the panel has exact sliders for position, angle and height.
- Hidden walls are left out of picking. three.js picks invisible objects, so the walls nearest the camera were taking clicks meant for the furniture behind them.
- Saved pictures are rendered at twice the screen resolution with the selection marks hidden, and carry a band with the carpet's name, size and pile, drawn in the site's own colour tokens.

## Not verified

- Frame rate and the feel of folding on a real GPU. Checked only on a software renderer, which runs this page at about 3 frames a second, so the browser checks confirm behaviour, not smoothness.
