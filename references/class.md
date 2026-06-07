# Class diagram rendering (template path)

Class diagrams have their own renderer (`render-class.mjs`), built with the method in
`references/render-method.md`. A class diagram is a graph of class boxes + relationships, so
it reuses the **same layered layout** as flowchart; the node is a 3-compartment class box and
the edges carry **UML relationship markers as native Excalidraw arrowheads** (svg-export renders
the full `Arrowhead` enum): inheritance/realization → `triangle_outline`, composition →
`diamond`, aggregation → `diamond_outline`, association/dependency → `arrow`; mapping in
`MK` in `render-class.mjs`. Use this for any class diagram instead of the generic `mermaid-to-excalidraw.mjs`.

## One command
```
node scripts/render-class.mjs <input.mmd|ir.json> <out.excalidraw> [style]
```
`<input>` is Mermaid `classDiagram` (auto-detected) or IR JSON; parsed by `scripts/mermaid-class.mjs`.

## Styles
`classic-tricolor` · `hachure-classic` · `pastel-journal` · `duotone-hachure` — style controls
the title-bar / body fills; relationship marker shapes and dashing are fixed by semantics. See
`prompts/class-styles.md`.

## Node + relationships
Class box = three compartments: name (with optional `«stereotype»`), attributes, methods.
Relationship operators → markers (parent/whole side ends up on top):
`<|--` inheritance (hollow triangle) · `<|..` / `..|>` realization (hollow triangle, dashed) ·
`*--` composition (filled diamond) · `o--` aggregation (hollow diamond) · `-->` association
(arrow) · `..>` dependency (arrow, dashed) · `--` plain association. Cardinality `"1"`/`"*"`
and `: label` are placed near the ends.

## Mermaid syntax
`class Name { +attr: Type \n +method() Ret }` blocks, inline `Name : +member`, `<<interface>>`
stereotype, and the relationship operators above with optional `"card"` and `: label`.

## Testing
Cases in `examples/class/cases/*.mmd` (animals, shapes).
```
node scripts/test-class.mjs                  # list
node scripts/test-class.mjs shapes pastel-journal
node scripts/test-class.mjs animals all      # one case, every style
```
Outputs to `examples/class/out/`. Squint test after.
