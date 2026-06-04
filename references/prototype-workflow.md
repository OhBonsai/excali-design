# Product Prototype Workflow (v1 main line)

> The complete workflow for drawing product prototypes / wireframes / UI mockups with Excalidraw.
> Core: reuse drawlib controls + grid alignment + honest placeholders + skeleton first, details later.

## 0. First decide fidelity (lo-fi / mid-fi)

Excalidraw prototypes do not chase pixel perfection -- that is the job of huashu-design's HTML hi-fi. Excalidraw's sweet spot is:

| Fidelity | What it looks like | When to use |
|---|---|---|
| lo-fi wireframe | Gray blocks + placeholder text + hand-drawn controls, `roughness: 1` | Early exploration of layout/flow, where the "not finalized" approachability is exactly the point |
| mid-fi prototype | Reuse drawlib controls, real copy, restrained colors, aligned to grid | Reviews, aligning with engineering, showing PMs the interaction flow |

When requirements are vague, default to mid-fi. If the user says "just sketch something rough" -> lo-fi. Do not force hi-fi inside Excalidraw (jarring and time-consuming; use huashu-design for that).

## 1. Explore context (prototype principle #1)

Find references in priority order:
1. Existing product screenshots / Figma / design system -> extract layout patterns, control inventory, copy tone
2. Competitor references (user provides URL/screenshot)
3. Page structure in the codebase (`routes/` `pages/` `components/`) -> learn which screens and controls exist
4. None of the above -> list directions for the user to choose (landing page / form page / Dashboard / list-detail), then start

## 2. Four layout questions (must be answered before starting each screen)

- This screen's task: what does the user come to this screen to accomplish? (decides which control is the protagonist)
- Information hierarchy: the three-tier split of primary action / secondary action / supporting information?
- Screen type: form / list / detail / Dashboard / onboarding? (decides the skeleton template, see below)
- Multi-screen relationship: single screen or flow? If a flow, how are the screens connected? (overview tiled vs flow connected by arrows)

## 3. Skeleton templates (starting layouts for common screen types)

Use webpage-frame as the shell, place skeleton gray blocks first, then fill in drawlib controls.

Form page: top title -> field group (label + Text field, vertical stack, fields left-aligned to the same x) -> bottom primary button (Filled button) + secondary button (Outlined button). Take fields from `drawlib` library 1.

List page: top bar (Search field + Hamburger menu) -> list items (repeated rows: Image placeholder + two lines of text + Go forward arrow), consistent row height, equal y spacing.

Detail page: Hero (large Image placeholder) -> title/meta info -> body placeholder -> bottom action bar (Confirm/Reject).

Dashboard: top bar -> metric card row (2-4 equal-width boxes + large number placeholder) -> chart area (take Bar/Line/Donut from `excali-chart`) -> table placeholder. High-density type: at least 3 pieces of real information per screen (do not put just one chart).

Onboarding/empty state: centered Bulb/Image placeholder + a one-line title + primary button. Whitespace is design, do not fill it up.

## 4. Multi-screen delivery form (ask the user which one first)

| Form | When to use | Approach |
|---|---|---|
| Overview tiled | See the whole picture / compare layouts / walk through consistency | All screens side by side, one webpage-frame per screen, consistent horizontal gap, add a gray italic label above each screen |
| Flow connected | Demonstrate one user path | Screens laid out horizontally by flow, connected by arrows between screens (annotate the trigger action: "click login"), arrows bound to the screen frames |

Routing: when "tiled/all pages/take a look/compare" appears -> overview; when "flow/walk through/path" appears -> flow. When unsure, ask, do not default to the more labor-intensive option.

## 5. Reuse drawlib (mandatory, see drawlib-catalog.md)

- 90% of controls from `excali-ui`
- Page shell from `excali-frame`
- Control state comparison from `excali-ui` (form states already merged in)
- Chart placeholders from `excali-chart`
- Characters/actors from `excali-person`

Hand-drawing only happens for things not in the library (specific layout containers, custom combinations).

## 6. Alignment and grid (the easiest place for a prototype to go wrong)

- All element x/y snap to the 20px grid
- Controls in the same vertical stack left-aligned to the same x
- Controls in the same horizontal row top-aligned to the same y, equal gap
- Consistent gap between screens
- The spacing between a field label and its input box uniform across the whole screen
- Misalignment = amateur; this is the biggest difference between mid-fi and "AI drew it offhand"

## 7. Colors (prototype version, see color-system.md)

- Body `#1e1e1e` stroke + `transparent`/white background
- One accent color running through the primary action (primary button, current selected state) -- do not give each button its own color
- Disabled state uses `#868e96` gray
- States: success `#2f9e44` / error `#e03131`, used only when actually expressing state
- Whole screen <= 3 colors

## 8. Junior pass -> Full pass

Junior pass (show first): webpage-frame shell + gray block placeholders + key labels + `<!-- primary button TBD -->` comment-style placeholders. Render with create_view, ask the user "is the layout like this right?"

Full pass (after confirmation): replace gray blocks with real drawlib controls, fill in real copy, apply the accent color, align to the grid, connect screens into a flow. Show again partway through.

## 9. Verification (before delivery, see verification.md)

- No unintended overlap between elements
- Controls taken from the library and not deformed after translation
- Whole screen aligned to the grid, same-layer aligned
- Colors <= 3 colors
- Multi-screen flow arrows bound correctly, consistent direction
- Placeholders are all honest (no fabricated fake data masquerading as real content)
