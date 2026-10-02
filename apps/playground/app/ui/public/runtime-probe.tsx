import { clientEntry, css, type Handle, type MixInput, on } from "remix/component"

const style = css({
  font: "inherit",
  padding: "0.5rem 0.75rem",
  border: "1px solid currentColor",
  borderRadius: "0.375rem",
  background: "transparent",
  cursor: "pointer",
})

export interface RuntimeProbeViewProps {
  clicks: number
  /** Omitted in the unenhanced render, which is what makes the dead button and
   * the live one the same markup rather than two copies of it. */
  behaviour?: MixInput<HTMLButtonElement> | undefined
}

export function RuntimeProbeView(handle: Handle<RuntimeProbeViewProps>) {
  return () => {
    const { clicks, behaviour } = handle.props
    return (
      <button type="button" mix={behaviour === undefined ? style : [style, behaviour]}>
        {clicks === 0 ? "Not clicked yet" : `Clicked ${clicks}×`}
      </button>
    )
  }
}

/**
 * The smallest thing that can tell the truth about the pipeline: it only counts
 * if the asset server compiled this module, the import map landed, and the
 * runtime hydrated the markup the server already sent.
 *
 * `import.meta.url` is the entry id, so nothing here names a URL. The export
 * name has to match the inner function name — that is how the renderer picks
 * the export back out of the compiled module.
 */
export const RuntimeProbe = clientEntry(
  import.meta.url,
  function RuntimeProbe(handle: Handle<Record<string, never>>) {
    let clicks = 0

    return () => (
      <RuntimeProbeView
        clicks={clicks}
        behaviour={on<HTMLButtonElement>("click", () => {
          clicks++
          handle.update()
        })}
      />
    )
  },
)
