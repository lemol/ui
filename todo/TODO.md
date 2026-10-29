# ui

- [ ] [45 - link-worktree's rerun test pins that it changes nothing](./45-link-worktree-s-rerun-test-pins-that-it-changes-nothing.md)
- [ ] 46 - A Field select shows its chosen value on one line with an ellipsis instead of wrapping out of its box
  #bug filed_by:01M63485MG12R9H42M7SB11W2H
  **Why.** In `src/remix/field/field.tsx`, the customizable select's `"& selectedcontent"` rule is `display: flex` with no `min-inline-size: 0`, `white-space: nowrap` or `text-overflow: ellipsis`. A long chosen option wraps to a second line and runs past the select's bottom border at desktop widths. At 390px the box grows taller and the value stays whole.

  **What to build.** Keep the chosen value inside the select box on one line, cut with an ellipsis, at every width. The open picker still lists each option in full. Give the full value as a title or an accessible name, so the cut text can still be read.

  **Tests first.** A browser test renders a Field select whose chosen option is longer than its box, at 1440px and 390px. It asserts the selectedcontent fits inside the select's border box and is one line high.

  **Done when.** No select value spills its box at either width, and the existing Field tests pass.

## M1 — Foundation and contract proof

## M2 — Catalogue

















## M3 — todo-md adoption

## M4 — Consumer app migration

## M5 — Motion system

- [ ] [44 - Build M5: the motion system](./m5-motion-system/44-build-m5-the-motion-system.md)

## M6 — Events and models

- [ ] [39 - Commands announce their outcome as typed events](./m6-events-and-models/39-commands-announce-their-outcome-as-typed-events.md)
