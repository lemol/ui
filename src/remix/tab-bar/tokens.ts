/**
 * TabBar's contract: a phone's bottom navigation, each destination a mark
 * over its name, the current one's mark on a pill.
 *
 * `mark-ink-current` is the current mark's colour; a host that gives each
 * destination a hue of its own sets it on that item, so the pill carries the
 * destination's colour and the rest of the bar stays neutral. A count and a
 * dot start `badge-nudge` past the mark's centre; a count rises
 * `badge-lift` over the pill's top edge, a dot sits `dot-top` below it.
 *
 * `badge-pop-duration`/`badge-pop-easing` time the count's and the dot's
 * insertion pop from the shared `ui-motion-pop` keyframes. Both default to
 * schema primitives, so the reduced-motion reset zeroes them.
 */
export const tabBarTokens = {
  "ui-tabbar-height": "var(--sp-12)",
  "ui-tabbar-ink": "var(--ink-muted)",
  "ui-tabbar-ink-current": "var(--ink)",
  "ui-tabbar-label-size": "var(--fs-xs)",
  "ui-tabbar-label-weight": "var(--fw-medium)",
  "ui-tabbar-label-weight-current": "var(--fw-semibold)",
  "ui-tabbar-label-leading": "var(--lh-tight)",
  "ui-tabbar-mark-w": "var(--sp-10)",
  "ui-tabbar-mark-h": "var(--sp-6)",
  "ui-tabbar-mark-radius": "var(--r-pill)",
  "ui-tabbar-mark-size": "var(--fs-xl)",
  "ui-tabbar-mark-bg-current": "var(--surface-active)",
  "ui-tabbar-mark-bg-pressed": "var(--surface-hover)",
  "ui-tabbar-mark-ink-current": "var(--ink)",
  "ui-tabbar-duration": "var(--dur-fast)",
  "ui-tabbar-easing": "var(--ease-out-quad)",
  "ui-tabbar-badge-lift": "var(--sp-1)",
  "ui-tabbar-badge-nudge": "var(--sp-2)",
  "ui-tabbar-badge-size": "var(--sp-4)",
  "ui-tabbar-badge-pad-x": "var(--sp-1)",
  "ui-tabbar-badge-radius": "var(--r-pill)",
  "ui-tabbar-badge-bg": "var(--surface-active)",
  "ui-tabbar-badge-ink": "var(--ink)",
  "ui-tabbar-badge-font-size": "var(--fs-2xs)",
  "ui-tabbar-badge-font-weight": "var(--fw-semibold)",
  "ui-tabbar-badge-attention-bg": "var(--accent)",
  "ui-tabbar-badge-attention-ink": "var(--accent-ink)",
  "ui-tabbar-dot": "var(--accent)",
  "ui-tabbar-dot-size": "var(--sp-2)",
  "ui-tabbar-dot-top": "var(--sp-0)",
  "ui-tabbar-badge-pop-duration": "var(--dur-fast)",
  "ui-tabbar-badge-pop-easing": "var(--ease-spring)",
} as const
