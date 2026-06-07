# Sequence Component-Sheet Style Prompts (Excalidraw-reproducible)

Prompts for **gpt-image-2** to restyle the sequence component sheet
(`assets/mermaid-components/sequence-components.png`, 12 items: participant / actor / lifeline / activation /
sync·return·async message / self-message / destroy / note / fragment frame / alt frame).
Same reproducibility rules as `flowchart-styles.md` — every style maps onto real
Excalidraw knobs (`fillStyle` / `roughness` / `strokeStyle` / `strokeWidth`), so each
generated sheet restores 1:1 into a `STYLE` preset for `render-sequence.mjs`.

Reference image to feed every prompt: `assets/mermaid-components/sequence-components.png`.

## Shared prefix — prepend to EVERY body

```
Image-to-image. The reference image is a sheet of 12 UML sequence-diagram components in a
4-column grid with a gray caption under each cell (participant box, actor stick-figure,
lifeline, activation bar, sync / return / async message arrows, self-message, destroy,
note, loop/opt fragment frame, alt frame with else divider). Redraw the SAME 12 components,
SAME grid positions, sizes, and labels — do NOT add, remove, or rearrange anything. Keep
each component identifiable. Hand-drawn flat vector look, no 3D / shadows / gradients /
paper texture. Keep the gray captions. Restyle as:
```

## Styles (shared with flowchart — same knob logic)

### `classic-tricolor`
```
Clean hand-drawn whiteboard look on white. Charcoal outlines (#1e1e1e), SOLID flat fills:
participant/lifeline-head pale blue (#a5d8ff / #1971c2), activation bar pale green
(#d3f9d8), note pale amber (#fff3bf / #e8a838). Message arrows charcoal — sync arrow a
solid line with a filled triangular head, return a dashed line with an open head, async a
solid line with an open head. Fragment/alt frames thin gray dashed with a small label tab.
```

### `hachure-classic`
```
All fills HACHURE (sketchy diagonal pen lines, white gaps showing), not solid. Wobbly ink
outlines. participant blue hachure, activation green hachure, note amber hachure. Arrows
charcoal as above (filled-triangle sync / dashed-open return / open async). The diagonal
fill texture is the point.
```

### `pastel-journal`
```
Cream paper (#fdf6e3). Warm dark-brown ink outlines (#2b2b2b). SOLID soft pastel fills:
participant peach (#ffd9a8), activation sage (#d4ee9f), note lavender (#e6dcf7). Cozy
notebook warmth, low saturation. Arrows in brown ink, same head conventions.
```

### `duotone-hachure`
```
One hue family (violet): violet outlines (#7048e8) with light-violet HACHURE fills
(#eadcff) on participant / activation / note. Arrows violet. Monochromatic, quiet,
cohesive; the hachure texture supplies the hand-drawn warmth.
```

## Restore mapping (gpt sheet → STYLE preset)

Per component extract `stroke / fill / fillStyle / roughness / strokeStyle / strokeWidth`
into the matching `render-sequence.mjs` STYLE field: `actor` (participant box),
`activation`, `note`, `life` (lifeline), `frame` (fragment), plus message line/head defaults.
Message heads are fixed by semantics (sync=triangle, return/async=open), not by style.
