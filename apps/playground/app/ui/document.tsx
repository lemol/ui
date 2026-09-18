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
   * to check. Task 19 turns this prop into a visible toggle; task 18 replaces
   * this document with `mini`'s.
   */
  entry: ScriptEntry | null
  children?: RemixNode | undefined
}

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    const { title, entry, children } = handle.props
    return (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title} · lemol ui</title>
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
