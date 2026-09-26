import { css, type Handle, type MixInput, type RemixNode } from "remix/ui"

const navStyle = css({
  minInlineSize: "0",
})

const listStyle = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--ui-breadcrumbs-gap)",
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontSize: "var(--ui-breadcrumbs-font-size)",
})

const itemStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--ui-breadcrumbs-gap)",
})

/**
 * A crumb wraps to the next line whole first — the list is `flex-wrap` — and
 * breaks inside itself only when it is wider than the line on its own: a task
 * title or a run id on a phone, which `nowrap` pushed past the viewport edge.
 */
const linkStyle = css({
  color: "var(--ui-breadcrumbs-link-ink)",
  textDecoration: "none",
  overflowWrap: "anywhere",
  "&:hover": {
    color: "var(--ui-breadcrumbs-link-ink-hover)",
  },
})

const currentStyle = css({
  color: "var(--ui-breadcrumbs-current-ink)",
  fontWeight: "var(--ui-breadcrumbs-current-font-weight)",
  overflowWrap: "anywhere",
})

const separatorStyle = css({
  display: "inline-flex",
  color: "var(--ui-breadcrumbs-separator-ink)",
  fontSize: "var(--ui-breadcrumbs-separator-size)",
})

export interface BreadcrumbItem {
  readonly label: string
  /** Omit for the current page — the last item with no `href` renders as `aria-current="page"` text, not a link. */
  readonly href?: string | undefined
}

export interface BreadcrumbsProps {
  readonly items: readonly BreadcrumbItem[]
  /** Defaults to "Breadcrumb", the conventional accessible name for this landmark. */
  readonly label?: string | undefined
  readonly mix?: MixInput<HTMLElement> | undefined
}

/**
 * Route links with `aria-current` — no client state, since this is a
 * server-rendered app and the current page is known at render time. The
 * last item with no `href` is the current page; every other item without one
 * renders as plain text (a segment with nothing to link to).
 */
export function Breadcrumbs(handle: Handle<BreadcrumbsProps>) {
  return () => {
    const { items, label = "Breadcrumb", mix } = handle.props
    return (
      <nav aria-label={label} mix={[navStyle, mix]}>
        <ol mix={listStyle}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            const content: RemixNode =
              isLast && item.href === undefined ? (
                <span aria-current="page" mix={currentStyle}>
                  {item.label}
                </span>
              ) : item.href === undefined ? (
                item.label
              ) : (
                <a href={item.href} mix={linkStyle}>
                  {item.label}
                </a>
              )
            return (
              <li key={item.label} mix={itemStyle}>
                {content}
                {isLast ? undefined : (
                  <span aria-hidden="true" mix={separatorStyle}>
                    /
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }
}
