import { css } from "remix/component"
import { MenuItem, MenuSeparator, menu } from "./menu.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const View = menu("view-menu")

export function MenuDemo() {
  return () => (
    <>
      <p mix={label}>menu: a list of role="menuitem" rows over a native popover</p>
      <View.Trigger tone="neutral">View</View.Trigger>
      <View.List>
        <MenuItem href="#word-wrap">Word wrap</MenuItem>
        <MenuItem href="#minimap">Minimap</MenuItem>
        <MenuSeparator />
        <MenuItem disabled>Zoom in</MenuItem>
        <MenuItem disabled>Zoom out</MenuItem>
      </View.List>
    </>
  )
}
