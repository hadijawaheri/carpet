---
name: Farsh
description: A carpet museum's study gallery in Persian RTL, where real carpet photos hang as touchable 3D cloth.
colors:
  madder-wall: "#6c1116"
  wall-deep: "#470a0e"
  wall-lit: "#8c1b20"
  gallery-cream: "#f4e8d5"
  on-wall-muted: "#e2c2a4"
  saffron: "#d6a24a"
  mount-board: "#f2e7d3"
  mount-ink: "#2a1410"
  mount-muted: "#e9dcc4"
  mount-muted-ink: "#6a4637"
  mount-pressed: "#e6d6bb"
  mount-rule: "#d2bd9b"
  oxblood-action: "#7d141a"
  rust-destructive: "#8f2a14"
  indigo: "#1f2f57"
typography:
  inscription:
    fontFamily: "Markazi Text, Vazirmatn, Times New Roman, serif"
    fontSize: "clamp(3.25rem, 2rem + 4.6vw, 6rem)"
    fontWeight: 700
    lineHeight: 1.02
  display-l:
    fontFamily: "Markazi Text, Vazirmatn, Times New Roman, serif"
    fontSize: "clamp(2.5rem, 1.8rem + 2.4vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.08
  heading:
    fontFamily: "Markazi Text, Vazirmatn, Times New Roman, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
  lead:
    fontFamily: "Vazirmatn, Tahoma, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.9
  body:
    fontFamily: "Vazirmatn, Tahoma, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.95
  spec:
    fontFamily: "Vazirmatn, Tahoma, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Vazirmatn, Tahoma, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
  accession:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "1px"
  md: "2px"
  lg: "4px"
  full: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter: "40px"
  mount-pad: "20px"
  mount-pad-lg: "32px"
  column-gap: "48px"
  column-gap-lg: "80px"
  section: "80px"
  section-lg: "112px"
components:
  button-primary:
    backgroundColor: "{colors.oxblood-action}"
    textColor: "{colors.gallery-cream}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.wall-deep}"
  button-mount:
    backgroundColor: "{colors.mount-board}"
    textColor: "{colors.mount-ink}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "44px"
  button-mount-hover:
    backgroundColor: "{colors.mount-pressed}"
  accession-label:
    backgroundColor: "{colors.mount-board}"
    textColor: "{colors.mount-ink}"
    padding: "20px"
  mount-panel:
    backgroundColor: "{colors.mount-board}"
    textColor: "{colors.mount-ink}"
    padding: "32px"
  material-tab:
    textColor: "{colors.mount-muted-ink}"
    typography: "{typography.spec}"
  material-tab-active:
    textColor: "{colors.oxblood-action}"
  badge-default:
    backgroundColor: "{colors.oxblood-action}"
    textColor: "{colors.gallery-cream}"
    rounded: "{rounded.sm}"
    padding: "2px 10px"
---

# Design System: Farsh

## Overview

**Creative North Star: "The Study Gallery"**

Farsh is a carpet museum's study hall, not a shop. Every page is a madder-red wall; carpets hang on it as accessioned specimens under raking light, and the visitor is allowed to handle them. Everything that must be read at length (the accession label, the study table, the research catalogue) is pinned to the wall as a cream mount board. There is one world and one theme: a gallery does not repaint its walls, so there is no light/dark switch.

Density is calm and generous: large Naskh inscriptions across the wall, long-leaded Persian body copy, mounts with tight tombstone-style data inside. The only imagery is the owner's own carpet photographs, either as 3D hanging cloth or as framed photos; carpets are never drawn, illustrated or generated. The layout is right-to-left and built entirely with logical properties.

**Key Characteristics:**

- Madder wall everywhere; cream exists only as inset mount boards.
- Saffron is the wall's accent (rails, rods, focus, one inscribed word); indigo is the mount's focus colour and the loupe ring.
- Near-square corners (2px); depth comes from mounts lifting off the wall, not from cards.
- Naskh serif inscriptions, Vazirmatn text, mono accession numbers.
- Real photos only; the 3D carpet casts its own shadow on the wall.

## Colors

A drenched, warm two-surface palette: deep madder reds for the wall, parchment creams for the mount, with saffron and indigo as the two focus inks.

### Primary

