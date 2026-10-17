# 0008 · A modelled 3D room instead of room photos

Date: 2026-10-17 · Status: accepted (owner: the photo room "looks unnatural and unreal"; wants more rooms, sizes, colours and a salon)

- The room preview is a real 3D room built in the existing R3F stack (ADR 0003), not a carpet photo skewed over a room photo. A photo can't change size, paint, floor or light, and a CSS-skewed carpet never sits on its floor. The design's room photos are removed (they also carried generated rugs).
- Everything is to scale in metres: the room from the visitor's sliders, the furniture from real catalogue sizes, the carpet from its `widthCm × lengthCm`. The panel grades the fit (too big, wall to wall, balanced, small) from that geometry, with the bare-floor margin and the share of floor covered.
- Five rooms (living, formal salon, bedroom, dining, office). Each lays its furniture out against wall distances, so pieces keep their clearances at any size; plants, lamps and the sideboard are dropped where they would collide. The salon has its own larger size limits, raised panels, crown moulding and chandeliers.
- Floors, plaster, fringe and the wall art are drawn on canvases at load: no texture downloads and nothing that could be mistaken for a carpet. The only carpet image is the owner's photo (CLAUDE.md).
- Light behaves as in a room: the sun enters only through the windows (walls cast shadows), each window adds soft sky light, bounce is tinted by paint and floor, and night switches to the lamps. N8AO ambient occlusion (`@react-three/postprocessing`) grounds furniture and corners; it is dropped when `PerformanceMonitor` reports a slow device. Tone mapping stays Neutral (ADR 0007) so the carpet's colours stay true.
- Cut-away camera: a wall or the ceiling the camera is behind stops drawing but still casts shadows, so the room can be orbited freely without hiding the carpet.
- The carpet unrolls from a dealer's roll on arrival (an Archimedean spiral, `rug-unroll.ts`, free of React and three.js), can be dragged on the floor, nudged with the arrow keys and turned with R. Reduced motion skips the unroll and the camera moves.
- Without WebGL 2 the stage shows a to-scale plan from above instead of a broken canvas.
- End-to-end tests (Playwright, `pnpm --filter @farsh/web test:e2e`) cover the whole page on desktop and a phone viewport, with the API mocked. Containers without a GPU render the room through SwiftShader. The stage exposes the carpet's position as `data-rug-*` attributes so tests can check moves without reading pixels.
