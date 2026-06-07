# Sequence diagram rendering (template path)

Sequence diagrams have their own renderer (`render-sequence.mjs`), built with the same
method as flowchart (`references/render-method.md`): structured data (or Mermaid
`sequenceDiagram`) → actor-column + time-axis layout → messages / activations / notes /
fragment frames → style preset → hand-drawn Excalidraw. Use this for any sequence diagram
instead of the generic `mermaid-to-excalidraw.mjs`.

## One command

```
node scripts/render-sequence.mjs <input.mmd|ir.json> <out.excalidraw> [style]
```

`<input>` is Mermaid `sequenceDiagram` (auto-detected) or an IR JSON. Mermaid is parsed by
`scripts/mermaid-sequence.mjs`.

## Styles

`classic-tricolor` · `hachure-classic` · `pastel-journal` · `duotone-hachure` — same
Excalidraw-reproducible knob set as flowchart. Style controls participant box / activation
bar / note / lifeline / frame fills; message arrowheads are fixed by semantics. See
`prompts/sequence-styles.md` for the component sheet + gpt-image prompts.

## What it does automatically

- **Layout** — actors become evenly spaced columns; each event (message/note) takes the
  next time row going down; lifelines drop from each actor.
- **Messages** — `sync` solid + filled triangle head, `return` dashed + open head, `async`
  open head, `cross/destroy` bar end; self-messages draw a loop on the lifeline; labels
  sit above the arrow.
- **Activations** — `+`/`-` markers grow/close a thin activation bar on the lifeline.
- **Notes** — `Note over/right of/left of` draws a sticky box at that point.
- **Fragments** — `loop / alt / opt / par / critical / break` draw a labelled dashed frame
  spanning the involved actors and the contained rows; `alt … else …` adds a divider.

## Mermaid syntax supported

`participant A as Alice` · `actor B` · messages `A->>B:` (sync) `A-->>B:` (return)
`A->B:`/`A->)B:` (open/async) `A-xB:` (destroy), with `+`/`-` activation suffix on target.
`Note over A,B: text` (and right of / left of). `loop/alt/else/opt/par/and/critical/break …
end`. `<br/>` → line break. autonumber/title ignored.

## Testing

Cases in `examples/sequence/cases/*.mmd` (order, oauth, retry).

```
node scripts/test-sequence.mjs                 # list cases + styles
node scripts/test-sequence.mjs order pastel-journal
node scripts/test-sequence.mjs oauth all       # one case, every style (montage)
node scripts/test-sequence.mjs all hachure-classic
```

Outputs to `examples/sequence/out/`. Run the squint test after (`references/verification.md`).
