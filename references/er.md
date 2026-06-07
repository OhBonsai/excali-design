# ER diagram rendering (template path)

ER diagrams have their own renderer (`render-er.mjs`), built with the method in
`references/render-method.md`. An ER diagram is a graph of entity boxes + relationships, so it
reuses the **same layered layout** as flowchart; the node is an entity box (name + attribute
rows) and the edges carry **crowfoot cardinality as native Excalidraw arrowheads** (svg-export
renders the full enum): `{crow,circle,bars}` → `cardinality_many / one / one_or_many /
zero_or_one / zero_or_many / exactly_one` (mapping in `cardEnum` in `render-er.mjs`). Use this
for any ER diagram instead of the generic `mermaid-to-excalidraw.mjs`.

## One command
```
node scripts/render-er.mjs <input.mmd|ir.json> <out.excalidraw> [style]
```
`<input>` is Mermaid `erDiagram` (auto-detected) or IR JSON; parsed by `scripts/mermaid-er.mjs`.

## Styles
`classic-tricolor` · `hachure-classic` · `pastel-journal` · `duotone-hachure` — controls the
name-bar / body fills; crowfoot marker shapes are fixed by cardinality. See `prompts/er-styles.md`.

## Node + cardinality
Entity box = name bar + attribute rows (`name : type` with optional `PK`/`FK`/`UK`). Relationship
cardinality tokens → crowfoot markers per end: `||` exactly one (double bar) · `|o`/`o|`
zero-or-one (bar + circle) · `|{`/`}|` one-or-many (crowfoot + bar) · `o{`/`}o` zero-or-many
(crowfoot + circle). `--` identifying (solid), `..` non-identifying (dashed). `: label` is the
relationship name.

## Mermaid syntax
`A ||--o{ B : places`, entity blocks `ENTITY { int id PK \n string name }`.

## Testing
Cases in `examples/er/cases/*.mmd` (shop, blog).
```
node scripts/test-er.mjs                  # list
node scripts/test-er.mjs shop pastel-journal
node scripts/test-er.mjs blog all
```
Outputs to `examples/er/out/`. Squint test after.
