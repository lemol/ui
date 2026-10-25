# Browser testing harness

Date: 2026-09-19
Status: researched, not decided

Six behaviours in this library need a real browser: the capture-phase `command`
listener, the Invoker Commands backfill, native `<dialog>` and `popover`
activation, and the `@starting-style` entry/exit transitions that ship with
every overlay. [interactivity.md](../../interactivity.md) says those are the
only things client JavaScript does; [architecture.md](../../architecture.md)
says they get "browser tests for the runtime behaviours only" and then does not
say with what. This is the research for that choice, and it is meant to travel:
whatever lands here is adopted by `todo-md`, `framework` and the other projects
built on this library.

## What the answer is being judged against

Five constraints come straight out of this repository's own documents, and
three of them eliminate candidates outright rather than scoring them.

`bun test` is the runner and `bun run check` is the single gate —
[package.json](../../../package.json) defines `check` as
`lint && typecheck && test`, and [remix.json](../../../apps/playground/remix.json)
records that even `remix test` was left out because "the suite runs under
`bun test`, per AGENTS.md". A harness with its own runner is not automatically
disqualified, but it has to end up inside that one command.

No bundler. [principles.md rule 7](../../principles.md) is unusually specific
about why: a second compiler would mean `remix.json` is no longer the single
source of asset config and `remix doctor` goes blind to half the build. This is
the constraint that decides several candidates on a rule rather than a
judgement.

No DOM shim. "A DOM shim would be testing the shim" — so happy-dom and jsdom
are out, which also removes every harness whose browser story is really a shim
story.

