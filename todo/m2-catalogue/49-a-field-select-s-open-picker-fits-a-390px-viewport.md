---
title: A Field select's open picker fits a 390px viewport
---
Follow-up from the ui:46 review (loop 01M6389J86R6C07DQ3RW0D09V4, run 01M638ARB3YVE5JY1JSK69JVGP). The reviewer and the implementer both noted it as out of scope, and the controller did not file it.

**Why.** At 390px the open picker of a Field select (`appearance: base-select`) is about 730px wide and runs past the viewport. This was already true before ui:46. The closed value now fits on one line, but the list it opens does not.

**What to build.** Cap the picker's inline size at the viewport (or at the anchor's available space), and let long options wrap or truncate inside it. Keep the existing `--ui-field-picker-*` tokens: no literal widths, and declare a token if a new value needs one.

**Tests first.** Extend the Field select browser test at 390px: open the picker and assert its bounding box sits inside the viewport.

**Done when.** At 390px and 1440px the open picker stays inside the viewport, the closed state is unchanged, and `bun run check` passes.
