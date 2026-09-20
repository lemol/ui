import { AppShell, ErrorState, Nav } from "@lemol/ui/mini"
import { Eyebrow, Grid, Heading, LinkButton, Stack, Text } from "@lemol/ui/remix"
import { type DemoName, demos, isDemoName } from "@lemol/ui/remix/demos"
import { createRouter } from "remix/router"
import { get, route } from "remix/routes"
import { render } from "remix/spa"
import type { Handle } from "remix/ui"

/**
 * The playground's client-rendered twin. It resolves the same demo registry
 * the server catalogue reads — `@lemol/ui/remix/demos` — through a router
 * that runs entirely in the browser, which is what proves the components
 * are portable by construction rather than by audit.
 *
 * Everything here is browser source: this directory is `public/`, and it
 * reaches the server's world only through the demo registry and the
 * components, never through a controller.
 */

export const spaRoutes = route({
  index: get("/spa"),
  demo: get("/spa/:component"),
})

const demoNames = Object.keys(demos) as DemoName[]

function SpaIndex() {
  return () => (
    <Stack gap={8}>
      <Stack gap={2}>
        <Eyebrow>SPA</Eyebrow>
        <Heading level={1}>SPA demo</Heading>
        <Text tone="muted">
          The same demos, client-rendered: every link below resolves through this page's own router,
          with no request leaving the browser.
        </Text>
      </Stack>
      <Stack gap={4}>
        <Eyebrow>Components</Eyebrow>
        <Grid cols={3} gap={2}>
          {demoNames.map((name) => (
            <LinkButton href={`/spa/${name}`} key={name}>
              {demos[name].title}
            </LinkButton>
          ))}
        </Grid>
      </Stack>
    </Stack>
  )
}

function SpaDemo(handle: Handle<{ name: DemoName }>) {
  return () => {
    const { title, Demo } = demos[handle.props.name]
    return (
      <Stack gap={4}>
        <Heading level={1}>{title}</Heading>
        <Demo />
      </Stack>
    )
  }
}

function SpaNotFound() {
  return () => (
    <ErrorState
      action={<LinkButton href="/spa">Back to the SPA index</LinkButton>}
      description="That demo is not in the registry."
      status="404"
      title="No such component"
    />
  )
}

/** The live node `run()` shows while the initial route loads. */
export function SpaFallback() {
  return () => <p role="status">Loading…</p>
}

export function createSpaRouter() {
  const router = createRouter({
    middleware: [
      render((node, context) => {
        const pathname = context.url.pathname
        return (
          <AppShell
            brand="lemol ui"
            brandHref="/spa"
            footer={
              <>
                The client-rendered twin —{" "}
                <a data-rmx-document href="/">
                  back to the server catalogue
                </a>
                .
              </>
            }
            nav={
              <Nav
                items={[
                  { current: pathname === "/spa", href: "/spa", label: "SPA index" },
                  ...demoNames.map((name) => ({
                    current: pathname === `/spa/${name}`,
                    href: `/spa/${name}`,
                    label: demos[name].title,
                  })),
                ]}
              />
            }
          >
            {node}
          </AppShell>
        )
      }),
    ],
    // A link that leaves /spa/* resolves here and finds nothing — the
    // catalogue link in the footer carries `data-rmx-document`, which is
    // what keeps it a document navigation instead.
    defaultHandler({ render }) {
      return render(<SpaNotFound />, { status: 404 })
    },
  })

  router.map(spaRoutes, {
    actions: {
      index({ render }) {
        return render(<SpaIndex />)
      },
      demo({ render, params }) {
        const name = params.component
        if (!isDemoName(name)) return render(<SpaNotFound />, { status: 404 })
        return render(<SpaDemo name={name} />)
      },
    },
  })

  return router
}
