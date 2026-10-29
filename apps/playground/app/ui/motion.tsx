import { css, type Handle } from "remix/component"
import {
  Badge,
  Button,
  CopyButton,
  Eyebrow,
  Field,
  Heading,
  MenuItem,
  MenuSeparator,
  menu,
  Row,
  Skeleton,
  Stack,
  Switch,
  TabBar,
  Tabs,
  Text,
  toast,
} from "../../../../src/remix/index.ts"
import { dissolve, shimmer } from "../../../../src/remix/motion/motion.ts"
import { PlaygroundShell } from "./layout.tsx"

/**
 * Primitives, not tokens: the page is playground chrome, not a component, and
 * the same reasoning the demos record applies.
 */
const frame = css({
  maxInlineSize: "24rem",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-lg)",
  overflow: "hidden",
})

const panel = css({
  padding: "var(--sp-4)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-lg)",
  maxInlineSize: "24rem",
})

const code = css({
  fontFamily: "var(--font-mono)",
  fontSize: "var(--fs-sm)",
  padding: "var(--sp-3)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-md)",
  overflowX: "auto",
  whiteSpace: "pre",
})

// The sweep belongs to `shimmer`; the gradient it sweeps is this text's own.
const shimmerText = css({
  backgroundImage:
    "linear-gradient(90deg, var(--ink-muted) 25%, var(--ink) 50%, var(--ink-muted) 75%)",
  backgroundSize: "200% 100%",
  backgroundClip: "text",
  color: "transparent",
  fontWeight: "var(--fw-bold)",
})

const shimmerMotion = shimmer({
  duration: "var(--dur-slow)",
  easing: "var(--ease-in-out-smooth)",
  iterations: "infinite",
})

const revealed = dissolve({ duration: "var(--dur-base)", easing: "var(--ease-out-quad)" })

const Views = menu("motion-menu")
const Saved = toast("motion-saved")
const Synced = toast("motion-synced")

const tabs = [
  { label: "Overview", href: "?tab=overview", current: true },
  { label: "Runs", href: "?tab=runs", meta: "12" },
  { label: "Changes", href: "?tab=changes" },
]

const optIn = `<ThemeStyle theme={theme} viewTransitions="auto" />
// → @view-transition { navigation: auto }`

/** A glyph standing in for an app's icon set, which the library does not ship. */
const glyph = (text: string) => <span aria-hidden="true">{text}</span>

export interface MotionPageProps {
  /** Path plus query string — see `splitLocation`. */
  location: string
}

function Section(handle: Handle<{ eyebrow: string; title: string; note: string; children?: any }>) {
  return () => {
    const { eyebrow, title, note, children } = handle.props

    return (
      <Stack gap={4}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading level={2}>{title}</Heading>
        {children}
        <Text tone="muted">{note}</Text>
      </Stack>
    )
  }
}

/**
 * Every micro-interaction on one page, each beside the note on how it
 * degrades. The Motion switch in the header zeroes the duration tokens, so
 * `?motion=reduce` shows what a visitor who asked for less motion sees.
 */