- **Madder Wall** (madder-wall): the page ground on every route (`bg-background`). Never swapped for cream at page level.
- **Deep Wall** (wall-deep): darker bays such as the collection room, the base of the hall's lighting gradient, scrollbar track, selection text, and the primary button's hover.
- **Lit Wall** (wall-lit): only as the centre of the radial "spotlight" gradients painted behind the hall and closing inscription.

### Secondary

- **Saffron** (saffron): accent on the wall. Gallery rails (the 4px collection rail), underline decoration on wall links, focus rings on the wall, the hall's grab hint icon, scrollbar thumb, text selection, caret, and a single highlighted word in an inscription or a heading-size term.

### Tertiary

- **Indigo** (indigo): focus on the mount (`--ring`) and the loupe's lens ring. Never a wall or panel fill.
- **Oxblood Action** (oxblood-action): the action colour on the mount: primary button fill, active material tab underline and text, "draft" markers, default badge.
- **Rust** (rust-destructive): destructive actions only.

### Neutral

- **Gallery Cream** (gallery-cream): primary text on the wall, text on oxblood.
- **Wall Muted** (on-wall-muted): secondary text on the wall (leads, captions, hints, wordmark tagline); at 25-30% opacity it draws hairline dividers on the wall.
- **Mount Board** (mount-board): the cream panel surface for labels, tables, the research list.
- **Mount Ink** (mount-ink): text on the mount.
- **Mount Muted / Muted Ink** (mount-muted, mount-muted-ink): photo backing behind the loupe image; secondary text and field labels on the mount.
- **Mount Pressed** (mount-pressed): hover fill for mount buttons.
- **Mount Rule** (mount-rule): 1px dividers inside mounts and the inactive tab baseline.

### Named Rules

**The Two Surfaces Rule.** There are exactly two grounds: the madder wall and the cream mount. Cream never becomes a page background; red never becomes a reading panel.

**The Focus Follows the Ground Rule.** Focus rings are saffron on the wall and indigo on the mount, always 2px, with a 4px offset on wall images.

## Typography

**Display Font:** Markazi Text (with Vazirmatn, Times New Roman, serif)
**Body Font:** Vazirmatn (with Tahoma, system-ui, sans-serif)
**Label/Mono Font:** Azeret Mono (with ui-monospace)

**Character:** An Iranian Naskh serif, bold and tightly set, reads like lettering on a gallery wall; Vazirmatn carries labels and prose at tall Persian leading; a Latin mono stamps accession numbers like a museum register.

### Hierarchy

- **Inscription** (700, clamp 3.25-6rem, 1.02): one per room at most; the hall headline and the closing line.
- **Display L** (700, clamp 2.5-4rem, 1.08): room titles (knots, collection, research, design-hub sections).
- **Heading** (700, 2rem, 1.25): mount titles, catalogue entries, saffron study terms.
- **Lead** (400, 1.25rem, 1.9): room introductions in wall-muted, 34-60ch.
- **Body** (400, 1.0625rem, 1.95): running prose, capped at about 58-60ch.
- **Spec** (400, 0.875rem, 1.5): tombstone data lists inside mounts, tabular numerals.
- **Label** (400-600, 0.8125rem, 1.6): captions, hints, field legends, footer line.
- **Accession** (400, 0.75rem, 1.4, mono, wide tracking, LTR): catalogue numbers like FR-01 only.
- **UI text** (600, 0.875rem): nav links, buttons, tabs.

### Named Rules

**The Inscription Rule.** Markazi is for inscriptions and titles only, always bold; it never sets UI controls or body text.

**The Register Rule.** The mono face sets accession numbers and nothing else, isolated with `dir="ltr"`.

## Layout

RTL throughout, logical properties only (start/end, ps/pe, ms/me); directional icons flip with `rtl:rotate-180`. Rooms are full-bleed wall bands with content in a 1280px (max-w-7xl) container, 16px gutters on mobile and 40px from 640px. Rooms breathe at 80px vertical padding, 112px from 1024px. Two-column rooms use asymmetric fractional grids (5/6, 4/7, 6/5) with 48px gaps, 80px on desktop, collapsing to one column below 1024px.

The hall is the exception: it fills the first viewport (100svh minus header), the 3D carpet stage takes the start column and the inscription plus accession label stack in a 20-25rem end column; on mobile the order is title, stage (66svh), label. The collection rail scrolls horizontally and hangs every specimen at true relative size (fixed pixels per centimetre) with a 1-metre scale bar.

