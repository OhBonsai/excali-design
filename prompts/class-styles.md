# Class Component-Sheet Style Prompts (Excalidraw-reproducible)

Prompts for **gpt-image-2** to restyle the class-diagram component sheet
(`assets/mermaid-components/class-components.png`: class box / interface box + 6 relationship markers — inheritance
hollow-triangle, realization dashed-triangle, composition filled-diamond, aggregation
hollow-diamond, association arrow, dependency dashed-arrow). Same reproducibility rules as
`flowchart-styles.md`; restores into `render-class.mjs` STYLE.

Reference image: `assets/mermaid-components/class-components.png`.

## Shared prefix
```
Image-to-image. The reference image is a UML class-diagram component sheet: a 3-compartment
class box (name / attributes / methods), an interface box, and 6 relationship markers
(inheritance, realization, composition, aggregation, association, dependency). Redraw the
SAME components, SAME positions, sizes and labels — do NOT add, remove or rearrange. Keep
the hollow vs filled marker shapes exactly (hollow triangle, filled/hollow diamond, open
arrow) and solid vs dashed lines. Hand-drawn flat vector look, no 3D / shadows / gradients /
texture. Keep gray captions. Restyle as:
```

## Styles
### `classic-tricolor`
```
Charcoal outlines on white. Class/interface TITLE bar SOLID pale blue (#a5d8ff / #1971c2),
body white. Relationship markers and lines charcoal; hollow markers filled white, composition
diamond filled charcoal.
```
### `hachure-classic`
```
Title bar HACHURE blue (#a5d8ff diagonal). Wobbly ink outlines, body white. Markers charcoal,
hollow ones white-filled, composition diamond solid charcoal. Lines charcoal.
```
### `pastel-journal`
```
Cream paper (#fdf6e3), warm brown ink (#2b2b2b). Title bar SOLID peach (#ffd9a8), body
off-white. Markers brown; hollow white-filled, composition diamond solid brown.
```
### `duotone-hachure`
```
One hue (violet): violet outlines (#7048e8), title bar light-violet HACHURE (#eadcff), body
white. Markers violet; hollow white-filled, composition diamond solid violet.
```

## Restore mapping
Per part extract into `render-class.mjs` STYLE: `title` (title-bar fill), `body` (body fill),
`ink` (outline + marker color). Marker shapes (triangle/diamond/arrow, hollow vs filled) and
line dashing are fixed by relation semantics, not by style.
