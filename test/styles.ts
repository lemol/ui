/**
 * Assertions about the CSS a component's `css()` calls emit, shared across
 * every component test that cares which cascade sub-layer a declaration
 * landed in.
 *
 * `remix/ui` gives every distinct `css({...})` style object its own cascade
 * sub-layer, and within layers, layer order beats specificity — see "Cascade
 * layers" in docs/design-system.md. That is what makes *which block* a
 * declaration sits in a correctness question, not a formatting one, and why
 * these helpers keep blocks apart instead of collapsing them into one string.
 */

/** The css remix collected during the render, with the markup dropped. */
export const stylesOf = (html: string): string =>
  [...html.matchAll(/<style data-rmx-style="[^"]*">([\s\S]*?)<\/style>/g)]
    .map((match) => match[1] ?? "")
    .join("\n")

/**
 * Each `<style data-rmx-style="…">` block kept separate, one per css() call.
 * Joining them, as stylesOf does, is fine for "does this text appear
 * anywhere" but hides *which* sub-layer a declaration landed in — and layer
 * order, not specificity, decides which of two conflicting declarations wins.
 * Tests that care which block a declaration is in must look at the blocks
 * separately, not at the joined string.
 */
export const styleBlocksOf = (html: string): string[] =>
  [...html.matchAll(/<style data-rmx-style="[^"]*">([\s\S]*?)<\/style>/g)].map(
    (match) => match[1] ?? "",
  )

/** Every declaration value in a block of css. */
export const valuesOf = (styles: string): string[] =>
  [...styles.matchAll(/[\w-]+\s*:\s*([^;{}]+)[;}]/g)].map((match) => (match[1] ?? "").trim())

/**
 * The property names declared at the top level of a css() block — the level
 * that actually contends for a cascade slot with another block's top-level
 * declarations. A nested rule such as `&:disabled` is deliberately excluded:
 * restating a property there that the block already sets at top level is the
 * co-location pattern the cascade-layers rule requires (see
 * "wins the disabled cascade from within the tone's own sub-layer" in
 * button.test.tsx), not a second declaration of the same property.
 *
 * This is a flat scan, not a parser: it strips nested `{ ... }` groups before
 * matching, so it does not need to understand selectors, only depth. `block`
 * is the raw `<style>` text — `@layer rmx.<hash> { .<hash> { … } }` — so the
 * declarations of interest sit two braces deep, not zero: depth 1 is the
 * `@layer` body (the class selector), depth 2 is the selector's own body, and
 * anything deeper is a nested rule like `&:disabled`.
 */
const topLevelPropertiesOf = (block: string): string[] => {
  let depth = 0
  let flat = ""
  for (const char of block) {
    if (char === "{") {
      depth += 1
      continue
    }
    if (char === "}") {
      depth = Math.max(0, depth - 1)
      continue
    }
    flat += depth === 2 ? char : ""
  }
  return [...flat.matchAll(/(?:^|;)\s*([\w-]+)\s*:/g)].map((match) => match[1] ?? "")
}

/**
 * The properties declared by more than one of a component's own css() blocks.
 * `buttonBase`, `sizeStyles` and `toneStyles` must be property-disjoint: if
 * two blocks can both set the same property, sub-layer order — not either
 * block's author — decides which one paints, and that order is neither
 * fixed by source (registration follows render order) nor stable across a
 * client session (see "Client-side, the order is not even stable within one
 * session" in docs/design-system.md). Property-disjointness is what makes a
 * component correct under any order instead of correct under the order
 * observed today.
 *
 * `blocks` is deduplicated by exact text before comparing, because remix/ui
 * caches a `css()` block by content and reuses one sub-layer across every
 * element that renders it: the same `buttonBase` block appearing once per
 * button in a multi-render test is one block, not evidence that "display"
 * is declared twice.
 *
 * Returns the offending property names, empty when the blocks are disjoint,
 * so a test can assert `expect(sharedProperties(blocks)).toEqual([])` and
 * name the property when it fails.
 */
