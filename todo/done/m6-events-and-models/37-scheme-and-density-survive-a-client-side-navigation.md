---
title: Scheme and density survive a client-side navigation
tags: [bug]
group: M6 — Events and models
completed_at: 2026-10-28T08:16:52Z
outcome: completed
---
**Why.** [The events-and-models record](../../../docs/superpowers/specs/2026-10-24-ui-remix-events-and-models-design.md) §1. *Toggle theme* (or *Toggle density*) sets `data-scheme` / `data-density` on `<html>`; the next link click is intercepted by Remix's runtime, which reloads the top frame in the same document and reconciles `<html>` against server markup that carries neither attribute, so both are removed and the page falls back to the media query and the base density until a reload. Reproduced on 2026-10-24 with a Playwright probe over the playground harness: `dark` after the toggle, `null` after a link click in the same document, `dark` again with `data-rmx-preserve-attrs="data-scheme data-density"` on `<html>`. `test/browser/toggles.browser.test.ts` covers only a reload, which `bootScript` handles.

**What to build.**
- `src/mini/document.tsx`: `<html>` carries `data-rmx-preserve-attrs` naming the axes this render left blank — `data-scheme` when `scheme` is unset, `data-density` when `density` is unset, joined by a space; the attribute is omitted when both are set. This keeps `Document`'s documented rule (*an attribute rendered here beats the remembered one*) across navigations as well as reloads.
- `apps/playground/app/ui/switchers.tsx`: the scheme and density GET forms carry `data-rmx-document`. Switching back to *system* or *default* renders a blank axis, which would otherwise preserve the value the previous render set (the record's *known limit*).
- No client code. The list is read from the incoming HTML on every navigation.

**Tests first.**
- `src/mini/document.test.tsx`, one case per row of the record's table: neither axis set → `data-rmx-preserve-attrs="data-scheme data-density"`; `scheme="dark"` only → `"data-density"`; `density="compact"` only → `"data-scheme"`; both set → no attribute.
- `test/browser/toggles.browser.test.ts`:
  - toggle the scheme, follow a link, assert `data-scheme` is still `dark` **and** that the document did not reload (a `window` marker survives) — without the second assertion a document navigation would pass for the wrong reason;
  - the same for density;
  - a page rendered with `?scheme=dark`, then a link to a page with `?scheme=light`: the server's value wins;
  - the scheme switcher set to *system* after `?scheme=dark` leaves no `data-scheme`.
- Reversal: drop the attribute from `Document` and watch the first browser case fail.

**Docs.** `src/mini/README.md`, the boot-script paragraph (around line 91): one sentence on the preserved axes and why the switchers navigate the document. `docs/interactivity.md` cites this as its worked example in task 38.

**Done when.** A toggled scheme and density survive any number of client-side navigations, a server-chosen value still wins, and `bun run check` passes.

**Out of scope.** Persisting the choice server-side (a cookie or session). An app that renders its own document from saved settings is unaffected.

## Comments

### @nzila at 2026-10-28 08:16:52 +00:00

Done: do#2: addressed both review findings on top of df0f879 (now 1420b6d).

F1 fixed: apps/playground/app/router.test.tsx:51-55 comment rewritten — it now says all four switches carry data-rmx-document and why scheme/density do (switching back to system/default renders a blank axis, which a client navigation would preserve instead of clearing).

F2 fixed: apps/playground/README.md:57-61 paragraph rewritten to match switchers.tsx — every switch form carries data-rmx-document, with the same blank-axis reason.

F3 taken up (was optional): src/mini/document.tsx scheme/density doc comment now notes a blank axis is named in data-rmx-preserve-attrs so client-side navigation keeps the client's value. This corrects do#1's overstated claim in passing — the clause is there now.

Review-note accuracy: confirmed the R1 reversal count — server-wins passes without the attribute by design, so 2 fail, not 3. No code change needed.

Verified, each to completion and separately:
- bun test apps/playground/app/router.test.tsx src/mini/document.test.tsx: 50 pass, 0 fail
- bun test test/browser/toggles.browser.test.ts: 9 pass, 0 fail
- bunx oxlint: exit 0
- bunx tsc --noEmit: exit 0
No failures seen. Did not run bun run check or proof/run.ts (check stage owns them).

Review: approved (5/5)
Review of 4334efc...HEAD (7 files, commits df0f879 + 1420b6d). Approving: the code is right, the tests catch the bug, and both review#1 findings plus the optional note are fixed.

What to build:
1. Document names blank axes in data-rmx-preserve-attrs, omits when both set: done. src/mini/document.tsx:129-132 builds `blank` from `scheme === undefined` / `density === undefined`; :137 renders `data-rmx-preserve-attrs={blank.length === 0 ? undefined : blank.join(" ")}` (order scheme-then-density, space-joined, matching the record's table).
2. Scheme and density switcher forms carry data-rmx-document: done, apps/playground/app/ui/switchers.tsx:62 (scheme, with blank-axis comment :59-61) and :96 (density). All four switch forms now carry it (:62, :96, :124, :141); scripts/compat were already document loads.
3. No client code: done. Diff touches no runtime or browser entry (`git diff --stat` names only the 7 files above: document.tsx, document.test.tsx, switchers.tsx, router.test.tsx, toggles.browser.test.ts, two READMEs).

Docs: done. src/mini/README.md:96-100 adds the preserved-axes sentence and why the switchers navigate the document. `docs/interactivity.md` needs nothing here — the task assigns it to task 38 (todo/38:12 confirms "Task 37 is the worked example").

Comments: I read todo/m6-events-and-models/37-scheme-and-density-survive-a-client-side-navigation.md in full; it has no Comments section, and the brief carries no pre-start comments. That is 0 comments and no authors.

Tests and Done-when cases (each pinned):
- Document, neither set → `data-rmx-preserve-attrs="data-scheme data-density"`: src/mini/document.test.tsx "names both axes when neither is set" (:143). Fails if the tag lacks that exact literal (join order, separator, or omission all break it).
- scheme="dark" only → `"data-density"`: "names only density when the scheme is set" (:149). Fails on any extra/missing name.
- density="compact" only → `"data-scheme"`: "names only the scheme when density is set" (:155).
- Both set → no attribute: "omits the attribute when both are set" (:161 `not.toContain("data-rmx-preserve-attrs")`). Passes under the R1 reversal too (no attribute either way), so it pins omission, not presence — by design.
- Toggled scheme survives a link click + window marker proves no reload: test/browser/toggles.browser.test.ts "a toggled scheme survives a client-side navigation". Marker helpers at :75-77; assertions at :93-94 (`sameDocument true`, `data-scheme dark`).
- Same for density: "a toggled density survives a client-side navigation" (:107-108).
- Server value wins (`?scheme=dark` → link to `?scheme=light`): "a server-chosen scheme beats the one the previous page carried" (expects `light`).
- Switcher to System leaves no data-scheme: "switching the scheme back to system leaves no data-scheme" (expects null after `waitForURL("**scheme=system**")` + load).
- "Any number of navigations": pinned for one navigation only; accepted — the attribute is recomputed on every render, so each navigation repeats the same case.
- `bun run check`: discharged by check#2 (brief's check.command `bun run check`, commit 1420b6d == check.passed); never re-run by review per instructions.

Reversals (scratch worktree under the worktree, removed afterwards):
- R1, drop the preserve-attrs line from Document: browser suite 7 pass / 2 fail — exactly "a toggled scheme survives…" (Expected "dark", Received null at toggles.browser.test.ts:93) and "a toggled density survives…" (Expected "compact", Received null at :108). Server-wins passes without the attribute, as it should (no preserve list → server `light` always wins), confirming the corrected count of 2, not do#1's 3. Document suite 13 pass / 3 fail (the three presence cases; both-set omission passes trivially).
- R3, drop data-rmx-document from the scheme form: "switching the scheme back to system…" fails (Expected null, Received "dark" at :142). The blank-axis rationale for document navigation is load-bearing, not decorative.
- R2 (review#1, code unchanged since): unconditional `preserve-attrs="data-scheme data-density"` fails the three single/both-set Document cases plus server-wins — the server-wins test guards the rejected alternative.

Class check on the `=== undefined` predicate: the four (scheme, density) combinations are covered by the Document suite + R2. `scheme="light"` takes the identical `!== undefined` branch as `"dark"` so I did not run it separately; the router's `light` path is already pinned (router.test.tsx:238 `data-scheme="light"`). Unrecognised spellings (`sepia`, `roomy`) and the switchers' explicit defaults (`system`, `default`) map to undefined in `pageQuery` (apps/playground/app/actions/controller.tsx:41-42), pinned by the existing "ignores a scheme or density it does not recognise" and "explicit defaults as unset" tests. The `not.toContain("data-scheme")` → `"data-scheme="` edits are required because the preserve list holds the substring without `=`; they still catch a rendered `data-scheme="…"` while ignoring the list. "Verified against the existing tests" is not the claim — the R1/R2/R3 reversals above are.

Earlier findings: F1 (router.test.tsx:51-54 stale "only those two" comment) fixed — :51-56 now says all four switches leave the navigation to the browser with the blank-axis reason, matching the assertion at :66-71 (all four true). F2 (apps/playground/README.md:56-59 stale "re-render fine") fixed — :57-62 now matches switchers.tsx:62/:96 with the same reason. F3 (optional scheme doc comment) taken up — src/mini/document.tsx:60-62 notes the blank axis is named in data-rmx-preserve-attrs.

Stale-copy sweep: `rg -n "re-render fine|leave the navigation|only those two"` returns only the live fixed line router.test.tsx:53; flattened-whitespace greps for the removed phrases ("re-render fine", "only those two") return exit 1. The search is proven (it finds the live phrase it should). `rg -n "data-rmx-document"` hits: switchers.tsx:59/62/96/121/124/141 (all four forms + comments), router.test.tsx:63 (the assertion), spa/public/router.tsx:94/119 (unrelated SPA link), READMEs (matching prose), todo/37 + spec record (consistent). `rg -n "preserve-attrs"` hits: document.tsx:61/137, document.test.tsx:143/149/155/161, src/mini/README.md:97, the dated spec record (:27/:51/:57/:59/:75/:104) and todo/38 (:12/:18) — spec is dated history, todo/38 is live and consistent. No live contradiction remains.

Quantities re-derived from the diff, not the summary: 7 files, +152/-23 per `--stat`; preserve literal is one space-joined pair in scheme-then-density order (document.tsx:129-132 → test :143). No other count in the prose to re-derive.

Checks run: `bun test src/mini/document.test.tsx apps/playground/app/router.test.tsx` → 50 pass, 0 fail; `bun test test/browser/toggles.browser.test.ts` → 9 pass, 0 fail; `bunx oxlint` exit 0 with no output; `bunx tsc --noEmit` exit 0. Linter: 0 warnings, all none; base had 0 — from the check log output.log:9 "Found 0 warnings and 0 errors" (brief's check.command at 1420b6d) and the clean local runs. No increment to attribute.

No Brief Decision contradicted; no fixture encodes a wrong total (asserted literals match the task's table verbatim); no constraint left out (no client code, server-wins pinned, no cookie/session added — out of scope respected); no cost at scale (O(1) two-comparison string per render, no I/O, nothing to measure); no migration/backfill (N/A); no multi-read TOCTOU (props read once synchronously in one render); external side is remix's reconciler reading the incoming HTML's preserve list, exercised directly by the browser harness against the resolved remix (real navigations, `sameDocument` markers). Gate divergence (@lemol/proof, effect, remix resolved from the worktree's node_modules): noted; the preserve behaviour is exercised against that same tree, and check#2 passed there. Open question for the land, not a finding: re-run against the root's remix.

Proof: prove.result Skipped, no scenarios, `bun proof/run.ts`. No screenshots to judge fit. Justified: the diff adds attributes only (preserve list, document navigations) with no visible surface. A reviewer that cannot read images is not the issue — there are no images.

nzila commits: df0f879 implements the task; 1420b6d answers review#1 F1-F3. Both inside the task's rules; nothing outside the diff.

Implementer's gaps: do#2 left `bun run check` and proof to the stages — closed by check#2's pass at 1420b6d and prove.result Skipped/no-scenarios. I ran only the touched tests plus oxlint/tsc.


Citations that do not open (the verdict stands; a finding may still be right):
- `spa/public/router.tsx:94` path does not exist
Branch: nzila/01M60RT8NVP8M6G4GW4GJXTGZZ

nzila run 01M60RT8NVP8M6G4GW4GJXTGZZ
