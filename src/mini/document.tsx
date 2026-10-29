import { type Handle, type RemixNode, unsafeHTML } from "remix/component"
import { ImportMap, type ImportMapData } from "remix/component/server"
import { schemeBootScript } from "../design/css/index.ts"
import type { Theme } from "../design/index.ts"
import { type ComponentTokenName, documentRootId, ThemeStyle } from "../remix/index.ts"
import { miniTheme } from "./theme.ts"

/**
 * What `assetServer.getScriptEntry()` returns, declared structurally rather
 * than imported.
 *
 * `remix/assets` is a server module and this layer may not name it — even in a
 * type position, since `test/boundaries.test.ts` reads import specifiers and
 * not their erasure. Structural typing is what makes that cost nothing: a real
 * `ScriptEntry` satisfies this, and nothing about the document has to know the
 * asset server exists.
 */
export interface DocumentScript {
  /** The browser entry's public URL. */
  readonly href: string
  /** Emitted as `modulepreload` hints, ahead of the entry that needs them. */
  readonly preloads: readonly string[]
  /** What makes the entry's bare specifiers resolvable in the browser. */
  readonly importMap: ImportMapData
}

export interface DocumentProps {
  /** The page's own title. */
  title: string
  /**
   * Appended after the title with a middle dot — the site name, which is
   * otherwise re-implemented in every app that has more than one page.
   * Omitted renders the title alone.
   */
  site?: string | undefined
  /**
   * The browser entry, already resolved through the asset server, or `null` /
   * omitted for a page with no client JavaScript at all.
   *
   * The unenhanced render is a first-class mode here rather than something to
   * remember to check: every page this package builds is complete markup
   * before a script runs.
   */
  entry?: DocumentScript | null | undefined
  /**
   * The no-flash boot script. On by default, and worth turning off for exactly
   * one case: a page asserting that it carries no script element at all.
   *
   * It is not an enhancement — it restores a choice the user already made,
   * before the first paint — so a page that drops `entry` normally keeps it.
   */
  boot?: boolean | undefined
  /**
   * Rendered as `data-scheme` / `data-density` on the root element, so a
   * server-side choice — a query param, a session preference — applies with no
   * client JavaScript at all. Unset renders no attribute and leaves the scheme
   * to the media query.
   *
   * An attribute rendered here beats the remembered one: the boot script only
   * fills in an axis the document left blank. A blank axis is named in
   * `data-rmx-preserve-attrs` so a client-side navigation keeps the client's
   * value for it the same way.
   */
  scheme?: "light" | "dark" | undefined
  density?: "compact" | undefined
  /**
   * `reduce` renders `data-motion="reduce"`, zeroing every duration token as
   * the media query does for a visitor who asked the system. Server-owned like
   * the scheme, and unlike it never named in `data-rmx-preserve-attrs`: no
   * script sets it, and preserving a blank would keep a stale `reduce`.
   */
  motion?: "reduce" | undefined
  /** Defaults to `miniTheme`. An app extending it passes the extension here. */
  theme?: Theme<ComponentTokenName> | undefined
  /** `<html lang>`. Defaults to `en`. */
  lang?: string | undefined
  /**
   * Extra head content — a description, a favicon, an alternate stylesheet.
   * It renders after the three tags below and before the token sheet, which is
   * the only window where an app's own tag can neither push `<meta charset>`
   * out of the first 1024 bytes nor land after remix's component styles.
   */
  head?: RemixNode | undefined
  children?: RemixNode | undefined
}

/**
 * The document, with the four pieces of wiring in the one order that works.
 *
 * This is the fiddly part `mini` exists to carry, and each step below is a
 * failure that has already happened somewhere:
 *
 * 1. **`<meta charset>` first.** The HTML spec only honours it within the
 *    first 1024 bytes and the emitted token sheet is kilobytes long. A sheet
 *    ahead of it still decodes over HTTP, because the response carries a
 *    Content-Type — and breaks the moment the page is saved to disk, opened
 *    over `file://` or embedded as an iframe `srcdoc`.
 * 2. **The boot script before the token sheet.** It sets `data-scheme` /
 *    `data-density` on the root element, so the sheet's scheme selectors are
 *    evaluated once, against the final attributes. After the sheet, the first
 *    paint is the wrong scheme and the correction is a visible flash.
 * 3. **`ThemeStyle` before remix's own styles, but not first in head.** remix
 *    splices its component styles in immediately before `</head>`, so
 *    `@layer rmx-reset, base, rmx;` has to be evaluated ahead of them to
 *    register `base` at the front of the order. Arriving second, a layer
 *    statement cannot move a layer that already exists, and element defaults
 *    start beating components with no error at all.
 * 4. **The import map before the module script, and the preloads before
 *    both.** A module script that outruns its import map fails on a bare
 *    specifier; preloads after the script they preload are wasted bytes.
 *
 * `<html>` exists only on the server — an SPA has an `index.html` carrying the
 * same boot script — which is why this sits on its own subpath rather than in
 * the barrel. It is the one module here that reaches for `remix/component/server`,
 * and a browser bundle should not take that along with the theme.
 */
export function Document(handle: Handle<DocumentProps>) {
  return () => {
    const {
      title,
      site,
      entry = null,
      boot = true,
      scheme,
      density,
      motion,
      theme = miniTheme,
      lang = "en",
      head,
      children,
    } = handle.props

    // The axes this render left blank. Remix reconciles `<html>` on a
    // client-side navigation and would strip a toggled attribute the incoming
    // markup does not carry; naming them keeps the client's value, while an
    // axis rendered here is not named and so is overwritten.
    const blank = [
      scheme === undefined ? "data-scheme" : null,
      density === undefined ? "data-density" : null,
    ].filter((name) => name !== null)

    return (
      <html
        data-density={density}
        data-motion={motion}
        data-rmx-preserve-attrs={blank.length === 0 ? undefined : blank.join(" ")}
        data-scheme={scheme}
        id={documentRootId}
        lang={lang}
      >
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{site === undefined ? title : `${title} · ${site}`}</title>
          {head}
          {/* innerHTML rather than a text child, for ThemeStyle's reason: remix
              escapes &, < and > in element text, and a script arriving escaped
              is a syntax error rather than a visible fault. */}
          {boot ? <script innerHTML={unsafeHTML(schemeBootScript)} /> : null}
          <ThemeStyle theme={theme} />
          {entry === null ? null : (
            <>
              <ImportMap value={entry.importMap} />
              {entry.preloads.map((preload) => (
                <link rel="modulepreload" href={preload} key={preload} />
              ))}
              <script type="module" src={entry.href} />
            </>
          )}
        </head>
        <body>{children}</body>
      </html>
    )
  }
}
