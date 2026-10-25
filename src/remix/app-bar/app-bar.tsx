import { type Handle, type MixInput, type RemixNode } from "remix/component"
import { css } from "../css.ts"
import { appBarMedia, appBarParts } from "./app-bar.ts"

const parts = appBarParts("[data-app-bar-stuck]")

/** Over the page on the page's own ground, so the page scrolls under it, not through it. */
const barStyle = css({
  position: "sticky",
  insetBlockStart: "0",
  zIndex: "1",
  background: "var(--ui-appbar-bg)",
  [appBarMedia]: parts.bar,
})

/** One row on a wide screen: the way back, the title over its subtitle, then the slots. */
const rowStyle = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto auto auto",
  gridTemplateAreas: '"back title status controls actions" "back subtitle status controls actions"',
  alignItems: "center",
  columnGap: "var(--ui-appbar-gap)",
  paddingBlock: "var(--ui-appbar-pad-y)",
  [appBarMedia]: parts.row,
})

const backStyle = css({
  gridArea: "back",
  display: "inline-grid",
  placeItems: "center",
  inlineSize: "var(--ui-appbar-back-size)",
  blockSize: "var(--ui-appbar-back-size)",
  borderRadius: "var(--ui-appbar-back-radius)",
  color: "var(--ui-appbar-back-ink)",
  textDecoration: "none",
  "&:hover": { color: "var(--ui-appbar-back-ink-hover)" },
  [appBarMedia]: parts.back,
})

/**
 * Two lines at most, the rest behind an ellipsis, the whole in its `title`;
 * the two lines share the words, so the second never holds one alone.
 */
const titleStyle = css({
  gridArea: "title",
  minInlineSize: "0",
  margin: "0",
  fontSize: "var(--ui-appbar-title-size-wide)",
  fontWeight: "var(--ui-appbar-title-weight)",
  letterSpacing: "var(--ui-appbar-title-tracking)",
  lineHeight: "var(--ui-appbar-title-leading)",
  overflowWrap: "anywhere",
  textWrap: "balance",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: "2",
  overflow: "hidden",
  [appBarMedia]: parts.title,
})

const subtitleStyle = css({
  gridArea: "subtitle",
  margin: "0",
  color: "var(--ui-appbar-subtitle-ink)",
  fontSize: "var(--ui-appbar-subtitle-size)",
  lineHeight: "var(--ui-appbar-subtitle-leading)",
  [appBarMedia]: parts.subtitle,
})

const slotStyle = (area: "status" | "controls" | "actions") =>
  css({
    gridArea: area,
    display: "flex",
    alignItems: "center",
    gap: "var(--ui-appbar-slot-gap)",
    [appBarMedia]: parts.slot(area),
  })

const statusStyle = slotStyle("status")
const controlsStyle = slotStyle("controls")
const actionsStyle = slotStyle("actions")

/** A chevron pointing back, drawn in the text's colour: what a phone's own bar shows. */
const chevron = (
  <svg aria-hidden="true" fill="none" height="1.25em" viewBox="0 0 20 20" width="1.25em">
    <path
      d="M12.5 4.5 7 10l5.5 5.5"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
    />
  </svg>
)

export interface AppBarBack {
  /** The record's parent: one level up, never the browser's history. */
  readonly href: string
  /** Its name, read as "Back to {label}". */
  readonly label: string
  /** The glyph, when the app draws its own; a chevron otherwise. */
  readonly icon?: RemixNode | undefined
}

export interface AppBarProps {
  /** A record's head always has a way back, as a phone's pushed screen does. */
  readonly back: AppBarBack
  readonly title: string
  /** The `h1`'s id, for the page's `aria-labelledby`. */
  readonly titleId?: string | undefined
  /** One dim line under the title: where the record sits ("acme / L32"). */
  readonly subtitle?: string | undefined
  /** What the record is doing: the second row's start on a phone. */
  readonly status?: RemixNode | undefined
  /** Controls for what the page shows, a view switch: the second row's end on a phone. */
  readonly controls?: RemixNode | undefined
  /** The record's actions, a `⋯` menu: the bar's end. */
  readonly actions?: RemixNode | undefined
  readonly mix?: MixInput<HTMLElement> | undefined
}

/**
 * A record's head: the way back, the title over where it sits, what it is
 * doing, the controls for what the page shows and its actions. On a wide
 * screen one row; below `appBarBreakpoint` a phone's app bar (`appBarParts`):
 * back and the actions either side of the title, the status and controls on
 * a row of their own. It sticks over the page. A host that marks an ancestor
 * `data-app-bar-stuck` while it sticks folds the second row and the title's
 * second line away; one that marks nothing keeps both.
 */
export function AppBar(handle: Handle<AppBarProps>) {
  return () => {
    const { back, title, titleId, subtitle, status, controls, actions, mix } = handle.props

    return (
      <header data-app-bar="" mix={[barStyle, mix]}>
        <div mix={rowStyle}>
          <a
            aria-label={`Back to ${back.label}`}
            data-app-bar-back=""
            href={back.href}
            mix={backStyle}
            title={`Back to ${back.label}`}
          >
            {back.icon ?? chevron}
          </a>
          <h1 id={titleId} mix={titleStyle} title={title}>
            {title}
          </h1>
          {subtitle === undefined ? null : <p mix={subtitleStyle}>{subtitle}</p>}
          {status === undefined ? null : <div mix={statusStyle}>{status}</div>}
          {controls === undefined ? null : <div mix={controlsStyle}>{controls}</div>}
          {actions === undefined ? null : <div mix={actionsStyle}>{actions}</div>}
        </div>
      </header>
    )
  }
}
