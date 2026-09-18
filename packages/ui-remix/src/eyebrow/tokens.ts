/**
 * Eyebrow's contract — the one component whose entire reason to exist is
 * aesthetic, so all five of its properties are reachable.
 *
 * `tr-wider` is in schema.type because of this component, and a primitive with
 * no consumer that can vary it is a value nobody can check.
 *
 * `ui-eyebrow-transform` holds a keyword rather than a primitive, which is why
 * `uppercase` is allow-listed in ../tokens.test.ts. No leading token: an
 * eyebrow is one line, and the inherited lh-base is right when it wraps.
 */
export const eyebrowTokens = {
  "ui-eyebrow-size": "var(--fs-2xs)",
  "ui-eyebrow-weight": "var(--fw-semibold)",
  "ui-eyebrow-tracking": "var(--tr-wider)",
  "ui-eyebrow-transform": "uppercase",
  "ui-eyebrow-ink": "var(--ink-muted)",
} as const
