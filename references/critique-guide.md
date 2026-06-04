# Design review (optional)

> Use when the user says "review," "is this diagram good," "review," "score," or when you want to proactively quality-check. Review the diagram, not the person.

## 5-dimension scoring (each 0-10)

1. **Structural clarity**: are the boundaries/layering/grouping read at a glance? Is the data flow unidirectional with no noodles?
2. **Information accuracy**: cross-checked against `system-facts.md`/reference, are the services/dependencies/flows correct and not misleading?
3. **Visual hierarchy**: is the protagonist prominent? Is the secondary de-emphasized? Is the alignment/whitespace in place?
4. **Reuse and consistency**: is drawlib reused? Are the hand-drawn degree/font/palette consistent across the whole diagram?
5. **Restraint (anti-slop)**: palette <= 4 colors? No rainbow/noodles/decorative icons/fake data?

## Output format

- **Overall verdict** + score per dimension + a one-line rationale
- **Keep**: what is done well (specific)
- **Fix**: by severity, Critical (misleading/unreadable) / Important (messy hierarchy/misaligned) / Optimization (palette/hand-drawn degree)
- **Quick Wins**: the top 3 things fixable in 5 minutes

## Critical items (immediate fail)

- Architecture diagram contradicts the real structure (misleading decisions)
- Data flow direction is chaotic and the flow cannot be discerned
- The diagram is harder to understand than the system it is meant to explain
