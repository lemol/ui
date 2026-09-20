import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"

/**
 * Hides the platform marker on every engine, including the two that ignore
 * `list-style` on `<summary>`: `::-webkit-details-marker` (Chromium, Safari)
 * and `::marker` (Firefox). A component drawing its own chevron has to beat
 * both, or one browser doubles up.
 */
const detailsStyle = css({
  borderStyle: "solid",
  borderWidth: "var(--ui-disclosure-border-width)",
  borderColor: "var(--ui-disclosure-border)",
  borderRadius: "var(--ui-disclosure-radius)",
})

const summaryStyle = css({
  // `display: flex` alone drops the native triangle on the engines that draw
  // it through `::marker` (Chromium, Firefox) because that marker only
  // exists for a `display: list-item` box. Safari draws it through the
  // separate `::-webkit-details-marker` pseudo instead, which `display` does
  // not reach, so it needs its own rule below.
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--ui-disclosure-summary-gap)",
  paddingInline: "var(--ui-disclosure-summary-pad-x)",
  paddingBlock: "var(--ui-disclosure-summary-pad-y)",
  fontWeight: "var(--ui-disclosure-summary-font-weight)",
  cursor: "pointer",
  "&::-webkit-details-marker": { display: "none" },
  "&:hover": { background: "var(--ui-disclosure-summary-bg-hover)" },
})

/**
 * Rotated by the parent's `[open]` state, not by a class this component would
 * have to toggle with script — a plain descendant selector the platform
 * keeps in sync for free.
 */
const markerStyle = css({
  inlineSize: "var(--ui-disclosure-marker-size)",
  blockSize: "var(--ui-disclosure-marker-size)",
  flexShrink: 0,
  rotate: "0deg",
  transitionProperty: "rotate",
  transitionDuration: "var(--ui-disclosure-marker-transition-duration)",
  transitionTimingFunction: "var(--ui-disclosure-marker-transition-easing)",
  // A key naming a nested rule has to start with "&", "@", ":", "[" or "." for
  // remix/ui's css() to treat it as a selector rather than a declaration —
  // "details[open] &" fails that and silently renders as [object Object]. The
  // `:where(...)` wrapper is the shortest fix: zero specificity, valid CSS
  // nesting, and it starts with ":".
  ":where(details[open]) &": { rotate: "90deg" },
})

const contentStyle = css({
  paddingInline: "var(--ui-disclosure-content-pad-x)",
  paddingBlock: "var(--ui-disclosure-content-pad-y)",
})

export interface DisclosureProps {
  summary: RemixNode
  /** Uncontrolled initial state — this is a `<details>`, not a controlled component. */
  open?: boolean | undefined
  /**
   * Groups this disclosure with every other one sharing the same name into a
   * single-open accordion — the platform's own mutual exclusion, native since
   * Baseline 2023. Omit it for a standalone disclosure.
   */
  name?: string | undefined
  mix?: MixInput<HTMLDetailsElement> | undefined
  children?: RemixNode | undefined
}

export function Disclosure(handle: Handle<DisclosureProps>) {
  return () => {
    const { summary, open, name, mix, children } = handle.props
    return (
      <details mix={[detailsStyle, mix]} name={name} open={open}>
        <summary mix={summaryStyle}>
          {summary}
          <svg aria-hidden="true" fill="none" mix={markerStyle} viewBox="0 0 12 12">
            <path
              d="M4 2L9 6L4 10"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.5"
            />
          </svg>
        </summary>
        <div mix={contentStyle}>{children}</div>
      </details>
    )
  }
}

export interface AccordionItem {
  /** Required: `<details name>` groups by exact string match, so this is what keeps two accordions apart on one page. */
  id: string
  summary: RemixNode
  open?: boolean | undefined
  children?: RemixNode | undefined
}

export interface AccordionProps {
  /** The shared `name` every item renders with. Required, not minted: two `Accordion`s on one page must use two different values, and there is nothing here for a factory to bind that to. */
  name: string
  items: readonly AccordionItem[]
}

/**
 * `Disclosure` items sharing one `name`, so only one opens at a time — with
 * no script. Takes data rather than raw `Disclosure` children because
 * nothing in this layer can inject a shared prop into arbitrary JSX
 * children; `items` is the version of that idea this runtime can express.
 */
export function Accordion(handle: Handle<AccordionProps>) {
  return () => {
    const { name, items } = handle.props
    return (
      <>
        {items.map((item) => (
          <Disclosure key={item.id} name={name} open={item.open} summary={item.summary}>
            {item.children}
          </Disclosure>
        ))}
      </>
    )
  }
}
