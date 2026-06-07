# ER Component-Sheet Style Prompts (Excalidraw-reproducible)

Prompts for **gpt-image-2** to restyle the ER component sheet (`assets/mermaid-components/er-components.png`: entity box
with attribute rows + 4 crowfoot cardinality markers — one / zero-or-one / one-or-many /
zero-or-many). Same reproducibility rules as `flowchart-styles.md`; restores into `render-er.mjs` STYLE.

Reference image: `assets/mermaid-components/er-components.png`.

## Shared prefix
```
Image-to-image. The reference image is an ER-diagram component sheet: an entity box (name bar
+ attribute rows with PK/FK) and 4 crowfoot cardinality markers (one = double bar, zero-or-one
= bar+circle, one-or-many = crowfoot+bar, zero-or-many = crowfoot+circle). Redraw the SAME
components, SAME positions, sizes and labels — do NOT add, remove or rearrange. Keep the
crowfoot / bar / circle marker shapes exactly. Hand-drawn flat vector look, no 3D / shadows /
gradients / texture. Keep gray captions. Restyle as:
```

## Styles
### `classic-tricolor`
```
Charcoal outlines on white. Entity name bar SOLID pale blue (#a5d8ff / #1971c2), body white.
Relationship lines and crowfoot/bar/circle markers charcoal; circle marker white-filled.
```
### `hachure-classic`
```
Name bar HACHURE blue. Wobbly ink outlines, body white. Markers charcoal, circle white-filled.
```
### `pastel-journal`
```
Cream paper (#fdf6e3), warm brown ink (#2b2b2b). Name bar SOLID peach (#ffd9a8), body off-white.
Markers brown, circle white-filled.
```
### `duotone-hachure`
```
One hue (violet): violet outlines (#7048e8), name bar light-violet HACHURE (#eadcff), body white.
Markers violet, circle white-filled.
```

## Restore mapping
Per part extract into `render-er.mjs` STYLE: `title` (name-bar fill), `body` (body fill), `ink`
(outline + marker color). Crowfoot/bar/circle marker shapes are fixed by cardinality semantics.
