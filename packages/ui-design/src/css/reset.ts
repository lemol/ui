import { headingScale, schema } from "../tokens.ts"
import { base } from "./layers.ts"

/**
 * Element defaults, in @layer base.
 *
 * A rule is admitted here only if it is cross-browser normalization with no
 * aesthetic content, or it wires a bare element to the token contract at zero
 * specificity through :where(). Anything that needs a literal number gets a
 * token name or does not ship — which is what keeps a package holding no
 * values from growing a look.
 *
 * No CSS nesting, ever. The sheet ships as the text of a style element, where
 * the renderer escapes the ampersand, so a nested rule arrives broken. The
 * grouped selectors below are flat :where() lists for that reason, and the
 * same rule bans the child combinator.
 */

/**
 * One rule per heading element, derived rather than written out.
 *
 * Flat and separate, not a grouped :where() list, because each element takes a
 * different size — and flat because a nested rule arrives at the browser broken
 * when the sheet ships as style-element text.
 */
const headingSizeRules = Object.entries(headingScale)
  .map(([level, name]) => `  :where(h${level}) {\n    font-size: var(--${name});\n  }`)
  .join("\n\n")

export const resetCss = base(`  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    color-scheme: var(--scheme-mode);
  }

  body {
    margin: 0;
    background: var(--canvas);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: var(--fs-md);
    line-height: var(--lh-base);
  }

  /* The layout components own spacing, and a default margin fighting gap is
     the first thing that goes wrong once they arrive. */
  :where(h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd) {
    margin: 0;
  }

  :where(h1, h2, h3, h4, h5, h6) {
    font-weight: var(--fw-bold);
    letter-spacing: var(--tr-tight);
    line-height: var(--lh-tight);
  }

${headingSizeRules}

  :where(img, svg, video, canvas) {
    display: block;
    max-width: 100%;
  }

  :where(code, kbd, samp, pre) {
    font-family: var(--font-mono);
  }

  :where(button, input, select, textarea, optgroup) {
    font: inherit;
    color: inherit;
  }

  :where(table) {
    border-collapse: collapse;
  }

  :where(a) {
    color: var(--link);
    text-decoration: underline;
  }

  :where(a:visited) {
    color: var(--link);
  }

  :where(a:hover) {
    color: var(--link-hover);
  }

  :where(:focus-visible) {
    outline: var(--focus-ring);
    outline-offset: var(--focus-ring-offset);
  }

  ::selection {
    background: var(--accent-subtle);
    color: var(--ink);
  }`)

/**
 * The one rule that is deliberately unlayered.
 *
 * Unlayered CSS outranks every layer, rmx included. The user agent's own
 * [hidden] rule does not: it loses to any author display declaration, and most
 * components set one — so without this, toggling element.hidden from a runtime
 * silently does nothing.
 */
export const unlayeredCss = `/* Deliberately unlayered: this has to beat a component's own display rule.
   See reset.ts for why. */
[hidden] {
  display: none !important;
}`

const durationNames = schema.motion.filter((name) => name.startsWith("dur-"))

/**
 * The global reduced-motion reset, derived from the schema rather than a second
 * list of duration names that can drift.
 *
 * Zeroing the tokens reaches everything the contract covers, including the
 * view-transition pseudo-elements that a universal selector cannot match. It
 * leaves CSS that hard-codes a duration animating, which is a violation of the
 * token contract and better found than masked.
 *
 * The declarations carry !important because this block selects :root while the
 * density block selects :root[data-density="compact"] — higher specificity. A
 * theme with a duration in its compact axis would otherwise keep animating.
 */
export const reducedMotionCss = `@media (prefers-reduced-motion: reduce) {
  :root {
${durationNames.map((name) => `    --${name}: 0ms !important;`).join("\n")}
  }
}`
