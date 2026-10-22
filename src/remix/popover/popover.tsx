import { css, type Handle, type MixInput, type RemixNode } from "remix/component"
import { Button, type ButtonProps } from "../button/button.tsx"
import { invoke } from "../invocation.ts"
import { sheetMedia, sheetRules } from "../sheet/sheet.ts"

const duration = "var(--ui-popover-transition-duration)"
const timing = `${duration} var(--ui-popover-transition-easing)`
const offset = "0 calc(var(--ui-popover-enter-offset) * -1)"

/**
 * The surface's shell, its entry/exit and its anchor positioning — all
 * inert until the platform opts in.
 *
 * `display` is declared only inside `&:popover-open`, for the same reason
 * Dialog's panel declares it only inside `&[open]`: per docs/motion.md a
 * closed popover is `display: none` from the user-agent sheet, and any
 * unconditional author declaration beats that.
 *
 * The `transition` shorthand is declared twice, per docs/motion.md and
 * exactly as Dialog's panel does: the first keeps `opacity`/`translate`
 * moving where `transition-behavior` is unknown, the nested `&` block
 * upgrades it where it is — a JS object cannot hold `transition` twice, and
 * where `allow-discrete` fails to parse the whole declaration is dropped,
 * leaving the first.
 *
 * The `@supports (anchor-name: --a)` block is the whole anchor-positioning
 * story: unsupported, the popover keeps the UA default
 * (`position: fixed; inset: 0; margin: auto`), which is already the
 * "centered popover" degradation the M2 plan calls for, so there is nothing
 * else to write for that path.
 *
 * A sheet's rules come last, after the anchor's, so under `sheetBreakpoint`
 * they win the placement by source order: docked to the bottom edge instead
 * of hanging off the trigger.
 */
const surfaceStyle = (anchorName: string, sheet: boolean) =>
  css({
    maxInlineSize:
      "min(var(--ui-popover-max-inline-size), calc(100% - var(--ui-popover-anchor-gap) * 2))",
    padding: "var(--ui-popover-pad)",
    gap: "var(--ui-popover-gap)",
    background: "var(--ui-popover-bg)",
    color: "var(--ui-popover-ink)",
    borderStyle: "solid",
    borderWidth: "var(--ui-popover-border-width)",
    borderColor: "var(--ui-popover-border)",
    borderRadius: "var(--ui-popover-radius)",
    boxShadow: "var(--ui-popover-shadow)",
    opacity: 0,
    translate: offset,
    transition: `opacity ${timing}, translate ${timing}`,
    "&": {
      transition: `opacity ${timing}, translate ${timing}, overlay ${duration} allow-discrete, display ${duration} allow-discrete`,
    },
    "&:popover-open": {
      display: "grid",
      opacity: 1,
      translate: "0",
    },
    "@starting-style": {
      "&:popover-open": { opacity: 0, translate: offset },
    },
    "@supports (anchor-name: --a)": {
      positionAnchor: anchorName,
      positionArea: "var(--ui-popover-position-area)",
      margin: "var(--ui-popover-anchor-gap) 0 0 0",
    },
    ...(sheet ? { [sheetMedia]: sheetRules("&:popover-open", "var(--ui-popover-pad)") } : {}),
  })

/** Sets the anchor the surface positions against. Inert without anchor support. */
const anchorStyle = (anchorName: string) =>
  css({
    "@supports (anchor-name: --a)": { anchorName },
  })

export type PopoverTriggerProps = Omit<ButtonProps, "invoke">

export interface PopoverSurfaceProps {
  mix?: MixInput<HTMLElement> | undefined
  children?: RemixNode | undefined
}

export interface PopoverOptions {
  /**
   * Becomes a sheet on a narrow screen: docked to the bottom edge, the
   * screen's width, rather than hanging off its trigger. For a list a thumb
   * chooses from — a menu, a set of choices — not for a note that reads
   * best beside what it is about.
   */
  readonly sheet?: boolean | undefined
}

export interface Popover {
  /** The minted id, for an `aria-controls` a caller needs to write. */
  readonly id: string
  readonly Trigger: (handle: Handle<PopoverTriggerProps>) => () => RemixNode
  readonly Surface: (handle: Handle<PopoverSurfaceProps>) => () => RemixNode
}

/**
 * Mints an id and an anchor name and binds a trigger/surface pair to both, so
 * neither is a string a caller could mistype — same reasoning as `overlay()`.
 *
 * ```tsx
 * const Menu = popover("account-menu")
 *
 * <Menu.Trigger>Account</Menu.Trigger>
 * <Menu.Surface>…</Menu.Surface>
 * ```
 *
 * `name` is used verbatim as the id, exactly as `overlay()` uses its name —
 * no sanitising, so two popovers sharing a name is a duplicate-id bug rather
 * than a silently rewritten one.
 */
export function popover(name: string, options: PopoverOptions = {}): Popover {
  const toggle = invoke("toggle-popover", name)
  const sheet = options.sheet === true
  const anchorName = `--ui-popover-anchor-${name}`

  function Trigger(handle: Handle<PopoverTriggerProps>) {
    return () => (
      <Button {...handle.props} invoke={toggle} mix={[anchorStyle(anchorName), handle.props.mix]} />
    )
  }

  function Surface(handle: Handle<PopoverSurfaceProps>) {
    return () => {
      const { mix, children } = handle.props

      return (
        <div
          data-sheet={sheet ? "" : undefined}
          id={name}
          mix={[surfaceStyle(anchorName, sheet), mix]}
          popover="auto"
        >
          {children}
        </div>
      )
    }
  }

  return { id: name, Trigger, Surface }
}
