import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"
import { type PopoverTriggerProps, popover } from "../popover/popover.tsx"

/**
 * `remix/ui/menu` ships a composed `Menu` for the same idea, and it was
 * checked before writing this. It was not reused: its popover is a JS
 * `Context`-driven surface (`menu.popover()`), opened and closed entirely by
 * script, not `[popover]` plus `command="toggle-popover"`. Building on it
 * would mean a menu that does not open before hydration — the exact
 * regression the native-first ladder in the M2 plan exists to prevent — in
 * exchange for a keyboard model this package's fixed six hand-written
 * behaviours (see `runtime.ts`) do not budget for either. So `Menu` here is
 * `Popover` with `role="menu"` and a list of `role="menuitem"` rows: fully
 * reachable by `Tab` with the runtime absent, and left at that rather than
 * adding a seventh hand-written command for roving tabindex.
 */
const listStyle = css({
  display: "grid",
  minInlineSize: "var(--ui-menu-min-inline-size)",
})

const itemBase = css({
  display: "flex",
  alignItems: "center",
  gap: "var(--ui-menu-item-gap)",
  width: "100%",
  borderStyle: "none",
  background: "transparent",
  textAlign: "start",
  paddingInline: "var(--ui-menu-item-pad-x)",
  paddingBlock: "var(--ui-menu-item-pad-y)",
  borderRadius: "var(--ui-menu-item-radius)",
  fontFamily: "inherit",
  fontSize: "var(--ui-menu-item-font-size)",
  color: "var(--ui-menu-item-ink)",
  textDecoration: "none",
  cursor: "pointer",
  "&:hover:not(:disabled)": { background: "var(--ui-menu-item-bg-hover)" },
  "&:disabled": {
    color: "var(--ui-menu-item-disabled-ink)",
    cursor: "not-allowed",
  },
})

const separatorStyle = css({
  borderStyle: "none",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "1px",
  borderBlockStartColor: "var(--ui-menu-separator-color)",
  marginBlock: "var(--ui-menu-separator-margin)",
})

export type MenuTriggerProps = PopoverTriggerProps

export interface MenuListProps {
  mix?: MixInput<HTMLElement> | undefined
  children?: RemixNode | undefined
}

export interface MenuItemProps {
  href?: string | undefined
  disabled?: boolean | undefined
  mix?: MixInput<HTMLElement> | undefined
  children?: RemixNode | undefined
}

export interface Menu {
  readonly id: string
  readonly Trigger: (handle: Handle<MenuTriggerProps>) => () => RemixNode
  readonly List: (handle: Handle<MenuListProps>) => () => RemixNode
}

/**
 * Mints a `Popover` and gives its surface `role="menu"`. `MenuItem` and
 * `MenuSeparator` are the row components rendered inside `List`.
 *
 * The trigger is `Popover`'s own, unwrapped: `Button` renders a fixed set of
 * attributes (see `button.tsx`) and forwards no arbitrary ones, so there is
 * nowhere to attach `aria-haspopup` without forking it. A native `<button>`
 * opening a `role="menu"` surface communicates the relationship well enough
 * without it.
 *
 * ```tsx
 * const View = menu("view-menu")
 *
 * <View.Trigger>View</View.Trigger>
 * <View.List>
 *   <MenuItem href="/wrap">Word wrap</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem disabled>Minimap</MenuItem>
 * </View.List>
 * ```
 */
export function menu(name: string): Menu {
  const base = popover(name)

  function List(handle: Handle<MenuListProps>) {
    return () => {
      const { mix, children } = handle.props
      return (
        <base.Surface>
          <div mix={[listStyle, mix]} role="menu">
            {children}
          </div>
        </base.Surface>
      )
    }
  }

  return { id: base.id, Trigger: base.Trigger, List }
}

/** A plain link/button row inside a `Menu.List`. Reads Popover's surface tokens plus its own. */
export function MenuItem(handle: Handle<MenuItemProps>) {
  return () => {
    const { href, disabled, mix, children } = handle.props
    if (href !== undefined) {
      return (
        <a href={href} mix={[itemBase, mix]} role="menuitem">
          {children}
        </a>
      )
    }
    return (
      <button disabled={disabled} mix={[itemBase, mix]} role="menuitem" type="button">
        {children}
      </button>
    )
  }
}

export function MenuSeparator(): () => RemixNode {
  return () => <hr mix={separatorStyle} />
}
