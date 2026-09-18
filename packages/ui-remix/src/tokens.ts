import { buttonTokens } from "./button/tokens.ts"
import { headingTokens } from "./heading/tokens.ts"

/**
 * Every component's token record in one object, for `emitTokensCss()` to write
 * ahead of a theme's values — same selector, same specificity, later wins.
 *
 * `ui-design` never learns which components exist; it takes this record. Adding
 * a component means adding its record here and nowhere else.
 */
export const componentTokens = {
  ...buttonTokens,
  ...headingTokens,
} satisfies Record<string, string>

/**
 * The union of every component token name.
 *
 * `ui-remix-mini` depends on both packages, so it is the one that can pass this
 * to `defineTheme` and turn a renamed token into a typecheck failure rather
 * than a design review finding.
 */
export type ComponentTokenName = keyof typeof componentTokens
