import { attrs, css, type Handle, type RemixNode } from "remix/component"

const inputStyle = css({
  width: "100%",
  paddingInline: "var(--ui-palette-input-pad-x)",
  paddingBlock: "var(--ui-palette-input-pad-y)",
  borderStyle: "solid",
  borderWidth: "var(--ui-palette-input-border-width)",
  borderColor: "var(--ui-palette-input-border)",
  borderRadius: "var(--ui-palette-input-radius)",
  fontSize: "var(--ui-palette-input-font-size)",
  fontFamily: "inherit",
})

const listStyle = css({
  display: "grid",
  gap: "var(--ui-palette-list-gap)",
  margin: 0,
  padding: 0,
  listStyle: "none",
})

const itemStyle = css({
  display: "block",
  width: "100%",
  borderStyle: "none",
  background: "transparent",
  textAlign: "start",
  textDecoration: "none",
  paddingInline: "var(--ui-palette-item-pad-x)",
  paddingBlock: "var(--ui-palette-item-pad-y)",
  borderRadius: "var(--ui-palette-item-radius)",
  color: "var(--ui-palette-item-ink)",
  fontFamily: "inherit",
  cursor: "pointer",
  "&:hover": { background: "var(--ui-palette-item-bg-hover)" },
})

export interface CommandPaletteInputProps {
  /** The `CommandPaletteList`'s id — this is what `--palette` filters. */
  listId: string
  placeholder?: string | undefined
}

/**
 * `command="--palette"` fires on every keystroke through the `input` bridge
 * in `runtime.ts` (native `command`/`commandfor` invokes only from a click),
 * filtering the list named by `commandfor`. With the runtime absent the
 * input is an inert text box and every item in the list stays visible —
 * there is nothing to type a filter into, not a broken filter.
 */
export function CommandPaletteInput(handle: Handle<CommandPaletteInputProps>) {
  return () => {
    const { listId, placeholder = "Type a command…" } = handle.props

    return (
      <input
        aria-controls={listId}
        autocomplete="off"
        // command/commandfor via attrs(), not as typed props: remix/component types
        // <input> against the Invoker Commands spec, which is button-only,
        // so a text input's command/commandfor — this package's own
        // convention, read by runtime.ts's input bridge — has no typed home.
        mix={[inputStyle, attrs({ command: "--palette", commandfor: listId })]}
        placeholder={placeholder}
        type="text"
      />
    )
  }
}

export interface CommandPaletteListProps {
  /** Must equal the `CommandPaletteInput`'s `listId` — nothing here mints the pair, so keep them in one place when composing. */
  id: string
  children?: RemixNode | undefined
}

export function CommandPaletteList(handle: Handle<CommandPaletteListProps>) {
  return () => {
    const { id, children } = handle.props

    return (
      <ul id={id} mix={listStyle}>
        {children}
      </ul>
    )
  }
}

export interface CommandPaletteItemProps {
  /** Required: `--palette` toggles `hidden` by id, so an item with none can never be matched back into view once hidden. */
  id: string
  /** The text `--palette` matches against, and the visible content when `children` is omitted. */
  label: string
  /** Extra matchable text — a shortcut, an alias — that need not appear in `label`. */
  keywords?: string | undefined
  href?: string | undefined
  children?: RemixNode | undefined
}

/**
 * A row, visible by default: `--palette` hides the ones a query does not
 * match, so a page rendered with the runtime absent shows every item.
 */
export function CommandPaletteItem(handle: Handle<CommandPaletteItemProps>) {
  return () => {
    const { id, label, keywords, href, children } = handle.props
    const content = children ?? label

    return (
      <li data-palette-keywords={keywords} data-palette-label={label} id={id}>
        {href !== undefined ? (
          <a href={href} mix={itemStyle}>
            {content}
          </a>
        ) : (
          <button mix={itemStyle} type="button">
            {content}
          </button>
        )}
      </li>
    )
  }
}
