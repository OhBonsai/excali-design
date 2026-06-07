# State Component-Sheet Style Prompts (Excalidraw-reproducible)

Prompts for **gpt-image-2** to restyle the state-diagram component sheet
(`assets/mermaid-components/state-components.png`, 8 items: initial dot / final ring / state / composite state /
choice diamond / fork-join bar / transition / self-transition). Same reproducibility rules
as `flowchart-styles.md`; each generated sheet restores 1:1 into a `STYLE` preset for
`render-state.mjs`.

Reference image: `assets/mermaid-components/state-components.png`.

## Shared prefix — prepend to EVERY body

```
Image-to-image. The reference image is a sheet of 8 UML state-diagram components in a grid
with a gray caption under each cell (initial filled dot, final ring-dot, state rounded box,
composite state, choice diamond, fork/join bar, transition arrow, self-transition).
Redraw the SAME 8 components, SAME grid positions, sizes, and labels — do NOT add, remove,
or rearrange anything. Keep each component identifiable. Hand-drawn flat vector look, no 3D
/ shadows / gradients / paper texture. Keep the gray captions. Restyle as:
```

## Styles (shared knob logic)

### `classic-tricolor`
```
Charcoal outlines (#1e1e1e) on white. States SOLID pale-blue fill (#a5d8ff / #1971c2),
choice diamond pale blue too. Initial/final dots and fork/join bar solid charcoal.
Transition arrows charcoal with a simple triangular head.
```
### `hachure-classic`
```
HACHURE fills (sketchy diagonal lines, gaps showing) on states and choice — blue hachure.
Wobbly ink outlines. Initial/final dots and fork/join bar solid charcoal. Arrows charcoal.
```
### `pastel-journal`
```
Cream paper (#fdf6e3), warm brown ink (#2b2b2b). States SOLID peach (#ffd9a8), choice
soft blue (#a5d8ff). Dots/bar solid brown. Cozy notebook warmth, low saturation.
```
### `duotone-hachure`
```
One hue (violet): violet outlines (#7048e8), light-violet HACHURE fills (#eadcff) on states
and choice. Dots/bar solid violet. Monochromatic, quiet, cohesive.
```

## Restore mapping
Per component extract `stroke / fill / fillStyle / roughness / strokeStyle / strokeWidth`
into `render-state.mjs` STYLE: `fill(type)` for state/choice, `dot` for initial/final/fork/join.
