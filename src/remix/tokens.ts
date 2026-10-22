import { badgeTokens } from "./badge/tokens.ts"
import { breadcrumbsTokens } from "./breadcrumbs/tokens.ts"
import { buttonTokens } from "./button/tokens.ts"
import { calloutTokens } from "./callout/tokens.ts"
import { checkboxTokens } from "./checkbox/tokens.ts"
import { commandPaletteTokens } from "./command-palette/tokens.ts"
import { dialogTokens } from "./dialog/tokens.ts"
import { disclosureTokens } from "./disclosure/tokens.ts"
import { eyebrowTokens } from "./eyebrow/tokens.ts"
import { facetTokens } from "./facet-filter/tokens.ts"
import { fieldTokens } from "./field/tokens.ts"
import { headingTokens } from "./heading/tokens.ts"
import { kbdTokens } from "./kbd/tokens.ts"
import { menuTokens } from "./menu/tokens.ts"
import { meterTokens } from "./meter/tokens.ts"
import { paginationTokens } from "./pagination/tokens.ts"
import { popoverTokens } from "./popover/tokens.ts"
import { radioTokens } from "./radio/tokens.ts"
import { segmentedControlTokens } from "./segmented-control/tokens.ts"
import { skeletonTokens } from "./skeleton/tokens.ts"
import { spinnerTokens } from "./spinner/tokens.ts"
import { switchTokens } from "./switch/tokens.ts"
import { tableTokens } from "./table/tokens.ts"
import { tabsTokens } from "./tabs/tokens.ts"
import { textTokens } from "./text/tokens.ts"
import { toastTokens } from "./toaster/tokens.ts"

/**
 * Every component's token record in one object, for `emitTokensCss()` to write
 * ahead of a theme's values — same selector, same specificity, later wins.
 *
 * `ui-design` never learns which components exist; it takes this record. Adding
 * a component means adding its record here and nowhere else.
 */
export const componentTokens = {
  ...badgeTokens,
  ...breadcrumbsTokens,
  ...buttonTokens,
  ...calloutTokens,
  ...checkboxTokens,
  ...commandPaletteTokens,
  ...dialogTokens,
  ...disclosureTokens,
  ...eyebrowTokens,
  ...facetTokens,
  ...fieldTokens,
  ...headingTokens,
  ...kbdTokens,
  ...menuTokens,
  ...meterTokens,
  ...paginationTokens,
  ...popoverTokens,
  ...radioTokens,
  ...segmentedControlTokens,
  ...skeletonTokens,
  ...spinnerTokens,
  ...switchTokens,
  ...tableTokens,
  ...tabsTokens,
  ...textTokens,
  ...toastTokens,
} satisfies Record<string, string>

/**
 * The union of every component token name.
 *
 * `ui-remix-mini` depends on both packages, so it is the one that can pass this
 * to `defineTheme` and turn a renamed token into a typecheck failure rather
 * than a design review finding.
 */
export type ComponentTokenName = keyof typeof componentTokens
