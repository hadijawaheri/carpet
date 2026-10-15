# 0009 · Cream walls: the carpets are red, so the room is not

Date: 2026-10-15 · Status: accepted · Revises the wall colour in 0005 and 0006

- The owner asked for cream to be the dominant colour. Most of his carpets are red, and red carpets read best on cream, which is also where his cream and blue carpets sit comfortably.
- `--background` is cream (`#efe3cc`) and text is ink (`#2a1410`). Mounts are a shade lighter than the wall. Madder (`#7d141a`) is kept for actions and emphasis.
- Saffron as text on the cream ground fails contrast, so the saffron token is a dark bronze (`#7a4f12`), which passes AA on both the wall and the lighter band.
- The 3D stage keeps its own lighting. The room designer's canvas stays dark so the lit room reads as a render.
- Contrast pairs remain asserted in `palette.test.ts`.
