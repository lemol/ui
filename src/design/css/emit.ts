import type { Theme } from "../theme.ts"
import { primitiveNames } from "../tokens.ts"
import { layerStatement } from "./layers.ts"
import { reducedMotionCss, resetCss, unlayeredCss } from "./reset.ts"

export interface EmitOptions<C extends string = never> {
  /** Every component's token record, aggregated by the package that owns the components. */
  readonly componentTokens?: Readonly<Record<C, string>>
}

type Entries = readonly (readonly [string, string])[]

/**
 * Characters that cannot survive the trip.
 *
 * The sheet ships as the text of a style element, where the renderer escapes
 * &, < and >: a value carrying one arrives as &amp; and its declaration dies
 * with no error and no warning. A backtick terminates the template literal if
 * anyone inlines the sheet in source. Braces would break out of the block the
 * declaration sits in.
 *
 * A semicolon stays legal: data:image/svg+xml;base64 needs it, and what a
 * first-party theme puts in its own values is its business. A raw SVG data URL
 * carries < and is therefore rejected — base64-encode it or use a file.
 */
const unsafeCharacter = /[`<>&{}]/

const primitiveSet: ReadonlySet<string> = new Set<string>(primitiveNames)
const rankOf = new Map<string, number>(primitiveNames.map((name, index) => [name, index]))

/** A record's string-valued entries, in schema order, ui- keys last. */
function entriesOf(values: object): Entries {
  const entries = Object.entries(values).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  )

  const at = (name: string) => rankOf.get(name) ?? primitiveNames.length

  return entries.sort(([a], [b]) => at(a) - at(b))
}

function declarations(entries: Entries, indent: string): string {
  return entries.map(([name, value]) => `${indent}--${name}: ${value};`).join("\n")
}

function rule(selector: string, entries: Entries): string {
  return `${selector} {\n${declarations(entries, "  ")}\n}`
}

function mediaRule(query: string, selector: string, entries: Entries): string {
  return `@media ${query} {\n  ${selector} {\n${declarations(entries, "    ")}\n  }\n}`
}

/**
 * Component defaults first, theme values second, under one selector at one
 * specificity. Later wins, so a theme's override of a component token beats the
 * component's own default on source order — no cascade-layer subtlety for
 * custom properties, and no import-order trap.
 */
function rootRule(componentTokens: Entries, base: Entries): string {
  const body = [declarations(componentTokens, "  "), declarations(base, "  ")]
    .filter((text) => text !== "")
    .join("\n")

  return `:root {\n${body}\n}`
}

function problemsIn(where: string, entries: Entries): string[] {
  return entries.flatMap(([name, value]) => {
    const found: string[] = []

    if (!primitiveSet.has(name) && !name.startsWith("ui-")) {
      found.push(`${where}: ${name} is neither a primitive name nor a ui- prefixed component token`)
    }

    const unsafe = `${name}${value}`.match(unsafeCharacter)?.[0]

    if (unsafe !== undefined) {
      found.push(`${where}: ${name} contains ${unsafe}, which cannot ship inside a style element`)
    }

    return found
  })
}

/**
 * Everything that would otherwise fail silently, failing loudly instead.
 *
 * A var() on an undeclared property resolves to nothing, so a missing primitive
 * is the cheapest mistake to make and the hardest to see. An unprefixed key
 * catches both a misspelled primitive and a component token written with its
 * leading dashes.
 */
function validate(componentTokens: Entries, base: Entries, dark: Entries, compact: Entries): void {
  const declared = new Set(base.map(([name]) => name))
  const missing = primitiveNames.filter((name) => !declared.has(name))
  const problems = [
    ...(missing.length === 0
      ? []
      : [`theme.base is missing ${missing.length} primitives: ${missing.join(", ")}`]),
    ...problemsIn("componentTokens", componentTokens),
    ...problemsIn("theme.base", base),
    ...problemsIn("theme.dark", dark),
    ...problemsIn("theme.compact", compact),
  ]

  if (problems.length > 0) {
    throw new Error(`emitTokensCss cannot emit this theme:\n${problems.join("\n")}`)
  }
}

/**
 * The whole stylesheet as text: the layer statement, the token blocks for each
 * variant axis the theme has, the element defaults, the one unlayered rule, and
 * the reduced-motion reset.
 *
 * It returns a string and never a component, which is what keeps this package
 * shareable by a renderer that has no DOM. The component that puts the text in
 * a document lives in the package that has JSX.
 *
 * The layer statement must be evaluated before remix/component's own styles or the
 * layer order inverts; see layers.ts.
 */
export function emitTokensCss<C extends string = never>(
  theme: Theme<C>,
  options?: EmitOptions<C>,
): string {
  const componentTokens = entriesOf(options?.componentTokens ?? {})
  const base = entriesOf(theme.base)
  const dark = entriesOf(theme.dark ?? {})
  const compact = entriesOf(theme.compact ?? {})

  validate(componentTokens, base, dark, compact)

  const parts = [layerStatement, rootRule(componentTokens, base)]

  // The :not() guard is what lets a manual choice beat the media query; the
  // unguarded block is what lets a manual dark choice win on a light system.
  if (dark.length > 0) {
    parts.push(
      mediaRule("(prefers-color-scheme: dark)", ':root:not([data-scheme="light"])', dark),
      rule(':root[data-scheme="dark"]', dark),
    )
  }

  if (compact.length > 0) parts.push(rule(':root[data-density="compact"]', compact))

  parts.push(resetCss, unlayeredCss, reducedMotionCss)

  return `${parts.join("\n\n")}\n`
}
