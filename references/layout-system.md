# Layout system

> Alignment is the biggest watershed between "mid-fi" and "dashed off by hand." Excalidraw does not auto-layout; the discipline is entirely manual.

## Grid

- Snap all `x`/`y`/`width`/`height` to the **20px grid** (`appState.gridSize: 20` in `.excalidraw`)
- Use multiples of 20 for spacing: 20 / 40 / 80 / 160

## Alignment rules

- Vertical stack: align the left edges to the same `x`
- Horizontal row: align the tops to the same `y`, with equal gaps
- Same-layer nodes (architecture diagram): align y, equal width, equal spacing
- Screen to screen (prototype overview): consistent gap

## Layout skeletons (by diagram type)

| Diagram type | Skeleton |
|---|---|
| Architecture (layered) | Horizontal swimlanes / vertical layers, large light-colored `area` boxes enclosing layers, nodes aligned within a layer |
| Architecture (topology) | Central system + surrounding dependencies, radial or left/right grouping |
| Data flow | Strict left to right or top to bottom, unidirectional |
| Sequence | actors in a horizontal row at the top + vertical lifelines + horizontal messages laid out downward by time |
| Multi-screen prototype | webpage-frames in a horizontal row, equal gap |
| Flow/decision | Vertical trunk + decision-point diamonds branching horizontally |

## Swimlanes

- Separate with thin lines, one role/system/layer per lane
- Place the label at the head of the lane
- Elements fall strictly within their own lane

## Grouping

- Give elements that belong to one logical unit the same `groupIds`, so they move together
- When reusing a drawlib component, keep its internal group

## Self-check

- Draw an imaginary vertical/horizontal line; element edges should land on the line
- No "off by a few pixels" misalignment (snapping to the grid eliminates it)
- Whitespace is even, not crammed on one side and empty on the other
