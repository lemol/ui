import { AppShell, Nav } from "@lemol/ui/mini"
import type { Handle, RemixNode } from "remix/ui"
import { PlaygroundSwitchers } from "./switchers.tsx"

export type PlaygroundNav = "catalogue" | "dashboard" | "spa"

export interface PlaygroundShellProps {
  /** Path plus query string — see `splitLocation`. */
  location: string
  nav: PlaygroundNav
  children?: RemixNode | undefined
}

/**
 * Every server-rendered playground page in mini's `AppShell`: the wordmark,
 * the three sections, the switchers in the header's trailing slot, and a
 * footer stating the premise. The SPA pages carry their own copy in
 * `app/spa/public/router.tsx`, because browser source cannot import this —
 * `app/ui` is server-only and the asset server holds that line.
 */
export function PlaygroundShell(handle: Handle<PlaygroundShellProps>) {
  return () => {
    const { location, nav, children } = handle.props
    return (
      <AppShell
        actions={<PlaygroundSwitchers location={location} />}
        brand="lemol ui"
        brandHref="/"
        footer="Server-rendered from @lemol/ui — every page works with JavaScript off."
        nav={
          <Nav
            items={[
              { current: nav === "catalogue", href: "/", label: "Catalogue" },
              { current: nav === "dashboard", href: "/pages/dashboard", label: "Dashboard" },
              { current: nav === "spa", href: "/spa", label: "SPA" },
            ]}
          />
        }
      >
        {children}
      </AppShell>
    )
  }
}
