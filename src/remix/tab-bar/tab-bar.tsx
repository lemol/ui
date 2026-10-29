import { type Handle, type MixInput, type RemixNode } from "remix/component"
import { css } from "../css.ts"
import { pop } from "../motion/motion.ts"

/**
 * Below this width a tab bar draws; above it the landmark leaves the page
 * whole, for a sidebar's navigation to be the one a screen reader finds.
 */
export const tabBarBreakpoint = "48rem"

const narrow = `@media (width < ${tabBarBreakpoint})`

/** A count on a mark: what waits behind a destination. */
export interface TabBarBadge {
  readonly count: number
  /** The count as a screen reader hears it after the destination: "3 waiting on you". */
  readonly label: string
  /** `attention` spends the accent, the colour that means a person is needed. */
  readonly tone?: "neutral" | "attention" | undefined
}

export interface TabBarItem {
  /** Written as `data-tab-bar-item`, for a host to style or find the item by. */
  readonly key: string
  readonly label: string
  readonly icon: RemixNode
  /** A destination: the item is a link to it. */
  readonly href?: string | undefined
  /** Or what the item opens, a popover's id (a sheet such as *More*): the item is a button. */
  readonly popoverTarget?: string | undefined
  readonly current?: boolean | undefined
  /** A count at the mark's top end; zero draws nothing. */
  readonly badge?: TabBarBadge | undefined
  /** A dot at the mark's top end, and what it means, for a screen reader: "a notice". */
  readonly dot?: string | undefined
  readonly attrs?: Readonly<Record<string, string>> | undefined
}

export interface TabBarProps {
  /** The landmark's name: "Main". */
  readonly label: string
  readonly items: ReadonlyArray<TabBarItem>
  readonly mix?: MixInput<HTMLElement> | undefined
}

/** The landmark draws on a narrow screen only; it leaves a wide one whole. */
const navStyle = css({
  display: "none",
  [narrow]: { display: "block" },
})

/** One row, an equal cell a destination, as tall as a thumb's tap. */
const barStyle = css({
  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "minmax(0, 1fr)",
  alignItems: "stretch",
  inlineSize: "100%",
  blockSize: "var(--ui-tabbar-height)",
  margin: "0",
  padding: "0",
  listStyle: "none",
})

/**
 * A destination: its mark over its name, the whole cell the target. A host
 * that marks the pressed item `data-pending` while it navigates, and an
 * ancestor `data-navigating`, moves the pill at once and the page follows.
 */
const itemStyle = css({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0",
  inlineSize: "100%",
  blockSize: "100%",
  padding: "0",
  border: "none",
  background: "transparent",
  color: "var(--ui-tabbar-ink)",
  font: "inherit",
  fontSize: "var(--ui-tabbar-label-size)",
  fontWeight: "var(--ui-tabbar-label-weight)",
  lineHeight: "var(--ui-tabbar-label-leading)",
  textDecoration: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  "&[aria-current], &[data-pending]": {
    color: "var(--ui-tabbar-ink-current)",
    fontWeight: "var(--ui-tabbar-label-weight-current)",
  },
  "&:active [data-tab-bar-mark]": { background: "var(--ui-tabbar-mark-bg-pressed)" },
  "&[aria-current] [data-tab-bar-mark], &[data-pending] [data-tab-bar-mark]": {
    background: "var(--ui-tabbar-mark-bg-current)",
    color: "var(--ui-tabbar-mark-ink-current)",
  },
  "[data-navigating] &[aria-current]:not([data-pending])": {
    color: "var(--ui-tabbar-ink)",
    fontWeight: "var(--ui-tabbar-label-weight)",
  },
  "[data-navigating] &[aria-current]:not([data-pending]) [data-tab-bar-mark]": {
    background: "transparent",
    color: "inherit",
  },
})

/** The mark's pill: what a current destination's mark sits on. */
const markStyle = css({
  position: "relative",
  display: "inline-grid",
  placeItems: "center",
  inlineSize: "var(--ui-tabbar-mark-w)",
  blockSize: "var(--ui-tabbar-mark-h)",
  borderRadius: "var(--ui-tabbar-mark-radius)",
  fontSize: "var(--ui-tabbar-mark-size)",
  transitionProperty: "background, color",
  transitionDuration: "var(--ui-tabbar-duration)",
  transitionTimingFunction: "var(--ui-tabbar-easing)",
})

/**
 * A count past the icon's centre, risen over the pill's top edge, as a phone's
 * own tab bars draw one: it grows away from the icon, never over it.
 */
