---
title: The Field README says a search Field carries a default placeholder
---
Follow-up from the controller review of ui:48 (loop 01M6389J86R6C07DQ3RW0D09V4, land 500279c). That controller noted it as a minor gap and did not file it.

**Why.** ui:48 gives a search Field `placeholder=" "` by default (`src/remix/field/field.tsx:605`), so the clear button's `:placeholder-shown` dissolve has a state to key off. The JSDoc on `searchClear` explains this. The Field section of `src/remix/README.md` (around line 226, the `ui-field-clear-*` sentence) does not, so a caller who reads the README cannot tell why an empty search input reports `:placeholder-shown`, or that passing `placeholder` overrides the default.

**What to build.** Add one sentence to the Field section of `src/remix/README.md`: a search Field defaults `placeholder` to `" "` so the clear dissolve has a state to run between, and a caller's own placeholder replaces it.

**Done when.** The README states the default and why, and `bun run check` passes.
