/**
 * The id/aria-describedby wiring `Checkbox`, `Radio` and `Switch` share,
 * factored out because three copies of `Field`'s own scaffold
 * (`field/field.tsx`) is the point past which the M2 plan asks for a shared
 * helper rather than a fourth copy-paste. A Record more than one component
 * uses sits at the layer root, the same reasoning `space.ts` and `align.ts`
 * already follow.
 *
 * `Field` itself is not migrated onto this: it predates the helper, its own
 * copy is already tested, and swapping it for no behavioural change is not
 * this task's job.
 */
export interface FieldMessages {
  readonly hintId: string
  readonly errorId: string
  /** Only the ids that actually rendered — an `aria-describedby` naming an absent id is read as nothing by some assistive tech and skipped by others. */
  readonly describedBy: string | undefined
  readonly hasHint: boolean
  readonly hasError: boolean
  readonly invalid: "true" | undefined
}

/**
 * `""` is treated the same as `undefined` — absent — for `hint` and `error`
 * alike, matching `Field`: a controller writing `hint={maybeHint ?? ""}` is
 * ordinary, and a bare falsy check would already have caught it.
 */
export function fieldMessages(
  stem: string,
  hint: string | undefined,
  error: string | undefined,
): FieldMessages {
  const hintId = `${stem}-hint`
  const errorId = `${stem}-error`
  const hasHint = hint !== undefined && hint !== ""
  const hasError = error !== undefined && error !== ""
  const described = [hasHint ? hintId : "", hasError ? errorId : ""]
    .filter((id) => id !== "")
    .join(" ")

  return {
    describedBy: described === "" ? undefined : described,
    errorId,
    hasError,
    hasHint,
    hintId,
    invalid: hasError ? "true" : undefined,
  }
}
