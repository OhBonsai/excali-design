# Before starting: ask questions / set direction

## Must-ask checklist (send all at once, wait for batched answers)

**General**:
1. Is there an existing reference? (prototype: screenshot/Figma/design system; architecture: codebase/existing architecture diagram/tech stack)
2. How many variants? On which dimension do they vary?
3. Do you need a PNG/SVG export (to paste into a doc/PPT), or just the `.excalidraw` source?

**Prototype-specific**:
4. lo-fi sketch or mid-fi?
5. Single screen or multi-screen flow? For multi-screen, overview tiling or flow chaining?
6. Which do you care about: layout / copy / interaction flow?

**Architecture-specific**:
4. Abstraction level: Context / Container / Component / deployment?
5. Drawing a real system (give me code/docs) or a new system in design?
6. Reading direction: data flow (left to right) or layered (top to bottom)?

## Vague requirements -> give a direction to choose between

Do not open by asking 10 questions. First list 2-3 differentiated directions for the user to choose from:
- "The architecture diagram you want is: (1) container level (services + DB + queue) (2) deployment topology (cloud resources) (3) data flow (how one request travels)?"
- "The prototype is: (1) single-screen layout exploration (2) multi-screen flow demo (3) Dashboard data page?"

Once chosen, enter the corresponding workflow.

## Checkpoint

Note: send the questions all at once, wait until the user has answered them in a batch, then start. Do not ask and draw at the same time.
