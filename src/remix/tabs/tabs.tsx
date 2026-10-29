import {
  type CSSMixinDescriptor,
  type Handle,
  type MixInput,
  type RemixNode,
} from "remix/component"
import { css } from "../css.ts"
import { viewTransitionName } from "../motion/names.ts"

/**
 * Tabs as route links, not in-page panels (interactivity.md, "Not in
 * scope"): each tab is an `<a>` to its own URL, the current one carries
 * `aria-current="page"`, and the server knows which that is when it renders.
 * No client state, so a tab works before hydration and survives a reload.
 *
 * A tab with no target yet is a dim `<span>` in its place rather than a link
 * marked disabled: `aria-disabled` on an anchor does not stop it navigating,
 * which is `LinkButton`'s reasoning.
 */
export type TabsVariant = "line" | "pill"

export interface TabItem {
  /** The list key; the href is used when it is absent. */
  readonly key?: string | undefined
  readonly label: RemixNode
  readonly href: string
  readonly current?: boolean | undefined
  /** A drawn mark before the label, hidden from assistive technology by the caller. */
  readonly icon?: RemixNode | undefined
  /** Short, after the label: a count, `+107 −5`. */
  readonly meta?: RemixNode | undefined
  /** Shown dim in its place, not as a link: a view with nothing to show yet. */
  readonly disabled?: boolean | undefined
  /** Hooks on the tab, such as `data-view`, for tests and keyboard maps. */
  readonly attrs?: Readonly<Record<string, string>> | undefined
}

/**
 * The strip and every tab in it, whichever the look. The strip scrolls
 * sideways rather than wrapping, so a narrow pane keeps one row of tabs, and
 * draws no scrollbar for it.
 *
 * `overflow-x: auto` turns `overflow-y` to `auto` too, so the strip clips at
 * its padding box on every side, and the reset draws the focus ring outside a
 * tab's edge, where that clip cuts it. A tab draws the same ring inside its
 * edge instead, offset inward by the ring's width. Leaving the ring room
 * outside would take padding and an equal negative margin on the strip, and a
 * margin is what a caller's `mix` is for.
 */
const tabsBase = css({
  display: "flex",
  alignItems: "stretch",
  gap: "var(--ui-tabs-gap)",
  minInlineSize: "0",
  overflowX: "auto",
  scrollbarWidth: "none",
  "& > *": {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--ui-tabs-item-gap)",
    blockSize: "var(--ui-tabs-height)",
    paddingInline: "var(--ui-tabs-pad-x)",
    fontSize: "var(--ui-tabs-font-size)",
    fontWeight: "var(--ui-tabs-font-weight)",
    color: "var(--ui-tabs-ink)",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionProperty: "color, background, border-color, box-shadow",
    transitionDuration: "var(--ui-tabs-transition-duration)",
    transitionTimingFunction: "var(--ui-tabs-transition-easing)",
  },
  "& > a:hover": { color: "var(--ui-tabs-ink-hover)" },
  "& > [aria-current]": { color: "var(--ui-tabs-ink-current)" },
  "& > [aria-disabled]": { color: "var(--ui-tabs-ink-disabled)", cursor: "default" },
  "& > :focus-visible": { outlineOffset: "calc(var(--ui-tabs-ring-inset) * -1)" },
})

/**
 * Each look in a block of its own, property-disjoint from `tabsBase`: the
 * strip's rule or track, and the tab's indicator or raised fill. Neither
 * declares a property `tabsBase` declares, so sub-layer order never decides
 * which paints.
 *
 * The `line` rule is an inset shadow on the strip, not its border. No tab can
 * paint over the border of the strip that clips it: pulled across with a
 * negative margin, a tab is clipped there instead, half its indicator lost,
 * and the strip scrolls by the rule's width. The shadow is painted inside,
 * under the tabs, so the current tab's indicator covers it.
 */
const variantStyles: Record<TabsVariant, CSSMixinDescriptor> = {
  line: css({
    boxShadow: "inset 0 calc(var(--ui-tabs-rule-width) * -1) 0 var(--ui-tabs-rule)",
    "& > *": {
      borderBlockEndStyle: "solid",
      borderBlockEndWidth: "var(--ui-tabs-indicator-width)",
      borderBlockEndColor: "transparent",
    },
    "& > [aria-current]": { borderBlockEndColor: "var(--ui-tabs-indicator)" },
  }),
  pill: css({
    inlineSize: "fit-content",
    maxInlineSize: "100%",
    padding: "var(--ui-tabs-track-pad)",
    borderRadius: "var(--ui-tabs-track-radius)",
    background: "var(--ui-tabs-track-bg)",
    "& > *": { borderRadius: "var(--ui-tabs-tab-radius)" },
    "& > [aria-current]": {
      background: "var(--ui-tabs-current-bg)",
      boxShadow: "var(--ui-tabs-current-shadow)",
    },
  }),
}

export interface TabsProps {
  /** The landmark's name: *Views*, *Settings sections*. */
  readonly label: string
  readonly items: ReadonlyArray<TabItem>
  /** `line` by default: under a page's title. `pill` for a compact switch. */
  readonly variant?: TabsVariant | undefined
  /**
   * An id stem scoping the current tab's `view-transition-name` for a morph:
   * the current tab carries `view-transition-name: <name>--indicator`.
   * Absent means no name and today's instant switch. Inert until a caller
   * exists: tab switching is full document navigation, and no same-document
   * `startViewTransition` caller ships in M5.
   */
  readonly name?: string | undefined
  /**
   * Adds properties Tabs does not declare — a margin, a grid placement. It
   * does not reliably override one Tabs declares; set its `--ui-tabs-*` token.
   */
  readonly mix?: MixInput<HTMLElement> | undefined
}

export function Tabs(handle: Handle<TabsProps>) {
  return () => {
    const { label, items, variant = "line", name, mix } = handle.props
    const indicator =
      name === undefined
        ? undefined
        : `view-transition-name: ${viewTransitionName(name, "indicator")}`

    return (
      <nav aria-label={label} mix={[tabsBase, variantStyles[variant], mix]}>
        {items.map((item) => {
          const content = (
            <>
              {item.icon}
              <span>{item.label}</span>
              {item.meta}
            </>
          )

          return item.disabled === true ? (
            <span key={item.key ?? item.href} {...item.attrs} aria-disabled="true">
              {content}
            </span>
          ) : (
            <a
              key={item.key ?? item.href}
              {...item.attrs}
              aria-current={item.current === true ? "page" : undefined}
              href={item.href}
              style={item.current === true ? indicator : undefined}
            >
              {content}
            </a>
          )
        })}
      </nav>
    )
  }
}
