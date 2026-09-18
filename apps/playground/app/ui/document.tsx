import { ThemeStyle } from "@lemol/ui-remix"
import { miniTheme } from "@lemol/ui-remix-mini"
import type { ScriptEntry } from "remix/assets"
import type { Handle, RemixNode } from "remix/ui"
import { ImportMap } from "remix/ui/server"

export interface DocumentProps {
  title: string
  /**
   * The browser entry, already resolved through the asset server, or `null` to
   * render the page with no client JavaScript at all.
   *
   * Every page here has to be complete markup before a script runs, so the
   * unenhanced render is a first-class mode rather than something to remember
   * to check. The no-JS/JS split is exercised through this prop rather than a
   * visible toggle yet, and this document stands in for `mini`'s own.
   */
  entry: ScriptEntry | null
  /**
   * Rendered as `data-scheme` / `data-density` on the root element, so
   * `?scheme=dark` beats the media query and `?density=compact` retunes every
   * control with no client JavaScript at all. Unset renders no attribute.
   */
  scheme?: "light" | "dark" | undefined
  density?: "compact" | undefined
  children?: RemixNode | undefined
}

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    const { title, entry, scheme, density, children } = handle.props
    return (
      <html data-density={density} data-scheme={scheme} lang="en">
        <head>
          {/* charset first, because the HTML spec only honours it within the
              first 1024 bytes and the emitted token sheet is kilobytes long.
              Putting ThemeStyle ahead of it pushed charset past 8KB, which
              worked only while the response carried a Content-Type; saved to
              disk, opened over file:// or dropped into an iframe srcdoc, the
              title's U+00B7 rendered as mojibake. */}
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title} · lemol ui</title>
          {/* Before remix's styles, not first in head. remix splices its own
              component styles in immediately before </head>, so `@layer base,
              rmx;` has to be evaluated before those to register `base` at the
              front — otherwise element defaults start beating components with
              no error. Anything remix does not splice, like the three tags
              above, may precede it freely. Asserted in router.test.tsx. */}
          <ThemeStyle theme={miniTheme} />
          {entry === null ? null : (
            <>
              {/* The import map has to precede the module script that relies on
                  it, and the preloads have to precede both to be worth having. */}
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
