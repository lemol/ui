import type { Handle } from "remix/component"
import { ErrorState } from "../../../../src/mini/index.ts"
import { type DemoEntry, type DemoName, demos } from "../../../../src/remix/demos.ts"
import { Eyebrow, Heading, LinkButton, Row, Stack } from "../../../../src/remix/index.ts"
import { BadgeKnobs, ButtonKnobs, HeadingKnobs, TextKnobs } from "./knobs.tsx"
import { PlaygroundShell } from "./layout.tsx"

export interface CataloguePageProps {
  name: DemoName
  entry: DemoEntry
  /** Path plus query string — see `splitLocation`. */
  location: string
}

/**
 * The knobs for the components that have variant axes worth isolating. The
 * rest — layout, container, field, eyebrow, dialog — enumerate their own
 * states in the demo already, or are interactive rather than variantful.
 */
function KnobsFor(handle: Handle<{ name: DemoName; location: string }>) {
  return () => {
    const { name, location } = handle.props
    if (name === "button") return <ButtonKnobs location={location} />
    if (name === "badge") return <BadgeKnobs location={location} />
    if (name === "text") return <TextKnobs location={location} />
    if (name === "heading") return <HeadingKnobs location={location} />
    return null
  }
}

/**
 * An unknown `/c/:component`, as a page rather than a bare status: the
 * shell, an ErrorState quoting the name, and a way back. The status is
 * still 404 — the controller sets it — because a soft 404 would lie to
 * every link checker.
 */
export interface UnknownComponentPageProps {
  location: string
  name: string
  nav?: "catalogue" | "spa" | undefined
  backHref?: string | undefined
  backLabel?: string | undefined
}

export function UnknownComponentPage(handle: Handle<UnknownComponentPageProps>) {
  return () => {
    const {
      location,
      name,
      nav = "catalogue",
      backHref = "/",
      backLabel = "Back to the catalogue",
    } = handle.props
    return (
      <PlaygroundShell location={location} nav={nav}>
        <ErrorState
          action={<LinkButton href={backHref}>{backLabel}</LinkButton>}
          description={`"${name}" is not in the demo registry.`}
          status="404"
          title="No such component"
        />
      </PlaygroundShell>
    )
  }
}

/**
 * The frame around a demo: the component index, the title, the knobs where
 * there are any, and the demo's own markup. Everything that changes the
 * render — knobs, scheme, density, scripts — is a query param, so the whole
 * page works as static server output.
 */
export function CataloguePage(handle: Handle<CataloguePageProps>) {
  return () => {
    const { name, entry, location } = handle.props
    const { title, Demo } = entry
    const names = Object.keys(demos) as DemoName[]
    return (
      <PlaygroundShell location={location} nav="catalogue">
        <Stack gap={8}>
          <Stack gap={4}>
            <Eyebrow>Components</Eyebrow>
            <Row gap={2} wrap>
              {names.map((candidate) => (
                <LinkButton
                  href={`/c/${candidate}`}
                  key={candidate}
                  size="sm"
                  tone={candidate === name ? "primary" : "neutral"}
                >
                  {demos[candidate].title}
                </LinkButton>
              ))}
            </Row>
          </Stack>

          <Stack gap={4}>
            <Heading level={1}>{title}</Heading>
            <KnobsFor location={location} name={name} />
          </Stack>

          <Demo />
        </Stack>
      </PlaygroundShell>
    )
  }
}
