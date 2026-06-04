# Color discipline

> In one sentence: **color encodes semantics, not decoration. The whole diagram <= 3-4 colors, body in black/gray.**

## Baseline

- Body: stroke `#1e1e1e` (ink), background `transparent`/white
- De-emphasis: `#868e96` (gray) for secondary/disabled/auxiliary
- One accent running through the "protagonist" (primary action / main data flow / current selection)

## Semantic palette (use only when expressing semantics)

| Semantic | Stroke | Light fill |
|---|---|---|
| Main path/emphasis | `#1971c2` blue | `#a5d8ff` |
| Success/added/healthy | `#2f9e44` green | `#b2f2bb` |
| Error/alert/degraded | `#e03131` red | `#ffc9c9` |
| External dependency/secondary emphasis | `#f08c00` orange | `#ffec99` |

## Encoding rules

- **Color by category** (architecture: frontend/backend/data/external each one color), not by what looks nice
- For a given diagram, first decide "color = what meaning," write it into a small legend in the corner of the diagram, then apply colors
- Use very light fills for background layering (`#f1f3f5` gray / light beige), so it does not compete with the nodes
- Avoid: one color per element, gradients, neon, adding color for the sake of "richness"

## Self-check

Before adding a color, ask: **what information does this color encode?** If you cannot answer -> do not add it, use black/gray.
