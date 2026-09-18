import { type CSSMixinDescriptor, css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { type Align, alignStyles } from "../align.ts"
import { gaps, type SpaceStep } from "../space.ts"

/**
 * Row declares no tokens of its own. Every value it emits is a structural
 * keyword or a primitive the caller chose from the space scale, and
 * row.test.tsx fails on a `--ui-` anywhere in its output.
 */
const rowBase = css({
  display: "flex",
})

/**
 * Short names for the main-axis keywords. `between` rather than
 * `space-between` because the `space-` prefix says nothing a caller choosing
 * between six values needs, and the mapping is one table checked by a test.
 */
export type Justify = "start" | "center" | "end" | "between" | "around" | "evenly"

const justifyStyles: Record<Justify, CSSMixinDescriptor> = {
  start: css({ justifyContent: "start" }),
  center: css({ justifyContent: "center" }),
  end: css({ justifyContent: "end" }),
  between: css({ justifyContent: "space-between" }),
  around: css({ justifyContent: "space-around" }),
  evenly: css({ justifyContent: "space-evenly" }),
}

/** Its own block, so a Row that does not wrap declares no `flex-wrap` at all. */
const wrapStyle = css({ flexWrap: "wrap" })

export interface RowProps {
  /**
   * A step on the primitive space scale: `gap={3}` is `var(--sp-3)`. Defaults
   * to `0`, and its block renders either way — see `StackProps.gap`.
   */
  gap?: SpaceStep | undefined
  /**
   * Cross-axis alignment, defaulting to `center`.
   *
   * This is the one presumption these components make, and unlike `gap` it is
   * worth making: items of unequal height stretched to match is a bug in
   * almost every horizontal row, and centring is right in almost every one.
   * Because it has a default, the block always renders — so to change it,
   * pass the prop rather than reaching for `mix`.
   */
  align?: Align | undefined
  /**
   * Main-axis distribution. Its block renders only when passed, so a Row
   * without it declares no `justify-content` and a caller's own is reliable
   * through `mix`.
   */
  justify?: Justify | undefined
  /** Allows wrapping. Its block renders only when true. */
  wrap?: boolean | undefined
  /**
   * Adds properties Row does not declare; it does not reliably override one
   * it does. `gap` and `align` always have a block, so those two go through
   * their props. `justify` and `wrap` are yours through `mix` as long as you
   * do not also pass the prop.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

export function Row(handle: Handle<RowProps>) {
  return () => {
    const { gap = 0, align = "center", justify, wrap, mix, children } = handle.props
    return (
      <div
        mix={[
          rowBase,
          gaps[gap],
          alignStyles[align],
          justify === undefined ? undefined : justifyStyles[justify],
          wrap ? wrapStyle : undefined,
          mix,
        ]}
      >
        {children}
      </div>
    )
  }
}
