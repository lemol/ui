/**
 * Badge's contract. The component reads these and nothing else, so a skin is
 * a set of values here and never a forked component.
 *
 * Every tone is a subtle fill, a tone-coloured edge, and the tone itself as
 * ink. That pair — `<tone>` on `<tone>-subtle` — is the second contrast
 * promise named in docs/design-system.md, and mini's theme test asserts it.
 * The solid alternative reads the older pair, `<tone>-ink` on `<tone>`, and
 * was rejected on looks: four saturated blocks inline in a paragraph are loud
 * in a way a status marker should not be.
 *
 * `neutral` is not a semantic and is the default anyway, because the most
 * common badge there is says "Draft" or "v2.1". Without it the first caller
 * hand-styles a span or picks `info` for something that is not information.
 *
 * `leading` exists because a badge inline in a paragraph inherits lh-base and
 * comes out tall and loose. How tight the pill sits is a brand's decision, so
 * it is a token rather than a literal.
 *
 * `gap` is inert for a text-only badge, exactly as `ui-btn-gap` is for a
 * text-only button. It is declared so an icon beside the text has somewhere
 * to put its spacing other than `mix`.
 *
 * `border-width` is the one default that is not a primitive; the schema has
 * no border-width primitive and `allowedLiterals` in ../tokens.test.ts
 * already holds `1px` for Button's and Field's.
 *
 * `pop-duration`/`pop-easing` time the insertion pop from the shared
 * `ui-motion-pop` keyframes. Both default to schema primitives, so the
 * reduced-motion reset zeroes them and the pop completes at once.
 *
 * No transition and no hover: design-system.md rules that status colours get
 * no `-hover` arm, so there is no second state to animate to. No size axis:
 * Button has one because schema.sizing names control-h and control-h-sm, and
 * Badge is not a control.
 */
export const badgeTokens = {
  "ui-badge-radius": "var(--r-pill)",
  "ui-badge-pad-x": "var(--sp-2)",
  "ui-badge-pad-y": "var(--sp-1)",
  "ui-badge-gap": "var(--sp-1)",
  "ui-badge-font-size": "var(--fs-xs)",
  "ui-badge-font-weight": "var(--fw-medium)",
  "ui-badge-leading": "var(--lh-tight)",
  "ui-badge-border-width": "1px",
  "ui-badge-pop-duration": "var(--dur-fast)",
  "ui-badge-pop-easing": "var(--ease-spring)",

  // Neutral is the one tone with no semantic arms to name, so it reads the
  // surface vocabulary instead. `hairline` rather than `hairline-strong`: a
  // status-neutral badge should recede, not outline itself against the page.
  "ui-badge-neutral-bg": "var(--surface)",
  "ui-badge-neutral-ink": "var(--ink-muted)",
  "ui-badge-neutral-border": "var(--hairline)",

  "ui-badge-success-bg": "var(--success-subtle)",
  "ui-badge-success-ink": "var(--success)",
  "ui-badge-success-border": "var(--success-border)",

  "ui-badge-warning-bg": "var(--warning-subtle)",
  "ui-badge-warning-ink": "var(--warning)",
  "ui-badge-warning-border": "var(--warning-border)",

  "ui-badge-danger-bg": "var(--danger-subtle)",
  "ui-badge-danger-ink": "var(--danger)",
  "ui-badge-danger-border": "var(--danger-border)",

  "ui-badge-info-bg": "var(--info-subtle)",
  "ui-badge-info-ink": "var(--info)",
  "ui-badge-info-border": "var(--info-border)",
} as const