export function MotionPage(handle: Handle<MotionPageProps>) {
  return () => (
    <PlaygroundShell location={handle.props.location} nav="catalogue">
      <Stack gap={8}>
        <Stack gap={2}>
          <Eyebrow>Motion</Eyebrow>
          <Heading level={1}>
            <span mix={[shimmerText, shimmerMotion]}>Motion</span>
          </Heading>
          <Text tone="muted">
            Twelve small interactions on shared keyframes and the duration tokens. Reload to replay
            the ones that play on insertion, and use the Motion switch to see them reduced.
          </Text>
        </Stack>

        <Section
          eyebrow="Copy"
          note="Without the runtime the button is inert and the label never swaps; there is nothing to animate."
          title="Confirm"
        >
          <CopyButton id="motion-copy" tone="neutral" value="sk_live_4242424242424242">
            Copy API key
          </CopyButton>
        </Section>

        <Section
          eyebrow="Field"
          note="The shake plays when the element is inserted with its error, so it replays on every page load and frame swap, including for an unchanged field."
          title="Invalid"
        >
          <Field
            error="That address is already registered."
            label="Email"
            name="motion-email"
            type="email"
          />
        </Section>

        <Section
          eyebrow="Badge"
          note="A pop replays whenever the badge is inserted, including for an unchanged count. Insertion only: a count changing in place does not replay."
          title="Counts"
        >
          <Row gap={2}>
            <Badge tone="info">3</Badge>
            <Badge tone="danger">12</Badge>
            <Badge tone="success">new</Badge>
          </Row>
        </Section>

        <Section
          eyebrow="TabBar"
          note="The badge and the dot pop in as the bar renders. Narrow screens only: the bar is hidden on a wide one."
          title="Notification"
        >
          <div mix={frame}>
            <TabBar
              items={[
                {
                  key: "home",
                  label: "Home",
                  icon: glyph("⌂"),
                  href: "#home",
                  current: true,
                  badge: { count: 2, label: "2 waiting on you", tone: "attention" },
                },
                { key: "browse", label: "Browse", icon: glyph("☰"), href: "#browse" },
                {
                  key: "more",
                  label: "More",
                  icon: glyph("⋯"),
                  popoverTarget: "motion-more",
                  dot: "a notice",
                },
              ]}
              label="Motion demo"
            />
          </div>
        </Section>

        <Section
          eyebrow="Field"
          note="The clear button is the browser's own; Chrome fades it in and out, Safari fades it in and drops it on clear, Firefox draws none."
          title="Search"
        >
          <Field label="Search" name="motion-search" type="search" value="lemol" />
        </Section>

        <Section
          eyebrow="Skeleton"
          note="The placeholders shimmer; the content below dissolves in when it renders. Reduced motion leaves both static."
          title="Loading"
        >
          <Stack gap={3}>
            <Skeleton />
            <Skeleton mix={css({ inlineSize: "12rem", blockSize: "1lh" })} />
            <div mix={[panel, revealed]}>
              <Text>The content that replaced them.</Text>
            </div>
          </Stack>
        </Section>

        <Section
          eyebrow="Tabs"
          note="These are route links, so the current tab carries a minted view-transition-name. The morph is inert until a same-document startViewTransition caller exists; remix 3.1.0 ships none, so today the switch is instant."
          title="Tabs"
        >
          <Tabs items={tabs} label="Views" name="motion-views" />
        </Section>

        <Section
          eyebrow="Toaster"
          note="Each toast carries its own minted name, so a stack shift can morph. Inert for the same reason as Tabs: no same-document caller exists yet."
          title="Stacked"
        >
          <Row gap={2}>
            <Saved.Trigger tone="primary">Save</Saved.Trigger>
            <Synced.Trigger tone="neutral">Sync</Synced.Trigger>
          </Row>
          <Saved.Toast tone="success">Saved.</Saved.Toast>
          <Synced.Toast tone="info">Synced.</Synced.Toast>
        </Section>

        <Section
          eyebrow="Button"
          note="Press a button: it scales down on :active. The switch slides its thumb on the same tokens. Reduced motion makes both instant."
          title="Press"
        >
          <Stack gap={4}>
            <Row gap={2}>
              <Button tone="primary">Press me</Button>
              <Button tone="neutral">And me</Button>
            </Row>
            <Switch label="Auto-save" name="motion-auto-save" />
          </Stack>
        </Section>

        <Section
          eyebrow="Menu"
          note="The menu enters with the native starting-style transition. A size morph needs interpolate-size and is deferred."
          title="Menu"
        >
          <Views.Trigger tone="neutral">View</Views.Trigger>
          <Views.List>
            <MenuItem href="#word-wrap">Word wrap</MenuItem>
            <MenuItem href="#minimap">Minimap</MenuItem>
            <MenuSeparator />
            <MenuItem disabled>Zoom in</MenuItem>
          </Views.List>
        </Section>

        <Section
          eyebrow="Navigation"
          note="Same-document morphs need a JavaScript caller (none ships). Cross-document is pure CSS: Chrome 126+ and Safari 18.2+, not stable Firefox, where navigation is simply instant. The UA root crossfade is not covered. This page does not opt in, so navigation here stays consistent."
          title="Transitions"
        >
          <pre mix={code}>{optIn}</pre>
        </Section>
      </Stack>
    </PlaygroundShell>
  )
}
