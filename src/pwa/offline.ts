/** A scheme's four colours for the offline page: its ground, its text, its dim text and the button's edge. */
export interface OfflineColors {
  readonly ground: string
  readonly ink: string
  readonly dim: string
  readonly edge: string
}

export interface OfflinePageOptions {
  /** The document's title, as a tab or the app switcher shows it. */
  readonly title: string
  readonly heading: string
  /** One or two sentences saying what is out of reach and that the page comes back by itself. */
  readonly body: string
  /** The button that reloads the page. */
  readonly retry: string
  readonly dark: OfflineColors
  readonly light: OfflineColors
  /** The page's type: the app's own face, so the page reads as the app's. */
  readonly font?: string | undefined
}

/** Text as HTML text: the page is a string, built where nothing escapes for it. */
const text = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

const vars = (colors: OfflineColors): string =>
  `--ground:${colors.ground};--ink:${colors.ink};--dim:${colors.dim};--edge:${colors.edge}`

/**
 * The page a worker answers a navigation with when the network cannot be
 * reached: the app's face, a sentence, a way to try again, and a reload by
 * itself once the device is online. Everything inline, so nothing else has
 * to be cached for it to show; a phone's safe areas padded.
 */
export const offlinePage = (options: OfflinePageOptions): string => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${text(options.title)}</title>
<style>
:root{color-scheme:dark;${vars(options.dark)}}
@media (prefers-color-scheme: light){:root{color-scheme:light;${vars(options.light)}}}
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:grid;place-content:center;gap:1.55em;padding:max(2ch,env(safe-area-inset-top)) max(2ch,env(safe-area-inset-right)) max(2ch,env(safe-area-inset-bottom)) max(2ch,env(safe-area-inset-left));background:var(--ground);color:var(--ink);font:14px/1.55 ${options.font ?? "system-ui,sans-serif"}}
h1{margin:0;font-size:16px}
p{margin:0;max-width:44ch;color:var(--dim)}
a{justify-self:start;display:inline-flex;align-items:center;min-height:2.75rem;padding:0 1.5ch;border:thin solid var(--edge);border-radius:6px;color:var(--ink);text-decoration:none;font-weight:500}
</style></head>
<body><h1>${text(options.heading)}</h1>
<p>${text(options.body)}</p>
<a href="">${text(options.retry)}</a>
<script>addEventListener("online",function(){location.reload()})</script>
</body></html>`