const badgeStyle = css({
  position: "absolute",
  insetBlockStart: "calc(var(--ui-tabbar-badge-lift) * -1)",
  insetInlineStart: "50%",
  marginInlineStart: "var(--ui-tabbar-badge-nudge)",
  display: "inline-grid",
  placeItems: "center",
  minInlineSize: "var(--ui-tabbar-badge-size)",
  blockSize: "var(--ui-tabbar-badge-size)",
  paddingInline: "var(--ui-tabbar-badge-pad-x)",
  borderRadius: "var(--ui-tabbar-badge-radius)",
  background: "var(--ui-tabbar-badge-bg)",
  color: "var(--ui-tabbar-badge-ink)",
  fontSize: "var(--ui-tabbar-badge-font-size)",
  fontWeight: "var(--ui-tabbar-badge-font-weight)",
  fontVariantNumeric: "tabular-nums",
  lineHeight: "1",
  "&[data-tone=attention]": {
    background: "var(--ui-tabbar-badge-attention-bg)",
    color: "var(--ui-tabbar-badge-attention-ink)",
  },
})

/** A dot where a count would start, level with the pill's top edge. */
const dotStyle = css({
  position: "absolute",
  insetBlockStart: "var(--ui-tabbar-dot-top)",
  insetInlineStart: "50%",
  marginInlineStart: "var(--ui-tabbar-badge-nudge)",
  inlineSize: "var(--ui-tabbar-dot-size)",
  blockSize: "var(--ui-tabbar-dot-size)",
  borderRadius: "var(--ui-tabbar-badge-radius)",
  background: "var(--ui-tabbar-dot)",
})

/** Read, not seen: the badge's and the dot's meaning after the destination's name. */
const readStyle = css({
  position: "absolute",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  inlineSize: "1px",
  blockSize: "1px",
  overflow: "hidden",
})

/**
 * The count's and the dot's insertion pop, on the shared `ui-motion-pop`
 * keyframes. One tuple mixed onto both spans: two consumers sharing one
 * keyframes block is safe, because a keyframe body names no token.
 */
const badgePop = pop({
  duration: "var(--ui-tabbar-badge-pop-duration)",
  easing: "var(--ui-tabbar-badge-pop-easing)",
})

function Item(handle: Handle<{ readonly item: TabBarItem }>) {
  return () => {
    const { item } = handle.props
    const badge = item.badge === undefined || item.badge.count <= 0 ? undefined : item.badge

    const body = (
      <>
        <span data-tab-bar-mark="" mix={markStyle}>
          {item.icon}
          {badge === undefined ? null : (
            <span
              aria-hidden="true"
              data-tone={badge.tone ?? "neutral"}
              mix={[badgeStyle, badgePop]}
            >
              {badge.count > 99 ? "99+" : badge.count}
            </span>
          )}
          {item.dot === undefined ? null : <span aria-hidden="true" mix={[dotStyle, badgePop]} />}
        </span>
        {item.label}
        {badge === undefined ? null : <span mix={readStyle}>, {badge.label}</span>}
        {item.dot === undefined ? null : <span mix={readStyle}>, {item.dot}</span>}
      </>
    )

    return item.href === undefined ? (
      <button
        {...item.attrs}
        aria-current={item.current === true ? "page" : undefined}
        data-tab-bar-item={item.key}
        mix={itemStyle}
        popoverTarget={item.popoverTarget}
        type="button"
      >
        {body}
      </button>
    ) : (
      <a
        {...item.attrs}
        aria-current={item.current === true ? "page" : undefined}
        data-tab-bar-item={item.key}
        href={item.href}
        mix={itemStyle}
      >
        {body}
      </a>
    )
  }
}

/**
 * A phone's bottom navigation: the app's few destinations, each its mark over
 * its name, and an item that opens a sheet for the rest (*More*). Links and
 * one popover button, so it works with no script. It draws the bar and
 * nothing around it: where the bar stands (a sticky foot, padded above the
 * home indicator with `env(safe-area-inset-bottom)`) is the frame's.
 */
export function TabBar(handle: Handle<TabBarProps>) {
  return () => {
    const { label, items, mix } = handle.props

    return (
      <nav aria-label={label} data-tab-bar="" mix={[navStyle, mix]}>
        <ul mix={barStyle}>
          {items.map((item) => (
            <li key={item.key}>
              <Item item={item} />
            </li>
          ))}
        </ul>
      </nav>
    )
  }
}
