# State diagram rendering (template path)

State machines have their own renderer (`render-state.mjs`), built with the same method as
flowchart (`references/render-method.md`). A state diagram is a directed graph, so it
reuses the **same layered layout + orthogonal routing** as the flowchart renderer; only the
node vocabulary differs. Use this for any state diagram instead of the generic
`mermaid-to-excalidraw.mjs`.

## One command

```
node scripts/render-state.mjs <input.mmd|ir.json> <out.excalidraw> [style]
```

`<input>` is Mermaid `stateDiagram-v2` (auto-detected) or an IR JSON. Mermaid is parsed by
`scripts/mermaid-state.mjs`.

## Styles

`classic-tricolor` · `hachure-classic` · `pastel-journal` · `duotone-hachure` — same
reproducible knob set. Style controls state / choice fills; initial/final dots and
fork/join bars are solid ink. See `prompts/state-styles.md` for the sheet + gpt-image prompts.

## Node vocabulary

`[*]` as a source → **initial** (filled dot); `[*]` as a target → **final** (ring + dot).
`state Name` → **state** (rounded box). `state "Long Name" as id` → display label.
`state X <<choice>>` → **choice** (diamond). `<<fork>>` / `<<join>>` → **bar**.
Composite `state Name { ... }` → inner states are flattened (the brace nesting is parsed
transparently in v1; inner transitions still render).

## Mermaid syntax supported

Transitions `A --> B` with optional `: event / guard` label, `[*]` for initial/final,
`direction TB|LR`, choice/fork/join via `<<…>>`, `state "x" as y` aliases. Notes
(`note left/right of …`) are ignored in v1.

## Testing

Cases in `examples/state/cases/*.mmd` (order, tcp, choice).

```
node scripts/test-state.mjs                 # list cases + styles
node scripts/test-state.mjs tcp pastel-journal
node scripts/test-state.mjs order all       # one case, every style (montage)
node scripts/test-state.mjs all hachure-classic
```

Outputs to `examples/state/out/`. Run the squint test after (`references/verification.md`).
