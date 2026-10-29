const ident = /^[A-Za-z_][A-Za-z0-9_-]*$/

// A bare CSS-wide or `view-transition-name` keyword: `none` would mean "no name".
const reserved = new Set([
  "none",
  "auto",
  "match-element",
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
])

function check(label: string, value: string) {
  if (value.includes("--") || !ident.test(value)) {
    throw new Error(
      `viewTransitionName: ${label} ${JSON.stringify(value)} must be a plain ident without "--"`,
    )
  }
}

/**
 * Mint a `view-transition-name`, the way `overlay()` mints a `commandfor` id:
 * verbatim or refused, never rewritten. Two elements sharing a name abort a
 * transition silently, and `--` is reserved as the join so a stem and a part
 * cannot be re-split into another pair's name. A bare reserved keyword is
 * refused too, since `none` would mean "no name" rather than a name.
 */
export function viewTransitionName(id: string, part?: string): string {
  check("id", id)

  const name = part === undefined ? id : (check("part", part), `${id}--${part}`)

  if (reserved.has(name)) {
    throw new Error(`viewTransitionName: ${JSON.stringify(name)} is a reserved keyword, not a name`)
  }

  return name
}
