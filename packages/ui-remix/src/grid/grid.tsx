import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { gaps, type SpaceStep } from "../space.ts"

/**
 * Grid declares no tokens of its own. Every value it emits is a structural
 * keyword or a primitive the caller chose from the space scale.
 */
const gridBase = css({
  display: "grid",
})

/**
 * Six, not twelve. Twelve is the convention for grid systems that count
 * *spans*; these are equal `1fr` tracks, and more than six of them is
 * unreadable at any width `--page-max` permits. A judgement, not a schema
 * constraint.
 */
export type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6

const columnStyles: Record<ColumnCount, CSSMixinDescriptor> = {
  1: css({ gridTemplateColumns: "repeat(1, 1fr)" }),
  2: css({ gridTemplateColumns: "repeat(2, 1fr)" }),
  3: css({ gridTemplateColumns: "repeat(3, 1fr)" }),
  4: css({ gridTemplateColumns: "repeat(4, 1fr)" }),
  5: css({ gridTemplateColumns: "repeat(5, 1fr)" }),
  6: css({ gridTemplateColumns: "repeat(6, 1fr)" }),
}

export interface GridProps {
  /**
   * A step on the primitive space scale, applying to both axes. Defaults to
   * `0`, and its block renders either way — see `StackProps.gap`.
   */
  gap?: SpaceStep | undefined
  /**
   * Equal columns. Its block renders only when passed, so a bare Grid leaves
   * the track list entirely to the caller.
   *
   * There is no responsive mode. Auto-fit needs a track minimum for
   * `repeat(auto-fit, minmax(<min>, 1fr))`, and `schema.sizing` holds no
   * primitive for one — a caller-supplied length would be the single
   * open-ended value in a package built to have none. Deferred until such a
   * primitive exists rather than added now; meanwhile a responsive track list
   * goes through `mix`, which is reliable precisely because `cols` was not
   * passed.
   */
  cols?: ColumnCount | undefined
  /**
   * Adds properties Grid does not declare; it does not reliably override one
   * it does. `gap` always has a block, so it goes through its prop.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Grid(handle: Handle<GridProps>) {
  return () => {
    const { gap = 0, cols, mix, children } = handle.props
    return (
      <div mix={[gridBase, gaps[gap], cols === undefined ? undefined : columnStyles[cols], mix]}>
        {children}
      </div>
    )
  }
}
