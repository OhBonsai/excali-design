# Gantt chart rendering (template path)

A gantt chart is a **bar-on-time-axis chart**: tasks are rows, time is the x-axis, each bar's
position and width are computed from dates (faithful geometry; `roughness` only wobbles the
stroke, the bar bounds stay exact). `render-gantt.mjs` builds it from Mermaid `gantt` syntax or
an IR JSON. Use this instead of the generic `mermaid-to-excalidraw.mjs`.

## One command
```
node scripts/render-gantt.mjs <input.mmd|ir.json> <out.excalidraw> [style]
```
Mermaid `gantt` is auto-detected and parsed by `scripts/mermaid-gantt.mjs`.

## Styles
`classic-tricolor` · `hachure-classic` · `pastel-journal` · `duotone-hachure` — controls the
bar fill palette; status colors (crit/done/active) are fixed by semantics.

## What it does automatically
- **Time scale** — `x = scale(date)`, bar `width = scale(end) − scale(start)`; all geometry is
  computed from the dates, never hand-placed.
- **Dependencies** — `after <id>` resolves a task's start to the end of its predecessor;
  bare tasks chain after the previous one.
- **Status colors** — `done` muted gray, `active` green, `crit` red, default blue.
- **Milestones** — `:milestone` (zero duration) renders as a diamond at its date.
- **Sections** — each `section` becomes a labelled header row grouping its tasks.
- **Axis / grid** — date ticks at a nice interval (2d / 1w / 2w / 1mo by span) with light
  dashed gridlines and `MM-DD` labels; per-bar duration label (`10d`).

## Mermaid syntax supported
`title`, `dateFormat YYYY-MM-DD` (others ignored), `section <name>`, and task lines
`Name : [done|active|crit|milestone,] [id,] (date | after id), (duration<d|w|h> | end-date)`.

## Faithfulness lint (chart discipline, see thinking.md §9.2)
Bars must be proportional to durations; the axis is continuous time; milestones are points.
Do not hand-tune bar widths — fix the dates in the source and re-render.

## Testing
Cases in `examples/gantt/cases/*.mmd` (launch).
```
node scripts/test-gantt.mjs                 # list
node scripts/test-gantt.mjs launch pastel-journal
node scripts/test-gantt.mjs launch all      # one case, every style
```
Outputs to `examples/gantt/out/`. Squint test after.
