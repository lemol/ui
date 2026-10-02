import { attrs, type Handle, type MixInput, type RemixNode } from "remix/component"

export interface LiveFormProps {
  /** Required: the id every `liveSubmit()`-tagged field points at through `commandfor`. */
  id: string
  method?: "get" | "post" | undefined
  action?: string | undefined
  mix?: MixInput<HTMLFormElement> | undefined
  children?: RemixNode | undefined
}

/**
 * A plain `<form>` and nothing else. `LiveForm` opts nothing in by itself —
 * see `liveSubmit()` — so with the runtime absent this is simply a form that
 * submits on its own submit button, exactly as if `LiveForm` had never been
 * used.
 */
export function LiveForm(handle: Handle<LiveFormProps>) {
  return () => {
    const { id, method = "get", action, mix, children } = handle.props
    return (
      <form action={action} id={id} method={method} mix={mix}>
        {children}
      </form>
    )
  }
}

/**
 * Opts one field into `--live-submit`, pointed at `formId`. Apply through
 * `mix` to whichever element should trigger a resubmit on change — a bare
 * `<select>`, or a wrapper like `Field`'s own, since `runtime.ts`'s `input`
 * bridge walks up from the event target with `closest()` and a native
 * `input`/`change` event bubbles through an ancestor either way.
 *
 * `attrs()`, not typed JSX props: `command`/`commandfor` on a form control is
 * this package's own convention, not the Invoker Commands spec — see
 * `CommandPaletteInput` for the same pattern.
 *
 * ```tsx
 * <LiveForm id="filters">
 *   <Field control="select" label="Role" mix={liveSubmit("filters")} name="role">
 *     …
 *   </Field>
 * </LiveForm>
 * ```
 */
export function liveSubmit(formId: string): MixInput<Element> {
  return attrs({ command: "--live-submit", commandfor: formId })
}
