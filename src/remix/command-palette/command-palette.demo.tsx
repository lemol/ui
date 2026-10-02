import { css } from "remix/component"
import { overlay } from "../dialog/overlay.tsx"
import { Text } from "../text/text.tsx"
import { CommandPaletteInput, CommandPaletteItem, CommandPaletteList } from "./command-palette.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const Palette = overlay("command-palette")
const listId = "command-palette-list"

export function CommandPaletteDemo() {
  return () => (
    <>
      <p mix={label}>
        commandpalette: --palette filters a server-rendered list, the match rule is a pure function
      </p>
      <Palette.Trigger tone="neutral">Open command palette</Palette.Trigger>
      <Palette.Dialog title="Command Palette">
        <CommandPaletteInput listId={listId} />
        <CommandPaletteList id={listId}>
          <CommandPaletteItem href="#new-task" id="cmd-new-task" label="New task" />
          <CommandPaletteItem href="#new-project" id="cmd-new-project" label="New project" />
          <CommandPaletteItem
            href="#settings"
            id="cmd-settings"
            keywords="preferences config"
            label="Settings"
          />
          <CommandPaletteItem href="#sign-out" id="cmd-sign-out" label="Sign out" />
        </CommandPaletteList>
        <Text tone="muted">
          Typing filters the list once hydrated. With the runtime absent every item stays visible.
        </Text>
      </Palette.Dialog>
    </>
  )
}
