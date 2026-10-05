import type { Handle } from "remix/component"
import { type DemoName, demos } from "../../../../src/remix/demos.ts"
import {
  Eyebrow,
  Grid,
  Heading,
  LinkButton,
  Row,
  Stack,
  Text,
} from "../../../../src/remix/index.ts"
import { PlaygroundShell } from "./layout.tsx"
import { RuntimeProbe, RuntimeProbeView } from "./public/runtime-probe.tsx"

export interface HomePageProps {
  /** With scripts off the probe renders dead rather than absent, so the
   * unenhanced page shows exactly what the enhanced one does. */
  scripts: boolean
  /** Path plus query string — see `splitLocation`. */
  location: string
}

/**
 * The catalogue index, in mini's shell: every demo by name, the page recipe,
 * the SPA twin, and the hydration probe proving the pipeline underneath.
 */
export function HomePage(handle: Handle<HomePageProps>) {
  return () => {
    const { scripts, location } = handle.props
    const names = Object.keys(demos) as DemoName[]

    return (
      <PlaygroundShell location={location} nav="catalogue">
        <Stack gap={8}>
          <Stack gap={2}>
            <Eyebrow>Catalogue</Eyebrow>
            <Heading level={1}>lemol ui playground</Heading>
            <Text tone="muted">
              Every component below renders from the same source the package ships, through its own
              demo file — so the catalogue cannot drift from what a consumer installs.
            </Text>
          </Stack>

          <Stack gap={4}>
            <Eyebrow>Components</Eyebrow>
            <Grid cols={3} gap={2}>
              {names.map((name) => (
                <LinkButton href={`/c/${name}`} key={name}>
                  {demos[name].title}
                </LinkButton>
              ))}
            </Grid>
          </Stack>

          <Stack gap={4}>
            <Eyebrow>Recipes</Eyebrow>
            <Row gap={2}>
              <LinkButton href="/pages/dashboard" tone="primary">
                Dashboard
              </LinkButton>
              <LinkButton href="/spa">SPA demo</LinkButton>
            </Row>
            <Text tone="muted">
              One composed page where contract gaps surface, and the same components running
              client-rendered through the SPA router.
            </Text>
          </Stack>

          <Stack gap={4}>
            <Eyebrow>Hydration</Eyebrow>
            <Row gap={2}>{scripts ? <RuntimeProbe /> : <RuntimeProbeView clicks={0} />}</Row>
            <Text tone="muted">
              {scripts
                ? "Client JavaScript is on: the button counts."
                : "Client JavaScript is off: the button is complete markup that does nothing."}
            </Text>
          </Stack>
        </Stack>
      </PlaygroundShell>
    )
  }
}
