/** Where a remembered scheme choice lives. Exported so the switcher that writes it cannot drift. */
export const schemeStorageKey = "lemol-ui:scheme"

/** Where a remembered density choice lives. */
export const densityStorageKey = "lemol-ui:density"

const statements = [
  "var r=document.documentElement",
  `var s=localStorage.getItem("${schemeStorageKey}")`,
  `var d=localStorage.getItem("${densityStorageKey}")`,
  // Each axis is filled in only where the document left it blank. A server
  // that rendered data-scheme made a decision — a query param, a session
  // preference — and a remembered value overwriting it would make that
  // decision unreachable for anyone who has ever chosen a scheme here.
  // Nested ifs rather than `&&`, because this string has to survive being
  // rendered as a text child, and a renderer escapes the ampersand.
  'if(!r.hasAttribute("data-scheme"))if(s==="light"||s==="dark")r.setAttribute("data-scheme",s)',
  'if(!r.hasAttribute("data-density"))if(d==="compact")r.setAttribute("data-density","compact")',
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
 * An attribute the document already rendered is left alone: the server's
 * choice is the explicit one, and storage only fills in an axis it left blank.
 * The try/catch is because a private window that refuses localStorage must not
 * take the page down. A missing key and "comfortable" both mean set nothing:
 * the base theme is the default, so there is no third state to represent.
 *
 * It stamps no enhanced marker. That belongs to the package that knows what a
 * component is, and it concatenates this script rather than replacing it.
 */
export const schemeBootScript = `(function(){try{${statements.join(";")}}catch(e){}})()`