## Elevation & Depth

Depth is physical, not interface chrome: the wall is lit by painted radial gradients (wall-lit fading into wall-deep), the 3D carpet casts a real shadow onto a shadow-catching wall plane under a raking museum spot, and mount boards and framed photos sit slightly off the wall with one shadow.

### Shadow Vocabulary

- **Mount** (`box-shadow: 0 24px 48px -28px rgb(20 2 4 / 0.7), 0 2px 6px -2px rgb(20 2 4 / 0.35)`): every cream mount and every framed carpet photo on the wall. Nothing else.

### Named Rules

**The One Shadow Rule.** The mount shadow is the only box-shadow token. Buttons, tabs, badges and cards stay flat.

## Shapes

Near-square everywhere: base radius 2px, 1px for badges, tabs and focus targets; mounts and photos have no radius at all. Full rounding is reserved for two physical objects: the collection rail bar and the loupe lens. Borders are 1px hairlines (mount rule inside mounts, wall-muted at 30% on the wall); the material tabs use a 2px bottom rule. Table headers take a 2px mount-ink rule.

## Components

### Buttons

- **Shape:** near-square (2px), 44px tall, 24px inline padding, 600 weight 0.875rem.
- **Primary:** oxblood fill, cream text; hover darkens to deep wall.
- **Mount:** cream button for use on the wall; hover to mount-pressed.
- **Secondary / Ghost:** secondary is a transparent outline in currentColor at 40%, full on hover; ghost is text that underlines on hover.
- **Focus:** 2px ring with 2px offset against the wall.

### Chips (badges)

- **Style:** 1px-radius tag, 0.75rem semibold; oxblood fill by default, outline and muted variants for secondary metadata.

### Cards / Containers

- **Mount boards** are the container: cream, square-cornered, mount shadow, 20px padding (32px from 640px for wide panels), internal 1px mount-rule dividers. Lists inside mounts separate entries with top rules, not boxes.

### Inputs / Fields

- **Toggles:** cream fill, 1px input-brown border, 2px radius, 40px tall; on-state fills with gallery cream and madder text.
- **Material tabs (on the accession label):** three equal columns, 2px bottom rule in mount-rule; active becomes oxblood text and oxblood rule; colour change over 300ms with the settle ease.

### Navigation

- Header painted on the wall: bold Markazi wordmark (2.25rem) with a wall-muted label tagline; room links in 600 0.875rem with a saffron underline at 8px offset on hover. Wraps on mobile, no hamburger.

### Accession Label (signature)

The museum tombstone that doubles as the carpet's controls: title in heading, a two-column spec list (muted terms, tabular values), the material tabs as a fieldset, a live-region note, and a footer with previous/next specimen links flanking the mono accession number.

### Loupe (signature)

A circular lens with a 3px indigo ring over the real carpet photo, magnifying no further than the photo's native pixels; keyboard movable; the framed photo carries the mount shadow and a saffron focus ring.

### Hanging Cloth and Rail (signature)

The 3D carpet hangs from a brass rod by its top edge and sways; lifting a lower corner reveals the back. Reduced-motion and no-WebGL visitors get the still photo. In the collection room, specimens hang under a saffron rail, lift 4px on hover over 500ms with the settle ease (`cubic-bezier(0.22, 1, 0.36, 1)`), and the active one gets a saffron ring.

## Do's and Don'ts

### Do:

- **Do** use `bg-background` (madder) for every page and room; use `bg-wall-deep` to mark a distinct bay.
- **Do** put any label, table or long reading list on a cream mount with the mount shadow.
- **Do** use saffron for focus and rails on the wall, indigo for focus on the mount.
- **Do** set room titles in Markazi bold and keep body copy at 1.95 leading, max about 60ch.
- **Do** use only the owner's photos from `public/carpets`, with the settle ease for any motion and a still fallback for reduced motion.

### Don't:

- **Don't** add a light/dark theme or `dark:` overrides; the wall never repaints.
- **Don't** use cream as a page background or red as a reading panel.
- **Don't** draw, illustrate or generate carpets, patterns or cartoon rugs.
- **Don't** add rounded cards, extra shadow tokens or shadows on controls.
- **Don't** use physical left/right properties or raw colour values in components.
