/** Where a remembered scheme choice lives. Exported so the switcher that writes it cannot drift. */
export const schemeStorageKey = "lemol-ui:scheme"

/** Where a remembered density choice lives. */
export const densityStorageKey = "lemol-ui:density"

const statements = [
  "var r=document.documentElement",
  `var s=localStorage.getItem("${schemeStorageKey}")`,
  `var d=localStorage.getItem("${densityStorageKey}")`,
  'if(s==="light"||s==="dark")r.setAttribute("data-scheme",s)',
  'if(d==="compact")r.setAttribute("data-density","compact")',
]

/**
 * Restores the remembered scheme and density before the first paint.
 *
 * Inlined in the document — head on the server, index.html in SPA mode — ahead
 * of the stylesheet, so a remembered choice applies to the first paint instead
 * of flashing the default and reflowing.
 *
 * The values are allow-listed rather than written through, so a stale or
 * hand-edited storage entry cannot put arbitrary text into a root attribute.
 * The try/catch is because a private window that refuses localStorage must not
 * take the page down. A missing key and "comfortable" both mean set nothing:
 * the base theme is the default, so there is no third state to represent.
 *
 * It stamps no enhanced marker. That belongs to the package that knows what a
 * component is, and it concatenates this script rather than replacing it.
 */
export const schemeBootScript = `(function(){try{${statements.join(";")}}catch(e){}})()`
