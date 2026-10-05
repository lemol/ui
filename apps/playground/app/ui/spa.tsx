import type { Handle } from "remix/component"
import { type DemoName, demos } from "../../../../src/remix/demos.ts"
import { Eyebrow, Grid, Heading, LinkButton, Stack, Text } from "../../../../src/remix/index.ts"
import { PlaygroundShell } from "./layout.tsx"

/**
 * What the server sends for `/spa/*`.
 *
 * With scripts, the page is a shell: the SPA entry replaces this fallback
 * with the routed node on boot, so it is only ever read when the scripts
 * fail — in which case the link below is the way out rather than a blank
 * page. With `?nojs`, the same route renders the same components on the
 * server instead: the index, or the demo by name.
 *
 * The index list mirrors `app/spa/public/router.tsx` line for line. The two
 * cannot share it — that file is browser source and this one is server-only
 * — and ten lines of links are cheaper than the indirection that would let
 * them.
 */

/** This route with `nojs` added, preserving everything already there. */
function noJsHref(location: string): string {
  return location.includes("?") ? `${location}&nojs` : `${location}?nojs`
}

export interface SpaLoadingProps {
  /** Path plus query string — see `splitLocation`. */
  location: string
}

export function SpaLoading(handle: Handle<SpaLoadingProps>) {
  return () => (
    <PlaygroundShell location={handle.props.location} nav="spa">
      <Stack gap={4}>
        <Eyebrow>SPA</Eyebrow>
        <Heading level={1}>SPA demo</Heading>
        <Text tone="muted">Loading the client-rendered demo…</Text>
        <Text tone="muted">
          If this message stays, the scripts are blocked — the{" "}
          <a href={noJsHref(handle.props.location)}>same content renders server-side</a>.
        </Text>
      </Stack>
    </PlaygroundShell>
  )
}

export interface SpaNoJsProps {
  /** Path plus query string — see `splitLocation`. */
  location: string
  /** The demo, or `null` for the index. */
  name: DemoName | null
}

export function SpaNoJs(handle: Handle<SpaNoJsProps>) {
  return () => {
    const { location, name } = handle.props

    if (name === null) {
      const names = Object.keys(demos) as DemoName[]

      return (
        <PlaygroundShell location={location} nav="spa">
          <Stack gap={8}>
            <Stack gap={2}>
              <Eyebrow>SPA</Eyebrow>
              <Heading level={1}>SPA demo</Heading>
              <Text tone="muted">
                The same demos, server-rendered: with the scripts off, this is what the SPA router
                would have resolved in the browser.
              </Text>
            </Stack>
            <Stack gap={4}>
              <Eyebrow>Components</Eyebrow>
              <Grid cols={3} gap={2}>
                {names.map((candidate) => (
                  <LinkButton href={`/spa/${candidate}`} key={candidate}>
                    {demos[candidate].title}
                  </LinkButton>
                ))}
              </Grid>
            </Stack>
          </Stack>
        </PlaygroundShell>
      )
    }

    const { title, Demo } = demos[name]

    return (
      <PlaygroundShell location={location} nav="spa">
        <Stack gap={4}>
          <Heading level={1}>{title}</Heading>
          <Demo />
        </Stack>
      </PlaygroundShell>
    )
  }
}
