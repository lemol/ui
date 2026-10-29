import { css, type Handle } from "remix/component"
import { Button } from "../../../../src/remix/index.ts"
import { HiddenFields, splitLocation } from "./forms.tsx"

/**
 * Primitives, not tokens: the switchers are playground chrome, not a
 * component, and the same reasoning the demos record applies.
 */
const bar = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--sp-2) var(--sp-4)",
})

const group = css({
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-1)",
})

const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
})

export interface PlaygroundSwitchersProps {
  /** Path plus query string — see `splitLocation`. */
  location: string
}

/**
 * The scheme, density, script, compat and motion switches as GET forms, so every
 * axis works with no client JavaScript — the same mechanism as the knobs.
 *
 * Each option is its own submit button, which is what makes a switch one
 * click rather than select-and-apply. A button always sends its own
 * name/value pair, so "back to the default" is an explicit value the
 * controller allow-lists (`scheme=system`, `density=default`) rather than
 * a dropped param a form cannot express. `nojs` and `compat` go the other
 * way: presence means on, so switching off is a form that preserves
 * everything *except* the flag and submits with a button carrying no name.
 *
 * There is no theme switcher: M1 ships one theme, and a switcher with one
 * option is decoration. It arrives with the second theme.
 */
export function PlaygroundSwitchers(handle: Handle<PlaygroundSwitchersProps>) {
  return () => {
    const { pathname, params } = splitLocation(handle.props.location)
    const scheme = params.get("scheme") ?? "system"
    const density = params.get("density") ?? "default"
    const scripts = !params.has("nojs")
    const compat = params.has("compat")
    const reduced = params.get("motion") === "reduce"

    return (
      <div mix={bar}>
        {/* `data-rmx-document`: switching back to system or default renders a
            blank axis, which an in-place swap would preserve from the last
            render instead of clearing. */}
        <form action={pathname} data-rmx-document method="get">
          <div mix={group}>
            <span mix={label}>Scheme</span>
            <HiddenFields except={["scheme"]} params={params} />
            <Button
              name="scheme"
              size="sm"
              tone={scheme === "system" ? "primary" : "ghost"}
              type="submit"
              value="system"
            >
              System
            </Button>
            <Button
              name="scheme"
              size="sm"
              tone={scheme === "light" ? "primary" : "ghost"}
              type="submit"
              value="light"
            >
              Light
            </Button>
            <Button
              name="scheme"
              size="sm"
              tone={scheme === "dark" ? "primary" : "ghost"}
              type="submit"
              value="dark"
            >
              Dark
            </Button>
          </div>
        </form>

        <form action={pathname} data-rmx-document method="get">
          <div mix={group}>
            <span mix={label}>Density</span>
            <HiddenFields except={["density"]} params={params} />
            <Button
              name="density"
              size="sm"
              tone={density === "default" ? "primary" : "ghost"}
              type="submit"
              value="default"
            >
              Default
            </Button>
            <Button
              name="density"
              size="sm"
              tone={density === "compact" ? "primary" : "ghost"}
              type="submit"
              value="compact"
            >
              Compact
            </Button>
          </div>
        </form>

        {/* `data-rmx-document` hands this navigation to the browser. Left to
            the runtime it would swap the page in place, keeping every script
            the document already loaded — scripts "off" with the runtime on. */}
        <form action={pathname} data-rmx-document method="get">
          <div mix={group}>
            <span mix={label}>Scripts</span>
            <HiddenFields except={["nojs"]} params={params} />
            {/* No `name`: submitting sends only the preserved inputs, which
                is what drops `nojs` and turns the scripts back on. */}
            <Button size="sm" tone={scripts ? "primary" : "ghost"} type="submit">
              On
            </Button>
            <Button name="nojs" size="sm" tone={scripts ? "ghost" : "primary"} type="submit">
              Off
            </Button>
          </div>
        </form>

        {/* The backfill is decided as the entry boots, so it too needs a
            fresh document rather than an in-place swap. */}
        <form action={pathname} data-rmx-document method="get">
          <div mix={group}>
            <span mix={label}>Compat</span>
            <HiddenFields except={["compat"]} params={params} />
            {/* Disabled with the scripts off: there is no entry for the
                backfill to ride in on, so the flag would do nothing. */}
            <Button
              disabled={!scripts}
              size="sm"
              tone={!compat ? "primary" : "ghost"}
              type="submit"
            >
              Off
            </Button>
            <Button
              disabled={!scripts}
              name="compat"
              size="sm"
              tone={compat ? "primary" : "ghost"}
              type="submit"
            >
              On
            </Button>
          </div>
        </form>

        {/* The attribute is rendered by the server, so an in-place swap would
            keep the last one: a fresh document, like scheme and density. */}
        <form action={pathname} data-rmx-document method="get">
          <div mix={group}>
            <span mix={label}>Motion</span>
            <HiddenFields except={["motion"]} params={params} />
            <Button
              name="motion"
              size="sm"
              tone={!reduced ? "primary" : "ghost"}
              type="submit"
              value="full"
            >
              Full
            </Button>
            <Button
              name="motion"
              size="sm"
              tone={reduced ? "primary" : "ghost"}
              type="submit"
              value="reduce"
            >
              Reduce
            </Button>
          </div>
        </form>
      </div>
    )
  }
}