The browser baseline is Chrome 114+ / Safari 17+ / Firefox 125+, and
[interactivity.md](../../interactivity.md#browser-baseline) says apps built here
are shared with browsers we do not control, so "a dead click on an older engine
is a real failure".

And the agent axis, which is the reason this document exists at all: an agent
following written instructions has to be able to run the harness
non-interactively, read a machine-readable pass/fail, and read back enough of a
failure to fix it without a human looking at a screen.

There is a precedent for an expensive test living inside the gate.
[`test/git-consumer.test.ts`](../../../test/git-consumer.test.ts) clones the
repository, tags it, runs `bun install` and `bun run` in a scratch consumer via
`node:child_process`, and carries a 120-second timeout — all from inside a
`bun test` file. Anything proposed below can borrow that shape.

## Comparison

Costs first. "Bundler" and "second runner" are the two columns that decide
things.

| | Needs a bundler | Runs under Bun | Second runner | Real Safari 17 | Real Firefox | ARIA text dump | Auto-retry model | Machine-readable report | Licence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `playwright` library in `bun test` | no | claimed by Bun 1.4, open bugs | no | no (patched WebKit) | no (patched Firefox) | `page.ariaSnapshot()` | actionability + `locator.waitFor()` | `bun test --reporter=junit` | Apache-2.0 |
| `@playwright/test` runner | no | **no** — must spawn Node | yes | no | no | `toMatchAriaSnapshot()`, retrying | full retrying `expect` | `--reporter=json,junit,blob` | Apache-2.0 |
| `Bun.WebView` | no | first-party | no | WKWebView, not Safari | **no backend** | no | actionability, 30 s | `bun test --reporter=junit` | MIT |
| `puppeteer-core` + `@puppeteer/browsers` | no | undocumented, small surface | no | **no support at all** | yes, stock, headless | `page.accessibility.snapshot()` | Locator API | `bun test --reporter=junit` | Apache-2.0 |
| Raw CDP over `Bun.serve` + WebSocket | no | yes, zero deps | no | no | no | hand-rolled | hand-rolled | hand-rolled | n/a |
| Vitest browser mode | **yes, Vite** | package manager only | yes | no | no | no | `expect.element` retry | json, junit | MIT |
| WebdriverIO | browser-runner uses Vite | **undocumented** | yes | **yes**, but never headless | yes | no | auto-wait + `waitUntil` | json, junit (separate pkgs) | MIT |
| `@web/test-runner` | no (per-file esbuild transform) | **unverified** | yes, Mocha | via webdriver | via webdriver | no | Mocha, manual | via reporters | MIT |
| Cypress | **yes, webpack/Vite** | package manager only | yes | no (WebKit experimental) | yes | no | built-in retry | json, junit | MIT |
| `@playwright/mcp` | no | n/a | n/a | no | no | `browser_snapshot` | n/a — agent-in-the-loop | **none** | Apache-2.0 |
| `chrome-devtools-mcp` | no | n/a | n/a | no | no | yes | n/a — agent-in-the-loop | **none** | Apache-2.0 |
| `agent-browser` | no | n/a | n/a | iOS Simulator Safari | no | `snapshot -i`, `--json` | explicit `wait` | `--json` per command | Apache-2.0 |

## The question that outranks the table

We need to run both halves of the same page: the native Invoker Commands path,
and the path an engine without Invoker Commands takes through
`@lemol/ui/remix/compat`. On a current Chromium the second half never runs.
Force-installing the shim alongside native support double-fires. So the real
question is how you get an engine that genuinely lacks the feature — and the
answer turned out to be that you do not need one.

**The Blink flag is gone.** `HTMLCommandAttributes` was the only runtime flag
gating `command`/`commandfor`. It is present in
[M139's `runtime_enabled_features.json5`](https://chromium.googlesource.com/chromium/src/+/refs/tags/139.0.7258.66/third_party/blink/renderer/platform/runtime_enabled_features.json5)
with `status: "stable"` and a comment reading "This feature was shipped in M135
and can be removed in M137"; it is **absent from
[current `main`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/platform/runtime_enabled_features.json5)**,
which retains only `HTMLCommandActionsV2`, `HTMLCommandElementRemoval` and
`HTMLCommandForScrollCommands`. It was deleted by
[crrev.com/c/6687209](https://chromium-review.googlesource.com/c/chromium/src/+/6687209),
landed 2025-07-01, shipping in M140. Worse than "does not work":
`SetFeatureEnabledFromString` in
[`runtime_enabled_features.cc.tmpl`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/build/scripts/templates/runtime_enabled_features.cc.tmpl)
logs unknown names through `DLOG`, which is compiled out of release builds — so
`--disable-blink-features=HTMLCommandAttributes` on any Chrome 140+ produces no
error, no warning and no effect. It looks like it worked.

**Nothing else suppresses it from outside.** Deleting
`HTMLButtonElement.prototype.commandForElement` does not help: the activation
behaviour in
[`html_element.cc`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/html/html_element.cc)
calls the C++ `commandForElement()` and reads `FastGetAttribute(kCommandAttr)`
directly, never touching the V8 binding. Patching
`HTMLDialogElement.prototype.showModal` does not help either —
[`html_dialog_element.cc`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/html/html_dialog_element.cc)'s
`HandleCommandInternal` calls the C++ method. And there is no CDP setter: a
sweep of
[`browser_protocol.json`](https://github.com/ChromeDevTools/devtools-protocol/blob/master/json/browser_protocol.json)
turns up only `SystemInfo.getFeatureState`, which is read-only.

**The spec already solved it.** The
[WHATWG HTML activation behaviour for `button`](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element)
fires `command` "with its `cancelable` attribute initialized to true" and then
says "If *continue* is false, then return" before any of the default actions.
Chromium implements exactly that, and
[`command_event.cc`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/events/command_event.cc)
constructs the event `Cancelable::kYes`. So a capturing `document` listener that
cancels the *trusted* event neutralises the native path, by specification,
on every engine.

That is precisely what the reference polyfill does. The first statement of
`apply()` in
[`invokers-polyfill/invoker.js`](https://github.com/keithamus/invokers-polyfill/blob/main/invoker.js)
(v1.0.4, 2026-08-20, MIT) is:

```js
document.addEventListener("command", (e) => {
  if (e.type == "command" && e.isTrusted) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);
```

Its own event is built with `new CommandEvent(...)`, so `isTrusted === false`
and it passes through. The guard was added deliberately in a commit titled
["prevent double dispatch"](https://github.com/keithamus/invokers-polyfill/commit/e422e7714a3e3b53ac9fb0ad2d26d51736753c68).
Auto-application is a two-line
[`index.js`](https://github.com/keithamus/invokers-polyfill/blob/main/index.js)
— `if (!isSupported()) apply()` — with `isSupported()` testing
`"command" in HTMLButtonElement.prototype && "source" in CommandEvent.prototype`,
and an `invokers-polyfill/fn` subpath exporting `apply` raw so you can force it.

Two consequences for this repository. First, `@lemol/ui/remix/compat` should
grow the `isTrusted` suppressor and an unconditional `apply()` export, which
makes the polyfill path testable on the same modern Chromium as the native
path — inject with `page.addInitScript()` and assert `event.isTrusted` so a
regression in the suppressor is visible rather than silent. Second, the shim is
about fifteen lines because it has been leaving that suppressor out; adding it
is a correctness fix, not a test affordance.

The other route stays open and is cheap. Chrome for Testing still publishes
[134.0.6998.165](https://googlechromelabs.github.io/chrome-for-testing/known-good-versions.json)
— one milestone before Invoker Commands shipped — and the oldest build it
carries is 113.0.5672.0, which is *below* this library's Chrome 114 floor.
`npx @puppeteer/browsers install chrome@134.0.6998.165`
([docs](https://pptr.dev/browsers-api)) plus an `executablePath` gives a genuine
no-support engine on demand, in either Playwright or Puppeteer or
`Bun.WebView`'s chrome backend.

What does *not* work any more is the trick of running the polyfill test on
Playwright's Firefox or WebKit. Per
[MDN BCD](https://github.com/mdn/browser-compat-data), `command`/`commandfor`
and `CommandEvent` land in Chrome 135, Firefox 144 and Safari 26.2; Playwright
1.63's
[`browsers.json`](https://raw.githubusercontent.com/microsoft/playwright/v1.63.0/packages/playwright-core/browsers.json)
bundles Chromium 153.0.8010.12, Firefox 155.0 and WebKit 26.6. All three
support it.

And a correction to the premise that prompted this section: native Chromium
does not throw `InvalidStateError` on a redundant `show-modal`.
`HandleCommandInternal` guards with `if (isConnected() && !open)` and otherwise
logs "A command attempted to open an already open Dialog as a modal" as a
console warning. The `InvalidStateError` comes from the shim's own JS
`showModal()` call — `invokers-polyfill` guards that too, with
`!invokee.hasAttribute("open")`.

## Candidates

### Playwright, as a library, driven from `bun test`

`playwright` 1.63.0, published
[2026-09-04](https://registry.npmjs.org/playwright), Apache-2.0,
`engines.node >= 20`. The package's
[`index.d.ts`](https://raw.githubusercontent.com/microsoft/playwright/v1.63.0/packages/playwright/index.d.ts)
is a single `export * from 'playwright-core'` — no runner, no fixtures, no
`expect`.

This is the option that keeps every rule intact. There is no bundler, no second
runner, and no second assertion dialect: a `bun test` file launches a browser,
drives it, and asserts with `bun:test`'s `expect`. Browsers arrive through
`playwright install` into `~/Library/Caches/ms-playwright` (or
`PLAYWRIGHT_BROWSERS_PATH=0` for a hermetic `node_modules` install) and are
pinned by the Playwright version, with `executablePath` as the escape hatch for
an arbitrary build ([docs](https://playwright.dev/docs/browsers)).

The determinism story survives the loss of the runner mostly intact.
[Actionability](https://playwright.dev/docs/actionability) is a property of
locators, not the runner: `locator.click()` waits for visible, **stable**,
receives-events and enabled, where stable means "the same bounding box for at
least two consecutive animation frames" — which is exactly the check you want in
front of a `@starting-style` entry transition. `locator.waitFor()`,
`page.waitForFunction()`, `page.addInitScript()`, `context.tracing.start/stop`,
`page.clock` and `page.ariaSnapshot()` / `locator.ariaSnapshot()` /
`ariaSnapshotJSON()` are all in `playwright-core`'s
[`types.d.ts`](https://raw.githubusercontent.com/microsoft/playwright/v1.63.0/packages/playwright-core/types/types.d.ts).
So an agent gets an accessibility-tree text dump and can hold it as a golden
file through `bun test`'s own `toMatchSnapshot()` / `-u`.

What you give up is the retrying `expect` — `toBeVisible()`,
`toMatchAriaSnapshot()` and the other thirty
[auto-retrying assertions](https://playwright.dev/docs/test-assertions) live in
`@playwright/test`. You replace them with `await locator.waitFor(...)` followed
by a plain assertion, which is deterministic but more verbose, and you lose the
matcher's own error message. You also give up `webServer`
([docs](https://playwright.dev/docs/test-webserver)) — replaced by starting
`Bun.serve` in `beforeAll`, which this repository already does elsewhere — and
automatic trace-on-failure, which becomes a `try`/`finally` around
`tracing.stop({ path })`.

The risk is Bun compatibility, and it has moved a long way. The
[Bun 1.4 release post](https://bun.com/blog/bun-v1.4) (Bun 1.4.0, 2026-08-20)
claims outright that "Playwright now runs on Bun: drive a browser with
`connectOverCDP()`, run your suite with `playwright test` and a
`playwright.config.ts`, open `--ui`, and launch Chromium on Windows." The
long-running `chromium.launch()` hangs are closed —
[#27977](https://github.com/oven-sh/bun/issues/27977),
[#31105](https://github.com/oven-sh/bun/issues/31105),
[#34785](https://github.com/oven-sh/bun/issues/34785) and
[#38579](https://github.com/oven-sh/bun/issues/38579) (fixed on the 1.4 line),
as is [#31792](https://github.com/oven-sh/bun/issues/31792), the
`ws 'unexpected-response'` gap that had broken `connectOverCDP()` since 2024.
Two open ones matter: [#30652](https://github.com/oven-sh/bun/issues/30652),
where `recordHar` deadlocks the event loop — avoidable, do not use `recordHar` —
and [#21058](https://github.com/oven-sh/bun/issues/21058), "Bun test fails to
launch Puppeteer on macOS", open since 2025-07-15, which is the closest thing to
a direct counter-example and is about Puppeteer rather than Playwright.
Playwright itself does not test against Bun: maintainer `Skn0tt`, closing
[microsoft/playwright#38095](https://github.com/microsoft/playwright/issues/38095)
on 2025-11-05, wrote "Playwright does not test against Bun so we are not ready
to recommend it in our docs… using it will be at your risk."

### Playwright, as the `@playwright/test` runner

`@playwright/test` 1.63.0, same date and licence. This is the strongest
determinism and the strongest agent story in the survey, and it is the one
option that cannot run under Bun.

[oven-sh/bun#28609](https://github.com/oven-sh/bun/issues/28609), open since
2026-03-27 against Bun 1.3.11, is the blocker: the runner does a synthetic
`*.esm.preflight` import that relies on Node's ESM loader hooks, and under
`bun --bun` it fails with `Cannot find module '…/playwright.config.ts.esm.preflight'`.
The reporter's own workaround is "Run Playwright via real Node". Jarred Sumner's
[PR #28875](https://github.com/microsoft/playwright/pull/28875) to add a Bun
exports condition was closed unmerged on 2024-01-12, and Playwright maintainers
noted a deeper mismatch: the runner assumes it performs TS transpilation, which
Bun has already done.

So adopting the runner means spawning Node — which is exactly the
[`git-consumer.test.ts`](../../../test/git-consumer.test.ts) shape. One
`bun test` file `spawnSync`s
`node node_modules/@playwright/test/cli.js test --reporter=json`, asserts the
exit code, and prints the JSON on failure. `bun run check` stays the single
gate; the cost is a hard Node dependency in a Bun-only repository and a second
assertion dialect for anyone reading the browser tests.

What that buys, all of it agent-facing:

[Reporters](https://playwright.dev/docs/test-reporters) — `list`, `line`, `dot`,
`html`, `blob`, `json`, `junit`, `perfetto`, `github`, with `outputFile` or
`PLAYWRIGHT_JSON_OUTPUT_NAME` / `PLAYWRIGHT_JUNIT_OUTPUT_NAME`.

[Auto-retrying assertions](https://playwright.dev/docs/test-assertions) —
"Playwright will be re-testing the element… until the condition is met or until
the timeout is reached", default five seconds. Thirty-odd matchers including
`toBeVisible()`, `toHaveCSS()`, `toHaveRole()` and `toMatchAriaSnapshot()`.

[Aria snapshots](https://playwright.dev/docs/aria-snapshots) — a YAML dump of
the accessibility tree, stored inline or in `__snapshots__/*.aria.yml`, and
regenerated with `--update-snapshots`. This is the single most agent-legible
artifact in the whole survey: a diffable text tree, not a PNG, that an agent can
regenerate deterministically and a human can review in a diff.

[Traces](https://playwright.dev/docs/trace-viewer) — a zip containing full DOM
snapshots before/action/after, the action log, console, network, source and a
screencast filmstrip, recorded with `trace: 'on-first-retry'` or
`'retain-on-failure'`. Programmatically readable, and openable at
`trace.playwright.dev`.

Flakiness controls — `--retries`, `--repeat-each`, `--max-failures`,
`--fail-on-flaky-tests`, `--workers 1`
([CLI docs](https://playwright.dev/docs/test-cli)) — and
[`page.clock`](https://playwright.dev/docs/clock), which overrides `Date`,
`setTimeout`, `setInterval`, `requestAnimationFrame`, `requestIdleCallback`,
`performance` and `Event.timeStamp`. Note what clock does *not* fake: CSS
transitions and animations are driven by the compositor, not by
`requestAnimationFrame`, and the clock docs make no claim over them.

### Testing a CSS transition without a sleep

Worth stating separately, because it applies to every candidate and is the
reason this is not as hard as it looks. Do not time the animation. Read it.

`Element.getAnimations()` returns CSS transitions and CSS animations alongside
Web Animations API animations, has been
[Baseline since July 2020](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations),
and takes a `subtree` option. So the assertion "an entry transition exists" is
`page.evaluate(() => dialog.getAnimations().length)` immediately after the
dialog opens, and "the entry transition completed" is
`Promise.all(el.getAnimations().map(a => a.finished))` — a promise, not a
timeout. Combined with Playwright's *stable* actionability check, which already
waits two animation frames for a settled bounding box, there is no reason for a
sleep anywhere in this suite.

### Bun's own capabilities

Bun 1.4.2, released [2026-09-05](https://github.com/oven-sh/bun/releases), is
what is installed on this machine, and the surprise of this survey is that
**Bun now ships a headless browser**.

[`Bun.WebView`](https://bun.com/docs/runtime/webview) — "a headless browser
built into the runtime… without Puppeteer, Playwright, or a separate browser
download" — arrived in Bun 1.3.12 and was re-announced in
[Bun 1.4](https://bun.com/blog/bun-v1.4). It carries an explicit warning: "This
API is experimental and may change in future releases." Verified locally on Bun
1.4.2, the prototype is `navigate, evaluate, screenshot, cdp, click, type,
press, scroll, scrollTo, resize, goBack, goForward, reload, close, url, title,
loading, onNavigated, onNavigationFailed`.

Two backends: `"webkit"` (WKWebView, macOS only, zero dependencies) and
`"chrome"` (Blink over `--remote-debugging-pipe`, any platform with a Chrome
installed — and its auto-discovery includes `~/Library/Caches/ms-playwright`).
The selector overloads auto-wait for actionability with the same definition
Playwright uses — attached, non-zero box, visible, "unchanged bounding box for
two animation frames", topmost — at a 30-second default. The chrome backend
accepts `argv: string[]` for extra launch flags and `path` for an arbitrary
binary, so pinning Chrome 134 works here too, and `view.cdp(method, params)`
gives a raw CDP escape hatch (chrome backend only; WebKit throws
`ERR_METHOD_NOT_IMPLEMENTED`).

The costs are real and specific. Reading the local `bun-types` declarations, the
constructor takes only `width`, `height`, `headless`, `backend`, `url`,
`console` and `dataStore` — **no init script, no user-agent override, no
`prefers-color-scheme` emulation, no device scale factor, no network
interception**. For a design-token library with a dark theme and a density
switch, losing media emulation matters; it comes back via
`cdp("Emulation.setEmulatedMedia")` on the chrome backend and not at all on
WebKit. There is no locator object, no accessibility snapshot, no trace, and no
Firefox backend ([#29204](https://github.com/oven-sh/bun/issues/29204) is an
open feature request). And `cdp()` requires a prior `navigate()`, so an init
script has to be staged through an `about:blank` hop.

Everything else about `bun test` is stronger than expected, confirmed against
`bun test --help` on 1.4.2 and the
[reporters doc](https://bun.com/docs/test/reporters): `--reporter=junit` with
`--reporter-outfile`, `--retry=N`, `--rerun-each=N`, `--bail=N`, `--timeout`,
`-u`/`--update-snapshots`, `--shard=M/N`, `--randomize --seed`. **There is no
`--reporter=json`** — JUnit XML is the machine-readable format, and custom
reporters go through Bun's WebKit Inspector Protocol extensions, not CDP.
[Bun's own DOM page](https://bun.com/docs/test/dom) recommends happy-dom, which
this repository has already rejected. There is no browser test *mode* for
`bun test`; `Bun.WebView` is a library you call from one.

Raw CDP without any of this is possible — the protocol is
[fully documented](https://chromedevtools.github.io/devtools-protocol/), the
endpoint is `webSocketDebuggerUrl` from `/json/version`, Bun has a WHATWG
`WebSocket` and `Bun.spawn`, and the happy path is perhaps 200 lines. But
sessionId routing, message correlation, navigation-settled detection, an
auto-retry layer, exception unwrapping and zombie cleanup are the other 80%, and
they are precisely the flakiness surface a harness exists to absorb. Not worth
it when `Bun.WebView` now wraps the same protocol for free.

### Playwright's agent-facing tooling

Three distinct things, and they are for authoring and debugging, not for
gating.

[`@playwright/mcp`](https://github.com/microsoft/playwright-mcp) 0.0.82,
published [2026-09-18](https://registry.npmjs.org/@playwright/mcp),
Apache-2.0. An MCP server exposing 50+ tools built around `browser_snapshot`,
an accessibility snapshot the README calls "better than screenshot", plus an
opt-in `--caps=testing` set (`browser_verify_element_visible`,
`browser_verify_text_visible`, `browser_verify_value`,
`browser_verify_list_visible`). It produces no report and no exit code; the
determinism lives in the agent calling it.

[Playwright Agents](https://playwright.dev/docs/test-agents) — planner,
generator, healer — shipped in **1.56**, installed with
`npx playwright init-agents --loop=claude` (VS Code, Claude Code, Codex and
opencode are the supported loops). The planner explores an app and writes a
Markdown test plan; the generator turns that plan into Playwright test files,
verifying locators live; the healer runs the suite and repairs failures. All
three write or repair tests. None of them is the gate.

[`@playwright/cli`](https://github.com/microsoft/playwright-cli) — this is the
one that matters for the instruction layer. Apache-2.0, first published
2026-01-26, latest **0.1.21 on 2026-09-18**; the copy on this machine is 0.1.1
and stale. It provides the `playwright-cli` binary, and it ships
[its own skill](https://github.com/microsoft/playwright-cli/tree/main/skills/playwright-cli)
that `playwright-cli install --skills` drops into a project. Its README argues
the case against MCP for this use directly: "Modern **coding agents**
increasingly favor CLI–based workflows exposed as SKILLs over MCP because CLI
invocations are more token-efficient: they avoid loading large tool schemas and
verbose accessibility trees into the model context." The MCP README concedes the
same split, reserving MCP for "exploratory automation, self-healing tests, or
long-running autonomous workflows".

Its `references/playwright-tests.md` is the closest thing to first-party
guidance on agent-driven verification that exists: run with
`PLAYWRIGHT_HTML_OPEN=never npx playwright test`; to debug a failure, run
`--debug=cli` in the background, wait for the printed session name, attach with
`playwright-cli attach tw-abcdef`, and note that "every action you perform with
`playwright-cli` generates corresponding Playwright TypeScript code" you can
paste back into the test. That is a complete authoring-and-repair loop, written
by the vendor, and it is short.

### Chrome DevTools MCP

[`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp)
1.9.0, published [2026-09-08](https://registry.npmjs.org/chrome-devtools-mcp),
Apache-2.0, published by Google's ChromeDevTools org, driven by Puppeteer
underneath, no declared runtime dependencies.
[58 tools across 11 categories](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md).

Its
[design principles](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/design-principles.md)
say "Give agents composable tools (Click, Screenshot), not magic buttons". There
is no assertion API, no runner, no reporter, no exit code. It can run headless
and it detects `CI`, but runnable-in-CI is not the same as
deterministic-and-repeatable. Keep it for interactive performance and network
debugging; it is not the harness.

### agent-browser

The user's belief is correct: it is Vercel's. The npm package's repository field
is `git+https://github.com/vercel-labs/agent-browser.git` — **vercel-labs**,
Apache-2.0, 42.9k stars, repo created 2026-01-11. Current version **0.38.1,
published 2026-09-16**; Homebrew carries the same 0.38.1 as `stable` in
[homebrew-core](https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/a/agent-browser.rb).
The copy on this machine reports 0.22.3 from an nvm shim that shadows the
Homebrew binary.

The [local skill](file:///Users/leza.lutonda/.agents/skills/agent-browser/SKILL.md)
documents the shape: `open` → `snapshot -i` (accessibility tree with `@e1`-style
refs) → `click`/`fill` → re-snapshot, with `--json` on `snapshot` and `get`,
`find role button --name "Submit"` semantic locators, `wait --load networkidle`
/ `wait --fn`, `eval --stdin`, and — most relevant here — a `diff` family:
`diff snapshot` against the last snapshot or a saved baseline file, and
`diff screenshot --baseline before.png` producing a diff image plus a mismatch
percentage. It runs Playwright under the hood by default, with an experimental
native Rust CDP daemon behind `--native`, and an `-p ios` mode driving Mobile
Safari on an iOS Simulator via Appium — the only path in this survey to a real
Safari that is not a visible desktop window.

So it does emit artifacts a gate could assert on: `diff snapshot --baseline`
exits on a text diff of the accessibility tree. But there is no test file, no
reporter, no aggregate pass/fail, and the baseline files are managed by hand.
It is an excellent exploratory and screenshot tool — which is exactly what the
`bridgit:web-verify` skill uses it for — and a poor regression gate.

### Vitest browser mode

Out on a rule. `vitest` 5.0.1, published
[2026-09-15](https://registry.npmjs.org/vitest), MIT, and browser mode is **no
longer experimental** — the [Vitest 4 post](https://vitest.dev/blog/vitest-4)
states "we are removing the `experimental` tag from Browser Mode", though Trace
View is still marked "Experimental 5.0.0+".

But [Getting Started](https://vitest.dev/guide/) says "Vitest requires Vite
>=v6.4.0 and Node >=v22.12.0", and `vitest@5.0.1` declares
`"vite": "^6.4.0 || ^7.0.0 || ^8.0.0"` as a non-optional peer dependency. The
browser guide adds "Vitest uses Vite dev server to run your tests". That is a
second compiler in the repository, which [rule 7](../../principles.md) forbids
for reasons that have nothing to do with testing — `remix.json` stops being the
single source of asset config and `remix doctor` goes blind.

Worth recording what is being given up, because it is not nothing:
`expect.element` with built-in retry, json and junit reporters,
`browser.screenshotFailures` on by default outside the UI, Playwright traces via
`browser.trace`, and providers for
[playwright / webdriverio / preview](https://vitest.dev/config/browser/provider)
(now separate packages; `preview` is the default, cannot run headless, and
simulates events rather than using CDP — so CI means playwright or webdriverio
anyway). And Bun is supported only as a package manager: the docs' sole mention
is "make sure to use `bun run test` … otherwise Bun will run its own test
runner", with V8 coverage and the loader-based `vi.mock` hoisting both
documented as not working on Bun.

### WebdriverIO

`webdriverio` 9.31.9, released
[2026-09-13](https://github.com/webdriverio/webdriverio/releases), MIT. Bun
appears in its docs only as a package-manager tab (`bun create wdio@latest .`);
[Getting Started](https://webdriver.io/docs/gettingstarted) says "You'll need
Node.js installed… Only releases that are or will become an LTS release are
officially supported", and there is no Bun tracking issue in either direction.
`@wdio/browser-runner` compiles test code with Vite, so the component-testing
path fails rule 7 as well.

It earns its place for one reason: it is the only candidate that can drive
**real Safari**. [DriverBinaries](https://webdriver.io/docs/driverbinaries)
documents `browserName: 'safari'` against the pre-installed
`/usr/bin/safaridriver`, and auto-downloads Chrome, Chromium and Firefox via
`@puppeteer/browsers` with `browserVersion: 'stable_151.0.1'`-style pinning. Its
[auto-waiting](https://webdriver.io/docs/autowait) is real — "WebdriverIO will
automatically wait for the element to be visible and interactable" — with
`waitforTimeout` 5000 / `waitforInterval` 100 and `browser.waitUntil`. JSON and
JUnit reporters exist as separate `@wdio/*` packages.

The catch is decisive: **safaridriver has no headless mode**. Apple confines
automation to visible "automation windows" requiring a live GUI session
([Testing with WebDriver in Safari](https://developer.apple.com/documentation/webkit/testing-with-webdriver-in-safari)),
it needs a one-time `safaridriver --enable` with admin rights, and it drives
only whatever Safari that machine happens to have — so no Safari 17 pinning
either. Real-Safari coverage is a manual, occasional, human-present activity in
every design. It cannot be part of `bun run check`.

### puppeteer-core and raw CDP

`puppeteer-core` 25.11.0, published
[2026-09-14](https://registry.npmjs.org/puppeteer-core), Apache-2.0,
`engines.node >= 22.12.0`. Unlike `puppeteer` it downloads nothing and ignores
configuration files; you point `executablePath` at a binary
([docs](https://pptr.dev/)). It has had a real auto-waiting
[Locator API](https://pptr.dev/guides/page-interactions) since well before this
version — "locators… allow Puppeteer to automatically wait for the element to be
present in the DOM and to be in the right state", including "a stable bounding
box over two consecutive animation frames" — and
[`page.accessibility.snapshot()`](https://pptr.dev/api/puppeteer.accessibility)
is present and not deprecated.

Its distinctive strength is Firefox: Puppeteer drives **stock, unpatched Firefox
stable** headlessly over WebDriver BiDi, pinned at 155.0.1 for this release
([supported browsers](https://pptr.dev/supported-browsers)). Playwright's
Firefox is a patched build. The cost is that
[over BiDi](https://pptr.dev/webdriver-bidi), emulation, **accessibility**,
coverage, tracing and drag-and-drop all throw `UnsupportedOperation` — so the
ARIA snapshot is Chrome-only. There is no Safari or WebKit support of any kind.
Bun support is undocumented, and
[oven-sh/bun#21058](https://github.com/oven-sh/bun/issues/21058), "Bun test
fails to launch Puppeteer on macOS", is still open.

### Briefly dismissed

`@web/test-runner` reached
[1.0.0 on 2026-07-07](https://registry.npmjs.org/@web/test-runner), MIT, and is
the only candidate that is buildless *by design*: a dev server that serves
native ESM, with `@web/dev-server-esbuild` doing a per-file TS transform —
"we don't use esbuild's bundling API"
([docs](https://modern-web.dev/docs/dev-server/plugins/esbuild/)) — and
`chromeLauncher` using your globally installed Chrome. It loses on two counts:
the test framework is Mocha, a second assertion dialect alongside `bun:test`,
and its Bun compatibility is unverified in either direction.

Cypress 16.1.0, MIT, recognises Bun as a package manager only (added in 15.17.0
via [PR #32580](https://github.com/cypress-io/cypress/pull/32580)), ships the
webpack preprocessor by default and requires Vite or webpack for component
testing, and treats WebKit as
[experimental](https://docs.cypress.io/app/references/launching-browsers) with
no Safari at all. Mandatory bundler plus no Safari: dismissed.

WPT's `testharness.js` is genuinely adoptable standalone — a page needs only
`testharness.js` + `testharnessreport.js`, and `./wpt serve --inject-script=`
even exists
[for testing polyfills](https://github.com/web-platform-tests/wpt/blob/master/docs/running-tests/testing-polyfills.md).
WPT's own Invoker Commands tests live in
[`html/semantics/the-button-element/command-and-commandfor/`](https://github.com/web-platform-tests/wpt/tree/master/html/semantics/the-button-element/command-and-commandfor)
and are worth reading for coverage ideas. But there is no off-the-shelf runner:
`wpt-runner` uses jsdom, which is the shim this repository rejected. Realistic
shape is testharness pages plus your own driver — all the cost of the raw-CDP
option with a different assertion library.

## The instruction layer

Three local skills were read on disk rather than guessed at.

`agent-browser` (`~/.agents/skills/agent-browser/SKILL.md`, plus seven
references and three shell templates) is a full CLI manual: navigate, snapshot,
interact, re-snapshot, with sections on auth vaults, parallel sessions, ref
lifecycle and `diff`. It is long because the CLI is large, and it is
instructional rather than prescriptive — it teaches the tool, it does not encode
a repository's verification procedure.

`playwright-cli` (`~/.agents/skills/playwright-cli/SKILL.md`) is Microsoft's own
skill for `@playwright/cli`, shipped in
[the repo](https://github.com/microsoft/playwright-cli/tree/main/skills/playwright-cli)
and installable with `playwright-cli install --skills`. The local copy is
older than upstream and is missing `references/playwright-tests.md`,
`element-attributes.md` and `pr-attachments.md`.

`bridgit:web-verify`
(`~/.claude/plugins/cache/bridgit-toolkit/bridgit/0.5.0/providers/anthropic/claude/skills/web-verify/SKILL.md`)
is the most instructive of the three, because it is a *repository's* skill
rather than a tool's. Its shape is worth copying wholesale: a mandatory
preflight script returning machine-readable `key=value` lines on stdout and
numbered exit codes (`10` agent-browser missing, `11` dev server unreachable,
`12` auth setup failed, `13` checkout path unconfigured), each carrying its own
remediation command, with the instruction "surface the stderr message verbatim
to the user and stop… Do not improvise." It hard-codes "Always headless",
"localhost only", and "never write runtime artifacts into the skill's repo".
That is what codifying verification looks like: not a tool tutorial, but a
preflight, a fixed entry point, an artifact convention and an explicit refusal
to guess.

A `browser-verify` skill for this repository would be short, and would be
shortest under the Playwright runner because the runner supplies the reporter,
the artifact and the regeneration command instead of the skill having to
describe them:

- **Preflight.** `playwright install chromium` if `~/Library/Caches/ms-playwright`
  is empty; fail with the exact install command otherwise. No improvising.
- **One command.** `bun run check` is the gate; `bun test test/browser/` is the
  narrow loop. Nothing else.
- **One artifact convention.** Aria snapshots in
  `test/browser/__snapshots__/*.aria.yml` are the assertion of record; traces
  land in `test-results/` on failure and are read with
  `npx playwright show-trace`. Never assert on a PNG.
- **One regeneration command,** with the rule that regenerating is a reviewable
  diff and not a fix: `bun test -u` (library path) or
  `npx playwright test -u` (runner path).
- **The dual-path rule.** Every overlay test runs twice — native, and with
  `compat`'s `apply()` forced through `addInitScript` — and asserts
  `event.isTrusted` to prove which path executed.
- **The no-sleep rule.** Assert a transition with `getAnimations()` and
  `animation.finished`. A `waitForTimeout` in a browser test is a review
  failure.
- **Debugging.** `--debug=cli` plus `playwright-cli attach <session>`, straight
  out of Microsoft's own
  [`references/playwright-tests.md`](https://github.com/microsoft/playwright-cli/blob/main/skills/playwright-cli/references/playwright-tests.md).

## What could not be verified

No candidate was installed and nothing was run against a browser; the whole
survey is documentation, package metadata, source and issue trackers, plus two
things checked on this machine (`bun --version` → 1.4.2 with `Bun.WebView`
present on the prototype, and `bun test --help`'s flag list).

Playwright-as-a-library specifically inside a `bun test` file is the load-bearing
unverified claim. Bun's blog claims the runtime and the `playwright test`
runner; nothing first-party addresses `import { chromium } from "playwright"`
inside `bun:test`, and the one open issue closest to it
([#21058](https://github.com/oven-sh/bun/issues/21058)) is about Puppeteer.
**Spike this before committing.**

Whether Bun's `TestReporter` inspector-protocol domain actually fires events was
not confirmed;
[#25972](https://github.com/oven-sh/bun/issues/25972) reported it silent and is
closed. Irrelevant unless a custom reporter is wanted — `--reporter=junit` is
the safe path.

WebdriverIO's `safaridriver --enable` requirement and the absence of a headless
Safari mode are negative evidence — absence from every Apple WebDriver page —
not a quotable denial, and the Apple documentation pages would not render for
direct fetch.

Whether `Bun.WebView`'s WebKit backend tracks the system Safari's feature set
closely enough to be a meaningful Safari proxy was not established. WKWebView is
Safari's engine, but it is not Safari, and the backend exposes no user-agent
override and no HTTP response
([#43414](https://github.com/oven-sh/bun/issues/43414), open).

Playwright's bundled WebKit 26.6 and Firefox 155.0 are above the versions in
which `command`/`commandfor` shipped per MDN BCD, so the "run the polyfill on a
non-supporting Playwright engine" route is closed — but pinning an old
Playwright to reopen it was not tested, and Playwright's WebKit version labels
do not map cleanly onto Safari releases, so feature-detect rather than trusting
the label.

## Three combinations

**Playwright library + `bun test` + a repo skill.** Zero new runners, zero new
dialects, no Node dependency, and every repository rule stays intact. You get
locators with actionability, `addInitScript`, `page.clock`, `tracing`,
`page.ariaSnapshot()` held as a golden file through `bun test -u`, and Bun's own
`--retry` / `--rerun-each` / `--bail` / `--reporter=junit`. Costs: no retrying
`expect` matchers, so every assertion is `await locator.waitFor(...)` then a
plain check; `webServer` and trace-on-failure are hand-rolled (fifteen lines
each); Playwright does not test against Bun and will not support you; and
~350 MB of browsers in CI cache.

**`@playwright/test` spawned from a `bun test` wrapper + `@playwright/cli`
skill.** The `git-consumer.test.ts` pattern: one test file `spawnSync`s
`node node_modules/@playwright/test/cli.js test --reporter=json`, asserts the
exit code, prints the JSON on failure. `bun run check` stays the gate. You get
the full retrying `expect`, `toMatchAriaSnapshot`, trace-on-first-retry,
`--repeat-each`, `webServer`, and Microsoft's own skill and debug loop nearly
for free. Costs: a hard Node requirement in a Bun-only repository, propagated to
five sibling repos; a second assertion dialect; a `playwright.config.ts` next to
`bunfig`; and the fact that the runner is known-broken under `bun --bun`, so the
Node hop is permanent rather than a workaround you can retire.

**`Bun.WebView` + `bun test` + a repo skill.** The smallest possible answer: no
devDependency, no download on macOS, no bundler, no second anything, and an
actionability model that already matches Playwright's. Costs: experimental and
explicitly unstable; no init script, no media emulation, no locators, no ARIA
snapshot, no trace, no Firefox; a documented bug list that is still growing; and
the dark-theme and density tokens become untestable on the WebKit backend
because there is no `prefers-color-scheme` emulation.

## Recommendation

Take the first: **Playwright as a library, driven from `bun test`** — with the
`@playwright/test` runner held as a named escape hatch if a Bun incompatibility
turns up that cannot be worked around.

The reasoning is that the constraints are unusually decisive here and only two
options survive them cleanly. Vitest and Cypress fail rule 7 outright. A DOM
shim is already rejected. WebdriverIO cannot run Safari headlessly, which is the
only thing it would have been chosen for. `Bun.WebView` is the right long-term
answer and the wrong one today: an experimental API with no init script is an
awkward fit for a suite whose central test is "inject the polyfill before page
scripts run". That leaves Playwright, and between its two faces the library wins
on the constraint the repository states most plainly — `bun test` is the runner —
while giving up less than expected, because `page.ariaSnapshot()`,
`addInitScript`, `tracing`, `page.clock` and actionability are all in
`playwright-core`, and Bun's own `bun test` supplies the retries, reruns,
snapshots and JUnit output the Playwright runner would otherwise have provided.

The thing that most changes this recommendation is not in the table. Because
`CommandEvent` is cancellable by specification and the trusted event can be
suppressed from a capturing `document` listener, both halves of the Invoker
Commands story run on **one** pinned modern Chromium, in one process, with no
second browser and no engine pinning. That collapses what looked like the
hardest requirement into a three-line addition to
`@lemol/ui/remix/compat` — which that file needs anyway, since without it the
shim double-fires on any engine that later gains native support. Add it,
force-apply it under `addInitScript`, and assert `event.isTrusted` so the
suppressor cannot regress silently. Keep the
`@puppeteer/browsers install chrome@134.0.6998.165` route documented as an
occasional confidence check rather than part of the gate.

Two smaller reasons point the same way. The Playwright runner's aria snapshot is
the best agent-facing artifact in this survey, and the library reaches 90% of it
through `page.ariaSnapshot()` plus `bun test`'s `toMatchSnapshot()` — a
regenerable, diffable, reviewable text tree rather than a PNG. And the honest
version of Safari coverage is that no harness here can gate on Safari 17:
Playwright's WebKit is a trunk build that is explicitly not Safari, safaridriver
has no headless mode, and `Bun.WebView`'s WKWebView is the engine without the
browser. That should be written into the skill as a stated limit — occasional
manual verification through `agent-browser -p ios` or a real device — rather
than left as an implied promise the suite does not keep.

Before committing: spike `import { chromium } from "playwright"` inside a
`bun test` file on Bun 1.4.2, launch Chromium, open the playground, click a
dialog trigger and read back an aria snapshot. If that runs clean twenty times
under `--rerun-each=20`, take the library. If it does not, take the wrapper and
pay the Node dependency.
