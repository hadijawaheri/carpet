# 0007 · A room designer, so a carpet is judged in a room before it is bought

Date: 2026-10-12 · Status: accepted · Extends 0005, 0006

- `/room` is a new route: a 3D four-walled room where a visitor places one of the owner's carpets, then adds sofas (1–5 seats), tables, paintings and curtains, moves them, and sets every colour. The goal is a believable pre-purchase render, not a decorating game.
- The idea new to this site: the rug in the room is the same cloth as the landing's hanging carpet, lying down. From above, in "touch" mode, a corner can be grabbed and lifted, the rug shaken, and its material switched (silk, wool, machine) to see how it falls and shines. The solver gained a floor mode (`setFloor`): gravity along the normal, z clamped at the floor, grip friction, no wind. It still has no React or three.js in it.
- "Dress the room from this carpet" reads the carpet photo's dominant colours (`lib/image-palette.ts`, bucket quantisation, no network) and offers four starting palettes. Each is only a start: every colour stays editable, with ready swatches and a free picker.
- No carpet is drawn or generated. Paintings are two colour fields in a frame, or a picture the visitor picks from their own device. That picture is never uploaded and never travels in a link.
- The layout is a Zod schema in `packages/contracts` (`room.schema.ts`). The room is stored in the page address as base64url JSON (`#r=…`), validated on read. A broken link falls back to the default room with a notice. There is no server, in line with 0002, so a visitor "keeps" a design by sharing the link or saving a PNG render.
- There is no price, cart or order. "Buying" is outside this stage, so the page offers the link and the image only. Rug sizes and materials are the catalogue's placeholders (see `carpets.ts`) and the panel says so.
- Colour fidelity: Neutral tone mapping, a bright neutral hemisphere light and a warm sun through the first window. A wall picked as `#efe6d6` renders at about 92% of that value on screen, measured from a headless screenshot, not by eye.
- Controls: arrange mode drags furniture (sofas snap flush to a wall within 22 cm); touch mode grabs the rug. Every action has a keyboard route (arrow buttons in the panel, arrow keys on the focused canvas, a shake button). Under reduced motion the rug stays still, as on the landing.
- Camera views: overview (orbit), inside the room (look around), and top (plan, walls drop to a low edge).
- Not verified: frame rate and shake feel on a real GPU (checked on a software renderer only).