export const sharedProperties = (blocks: string[]): string[] => {
  const seenIn = new Map<string, number>()
  const shared = new Set<string>()
  for (const block of new Set(blocks)) {
    for (const property of new Set(topLevelPropertiesOf(block))) {
      const count = (seenIn.get(property) ?? 0) + 1
      seenIn.set(property, count)
      if (count > 1) shared.add(property)
    }
  }
  return [...shared].sort()
}

/**
 * The declaration values a component emits that are neither a structural
 * keyword it named nor a primitive the schema holds.
 *
 * This is the contract check for a component with no token tier of its own.
 * Button's test asserts the inverse — every value *is* a `var(--ui-btn-*)` —
 * because Button owns a tier. A layout component reads primitives directly,
 * so what has to be checked is that it reads nothing else: an unvetted
 * literal, a primitive the schema dropped, or a `--ui-*` borrowed from some
 * other component's contract. The last is the failure these components exist
 * to make visible, and it is the one that would otherwise look correct.
 *
 * `keywords` is the component's own structural vocabulary — `flex`, `column`,
 * `auto`. Each component states its own, because a keyword allowed everywhere
 * is a keyword nobody argued for.
 *
 * `primitives` is passed in rather than imported. The harness sits outside
 * `src/`, so reaching the schema would mean a relative path into the design
 * layer — and a generic CSS-assertion harness has no business knowing a token
 * schema exists either way.
 *
 * Returns the offending values, empty when the component is clean.
 */
export const nonPrimitiveValues = (
  styles: string,
  keywords: Set<string>,
  primitives: Set<string>,
): string[] =>
  valuesOf(styles).filter((value) => {
    if (keywords.has(value)) return false
    const referenced = /^var\(--([\w-]+)\)$/.exec(value)?.[1]
    return referenced === undefined || !primitives.has(referenced)
  })

/** Each style block with the hash `remix/ui` keyed it by. */
const hashedBlocksOf = (html: string): { hash: string; block: string }[] =>
  [...html.matchAll(/<style data-rmx-style="([^"]*)">([\s\S]*?)<\/style>/g)].map((match) => ({
    hash: match[1] ?? "",
    block: match[2] ?? "",
  }))

/**
 * The style blocks that landed on one element, found through the class
 * `remix/ui` wrote on it.
 *
 * `sharedProperties` over every block in a document is the right question for
 * a component that styles one element, and the wrong one for a component that
 * styles several: two blocks on two different elements never contend for a
 * cascade slot, so a property both declare is not a collision. Field's label
 * and its control both declare `color`, legitimately.
 *
 * `tag` matches a whole tag name, not a prefix — Field renders both a `<p>`
 * and a `<path>`, and attributing one's blocks to the other would make a
 * disjointness assertion meaningless. `occurrence` picks which element with
 * that tag to read, 0-indexed and defaulting to the first — Field's select
 * branch renders two `<div>`s, the wrapper and the frame, and without this a
 * test can only ever reach the wrapper's blocks.
 *
 * Returns an empty list for a tag that is absent, carries no class, or whose
 * occurrence index is out of range. A test asserting disjointness should
 * check the list is non-empty first: an empty list satisfies
 * `sharedProperties(blocks)).toEqual([])` without proving anything.
 */
export const blocksOn = (html: string, tag: string, occurrence = 0): string[] => {
  const openings = [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))]
  const opening = openings[occurrence]?.[0] ?? ""
  const names = new Set(
    (/class="([^"]*)"/.exec(opening)?.[1] ?? "").split(/\s+/).filter((name) => name !== ""),
  )
  return hashedBlocksOf(html)
    .filter(({ hash }) => names.has(hash))
    .map(({ block }) => block)
}

/**
 * The rendered markup with remix's style elements dropped — the complement of
 * `stylesOf`.
 *
 * `renderToHtml` returns the markup and the collected `<style>` blocks in one
 * string, so an assertion about an attribute has to exclude the stylesheet or
 * it is really an assertion about both. `controlBase` emits the selector
 * `&[aria-invalid="true"]` on every render, which makes
 * `expect(html).not.toContain("aria-invalid")` impossible to satisfy and
 * `expect(html).toContain('aria-invalid="true"')` impossible to fail. Both
 * directions are wrong for the same reason.
 */
export const markupOf = (html: string): string => html.replace(/<style[\s\S]*?<\/style>/g, "")
