import type { Handle } from "remix/component"

/**
 * The playground's pages never see the request — only where it was going.
 * `location` is the path plus the query string, which is everything a GET
 * form or a switcher link needs to preserve the rest of the state while
 * changing one axis.
 */
export function splitLocation(location: string): { pathname: string; params: URLSearchParams } {
  const url = new URL(location, "http://localhost")
  return { pathname: url.pathname, params: url.searchParams }
}

export interface HiddenFieldsProps {
  params: URLSearchParams
  /**
   * Names the form sets itself, through its own selects and submit buttons.
   * They are excluded so a submission carries each value once: a preserved
   * copy alongside the new one would send the stale value first, which is
   * the one `get()` reads.
   */
  except?: readonly string[] | undefined
}

/**
 * Every current param as a hidden input, minus `except`. A GET form submits
 * only its own inputs, so without these a knob change would drop the scheme,
 * the density and the no-JS flag — and a switcher would drop the knobs.
 */
export function HiddenFields(handle: Handle<HiddenFieldsProps>) {
  return () => {
    const { params, except = [] } = handle.props
    const names = [...new Set(params.keys())].filter((name) => !except.includes(name))
    return (
      <>
        {names.flatMap((name, index) =>
          params
            .getAll(name)
            .map((value, ordinal) => (
              <input
                key={`${index}:${name}=${value}:${ordinal}`}
                name={name}
                type="hidden"
                value={value}
              />
            )),
        )}
      </>
    )
  }
}
