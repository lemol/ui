import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { Badge, Eyebrow, Heading, type HeadingLevel, Stack, Text } from "../remix/index.ts"

/**
 * The panel both states share: centred, generously padded, and flat.
 *
 * Property-disjoint from the two tone blocks below on purpose. Each `css()`
 * block is its own cascade sub-layer and sub-layer order follows first render
 * rather than source, so two blocks that can both set `background` would be
 * decided by whichever panel the page happened to render first. Here the base
 * owns the geometry and each tone owns the three paint properties, and no
 * order can produce a different result.
 */
const panelStyle = css({
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "var(--sp-4)",
  paddingBlock: "var(--sp-12)",
  paddingInline: "var(--sp-6)",
  borderWidth: "1px",
  borderRadius: "var(--r-lg)",
})

/**
 * Dashed, and the one place in this package where a border style carries
 * meaning: an empty region is a container waiting to be filled, and a dashed
 * edge says so without a sentence. `canvas` rather than `surface`, so the
 * panel recedes from the page it sits on instead of floating above it.
 */
const emptyToneStyle = css({
  borderStyle: "dashed",
  borderColor: "var(--hairline-strong)",
  background: "var(--canvas)",
})

/**
 * Solid and tinted. An error is not a placeholder, and the tone primitives are
 * what say so — the same `danger-subtle` / `danger-border` pair a Badge reads,
 * at the scale of a panel.
 */
const errorToneStyle = css({
  borderStyle: "solid",
  borderColor: "var(--danger-border)",
  background: "var(--danger-subtle)",
})

/** The measure: a centred paragraph wider than this stops being readable. */
const proseStyle = css({
  maxInlineSize: "42ch",
})

interface StatePanelProps {
  level: HeadingLevel
  title: string
  description?: string | undefined
  marker?: RemixNode | undefined
  action?: RemixNode | undefined
  tone: "empty" | "error"
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

/**
 * Internal: the two exported states differ in their marker and their three
 * paint properties, and sharing the rest is what keeps an empty page and an
 * error page recognisably the same product.
 */
function StatePanel(handle: Handle<StatePanelProps>) {
  return () => {
    const { level, title, description, marker, action, tone, mix, children } = handle.props
    return (
      <div mix={[panelStyle, tone === "empty" ? emptyToneStyle : errorToneStyle, mix]}>
        {marker}
        <Stack align="center" gap={2}>
          <Heading level={level} size={3}>
            {title}
          </Heading>
          {description === undefined ? null : (
            <Text mix={proseStyle} tone="muted">
              {description}
            </Text>
          )}
        </Stack>
        {children}
        {action}
      </div>
    )
  }
}

export interface EmptyStateProps {
  /**
   * The document outline. Defaults to 2: a state panel almost always sits
   * inside a page that already has its `h1`, and a second `h1` is an outline
   * bug rather than a look.
   */
  level?: HeadingLevel | undefined
  /** What is not here. A sentence, not a word: "No tasks yet". */
  title: string
  /** How to make it non-empty. One sentence; the action does the rest. */
  description?: string | undefined
  /** The kicker above the title — the list's name, a filter that matched nothing. */
  eyebrow?: string | undefined
  /** Usually a `LinkButton` or an `overlay()` trigger. */
  action?: RemixNode | undefined
  mix?: MixInput<HTMLDivElement> | undefined
  /** Extra detail between the description and the action. */
  children?: RemixNode | undefined
}

/**
 * The first screen of most features, and the one most often left as a bare
 * sentence. It ships here because "empty" is a state every list has, and
 * because a page that only ever gets designed full is a page whose first run
 * looks broken.
 */
export function EmptyState(handle: Handle<EmptyStateProps>) {
  return () => {
    const { level = 2, title, description, eyebrow, action, mix, children } = handle.props
    return (
      <StatePanel
        action={action}
        description={description}
        level={level}
        marker={eyebrow === undefined ? undefined : <Eyebrow>{eyebrow}</Eyebrow>}
        mix={mix}
        title={title}
        tone="empty"
      >
        {children}
      </StatePanel>
    )
  }
}

export interface ErrorStateProps {
  level?: HeadingLevel | undefined
  /** What went wrong, in the user's terms — not the exception's. */
  title: string
  /** What they can do about it. */
  description?: string | undefined
  /**
   * The badge above the title. Defaults to `Error`; a route handler that knows
   * the status passes it — "404", "503" — because a number a user can quote is
   * worth more than a word they cannot.
   */
  status?: string | undefined
  /** A way back: a link home, a retry form's submit. */
  action?: RemixNode | undefined
  mix?: MixInput<HTMLDivElement> | undefined
  /** Extra detail — a request id, a `<pre>` of the message in development. */
  children?: RemixNode | undefined
}

/**
 * The other half of the pair. A Badge rather than an Eyebrow carries the
 * status, because the schema's danger tone is what makes this panel legible
 * at a glance, and `Badge` is the component that already owns that vocabulary.
 */
export function ErrorState(handle: Handle<ErrorStateProps>) {
  return () => {
    const { level = 2, title, description, status = "Error", action, mix, children } = handle.props
    return (
      <StatePanel
        action={action}
        description={description}
        level={level}
        marker={<Badge tone="danger">{status}</Badge>}
        mix={mix}
        title={title}
        tone="error"
      >
        {children}
      </StatePanel>
    )
  }
}
