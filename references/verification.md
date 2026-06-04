# Verification before delivery

## Static diagram self-check list

- [ ] **Squint test (mandatory, do not skip)**: after exporting the PNG, heavily blur/shrink it and look again -- under blur, can you still recognize the layering, the focus, the grouping? Does it read as a hand-drawn diagram rather than a web screenshot? Is there a "barcode/noodle" noise zone? You must report the squint result when reporting.
- [ ] **Architecture diagram: subtract arrows** -- keep only the entry trunk + one core hero, no stacked arrows; express the rest of the dependencies via layering + whitespace + notes (see anti-slop.md)
- [ ] No accidental overlap / occlusion between elements
- [ ] All elements snapped to the 20px grid, aligned within a layer
- [ ] Arrows are all `binding`ed to nodes (do not detach when the layout changes)
- [ ] Data flow direction is consistent (whole diagram left to right or top to bottom)
- [ ] Palette <= 3-4 colors, semantic (has a legend)
- [ ] drawlib components have no distortion and no id collision after translation
- [ ] Reused component ids have been regenerated
- [ ] Placeholders are all honest (no fabricated data)
- [ ] Architecture diagram: cross-check item by item against `system-facts.md` (all services present / directions correct / no missing edges)
- [ ] Single abstraction level (no mixing in drill-down details)

## How to verify

- **MCP available**: render with create_view and eyeball it once, or screenshot
- **MCP unavailable**: produce the `.excalidraw` file, import into excalidraw.com to check; or `node scripts/excalidraw-to-image.mjs diagram.excalidraw --png` to export a PNG and eyeball it
- **Programmatic - structure**: `scripts/verify.mjs` does a structural check on the `.excalidraw` (unique ids, bidirectional binding)
- **Programmatic - assisting scan (not a gate)**: `node scripts/arch-lint.mjs <diagram.excalidraw>` -- catches only the mechanical "obvious overlap/detachment" errors that the eye easily misses. **It is not a quality gate and not an optimization target**: it cannot measure whether the diagram is good or clearly communicated; do not modify the diagram just to get lint all-green (Goodhart). An alert != a bad diagram, all-green != a good diagram. The eye remains the standard. See `references/arch-lint.md` for details.

## Checkpoint

Note: go through it yourself once before delivery. AI-generated elements often have overlap/detachment/color collisions; if you do not go through it once there will surely be bugs.
