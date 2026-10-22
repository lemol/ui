import type { css } from "remix/component"

type Styles = Parameters<typeof css>[0]

/**
 * The width under which a record's head is a phone's app bar: the width a
 * `TabBar` draws under, so the bar at the top and the tabs at the foot arrive
 * together. Not a token: a media condition cannot read `var()`.
 */
export const appBarBreakpoint = "48rem"

export const appBarMedia = `@media (width < ${appBarBreakpoint})`

/** Where a slot of the bar goes: the second row's start or end, or the first row's end. */
export type AppBarSlot = "status" | "controls" | "actions"

/** A block under a selector only known at the call, which a literal key cannot name. */
const under = (selector: string, rules: Styles): Styles => ({ [selector]: rules }) as Styles

/**
 * A phone's app bar, as a phone's own: the way back and the actions either
 * side of the title over its trail, then what the record is doing and the
 * controls for what the page shows on a row of their own.
 *
 * One rule set per element, for each element's own `css()` block under
 * `appBarMedia`, which is where a rule must sit to win: every block is its own
 * cascade layer, and a later layer beats a more specific selector. `AppBar`
 * spreads them so; a host that draws its own head (with motion of its own)
 * spreads them into its elements' blocks the same way.
 *
 * `stuck` is a selector for an ancestor marked while the bar sticks, as a
 * host that measures its head marks one: the title gives up its second line
 * and the second row folds away, so the bar over the page is one line of
 * title and its trail. A host that marks nothing keeps both. It must be an
 * attribute or class selector (`[data-…]`, `.…`): remix/component reads a
 * nested key that starts with anything else as a declaration, and drops it.
 */
export const appBarParts = (stuck: string) => ({
  /** The bar: clear of a notch or a status bar drawn over the page, edge to edge. */
  bar: {
    paddingBlockStart: "env(safe-area-inset-top)",
  } satisfies Styles,
  /** The bar's grid: back, title over subtitle, actions; then status and controls. */
  row: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
    gridTemplateAreas:
      '"back title title actions" "back subtitle subtitle actions" "status status controls controls"',
    alignItems: "center",
    columnGap: "var(--ui-appbar-gap)",
    rowGap: "0",
    paddingBlock: "var(--ui-appbar-pad-y)",
  } satisfies Styles,
  /** The way back: always in its place, a thumb's size, pressed in place. */
  back: {
    gridArea: "back",
    inlineSize: "var(--ui-appbar-back-size)",
    blockSize: "var(--ui-appbar-back-size)",
    marginBlock: "0",
    marginInline: "calc(var(--ui-appbar-back-inset) * -1) 0",
    borderRadius: "var(--ui-appbar-back-radius)",
    WebkitTapHighlightColor: "transparent",
    "&:active": { background: "var(--ui-appbar-back-bg-pressed)" },
  } satisfies Styles,
  /** The title at the body's size: the bar is chrome, the page under it the reading. */
  title: {
    gridArea: "title",
    margin: "0",
    fontSize: "var(--ui-appbar-title-size)",
    ...under(`${stuck} &`, { WebkitLineClamp: "1" }),
  } satisfies Styles,
  /** One dim line under the title: where the record sits. */
  subtitle: {
    gridArea: "subtitle",
    display: "block",
    minInlineSize: "0",
    margin: "0",
    overflow: "hidden",
    color: "var(--ui-appbar-subtitle-ink)",
    fontSize: "var(--ui-appbar-subtitle-size)",
    lineHeight: "var(--ui-appbar-subtitle-leading)",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  } satisfies Styles,
  /**
   * A slot, a cell of the bar and never wider than it: a long status gives way
   * to the controls beside it instead of running under them. The second row
   * takes a breath above it, and folds away once the bar sticks.
   */
  slot: (area: AppBarSlot): Styles => ({
    gridArea: area,
    display: "flex",
    alignItems: "center",
    gap: "var(--ui-appbar-slot-gap)",
    justifySelf: area === "status" ? "start" : "end",
    minInlineSize: "0",
    maxInlineSize: "100%",
    overflow: "hidden",
    ...(area === "actions"
      ? {}
      : {
          marginBlockStart: "var(--ui-appbar-pad-y)",
          ...under(`${stuck} &`, { display: "none" }),
        }),
  }),
})
