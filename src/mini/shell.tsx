import { css, type Handle, type MixInput, type RemixNode } from "remix/component"
import { Container } from "../remix/index.ts"

/**
 * The skip link, and the reason `<main>` carries an id at all.
 *
 * Every page here is a header of links above a main region, so a keyboard user
 * with no way past the navigation pays for it on every page. It is off-screen
 * rather than `display: none`, because a hidden element is not focusable and a
 * skip link nobody can focus is decoration.
 *
 * `clip-path` rather than the old `clip` hack: `clip` is deprecated, and
 * `inline-size: 1px` alone would leave a visible sliver.
 */
const mainId = "main"

const skipLinkStyle = css({
  position: "absolute",
  insetBlockStart: "var(--sp-2)",
  insetInlineStart: "var(--sp-2)",
  zIndex: 2,
  padding: "var(--sp-2)",
  borderRadius: "var(--r-sm)",
  background: "var(--surface-raised)",
  color: "var(--ink)",
  clipPath: "inset(50%)",
  "&:focus-visible": {
    clipPath: "none",
  },
})

/**
 * Rows, not a fixed height: `auto 1fr auto` is what keeps a short page's
 * footer at the bottom of the viewport without the footer knowing how tall
 * the content is.
 *
 * `100dvh` rather than `100vh`, because a mobile browser's collapsing toolbar
 * makes `vh` too tall and leaves the footer under it.
 */
const shellStyle = css({
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  minBlockSize: "100dvh",
})

/**
 * Sticky, hairline-separated, and flat. A shadow under a sticky header is the
 * first thing that makes a document-style page look like an application
 * chrome, and the hairline already says where the header ends.
 *
 * `z-index` is 1 against page content; the skip link sits above both.
 */
const headerStyle = css({
  position: "sticky",
  insetBlockStart: 0,
  zIndex: 1,
  background: "var(--surface)",
  borderBlockEndWidth: "1px",
  borderBlockEndStyle: "solid",
  borderBlockEndColor: "var(--hairline)",
})

/**
 * The header's own row. It wraps rather than scrolls: at a phone width the
 * brand keeps its line and the navigation drops below it, which costs one line
 * of height and no interaction.
 */
const headerRowStyle = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--sp-4)",
  paddingBlock: "var(--sp-3)",
})

/** The wordmark: the one place on the page set in the type scale's own voice. */
const brandStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-2)",
  fontSize: "var(--fs-lg)",
  fontWeight: "var(--fw-semibold)",
  letterSpacing: "var(--tr-tight)",
  color: "var(--ink)",
  textDecoration: "none",
})

const actionsStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-2)",
})

/**
 * The macro-whitespace decision, and the only one in this file that is taste
 * rather than mechanics: a page of this kind reads as a document when its
 * content starts well below the chrome.
 */
const mainStyle = css({
  paddingBlock: "var(--sp-12)",
})

const footerStyle = css({
  borderBlockStartWidth: "1px",
  borderBlockStartStyle: "solid",
  borderBlockStartColor: "var(--hairline)",
  paddingBlock: "var(--sp-6)",
  fontSize: "var(--fs-sm)",
  color: "var(--ink-subtle)",
})

export interface AppShellProps {
  /** The wordmark. A string is wrapped in the brand's own type; a node is not. */
  brand?: RemixNode | undefined
  /** Where the brand links. Omitted, the brand is not a link. */
  brandHref?: string | undefined
  /** Usually a `<Nav>`. */
  nav?: RemixNode | undefined
  /** The header's trailing slot: a scheme switcher, an overlay trigger. */
  actions?: RemixNode | undefined
  /** Omitted renders no `<footer>` at all, rather than an empty band. */
  footer?: RemixNode | undefined
  /**
   * Adds properties the shell does not declare. It does not reliably override
   * one it does — each `css()` block is its own cascade sub-layer and
   * sub-layer order follows first render — so a look changes through the
   * theme's primitives.
   */
  mix?: MixInput<HTMLDivElement> | undefined
  children?: RemixNode | undefined
}

/**
 * Header, main, footer — the layout an app cannot avoid writing, with the
 * landmarks and the skip link already in it.
 *
 * Every band is the same measure, because `Container` is the measure and the
 * header lining up with the content is most of what makes a page look
 * composed. That is also this component's limit: a page of full-bleed bands
 * does not use `AppShell`, it writes its own layout on the same primitives.
 * `mini` is a reference implementation, not a floor.
 *
 * It declares no `--ui-*` tokens. There is no layer above this one to retheme
 * it from — `mini` *is* the design — so its values are the theme's primitives
 * directly, and a different look is a different theme.
 */
export function AppShell(handle: Handle<AppShellProps>) {
  return () => {
    const { brand, brandHref, nav, actions, footer, mix, children } = handle.props
    return (
      <div mix={[shellStyle, mix]}>
        <a href={`#${mainId}`} mix={skipLinkStyle}>
          Skip to content
        </a>
        <header mix={headerStyle}>
          <Container>
            <div mix={headerRowStyle}>
              {brand === undefined ? null : brandHref === undefined ? (
                <div mix={brandStyle}>{brand}</div>
              ) : (
                <a href={brandHref} mix={brandStyle}>
                  {brand}
                </a>
              )}
              {nav}
              {actions === undefined ? null : <div mix={actionsStyle}>{actions}</div>}
            </div>
          </Container>
        </header>
        <main id={mainId} mix={mainStyle}>
          <Container>{children}</Container>
        </main>
        {footer === undefined ? null : (
          <footer mix={footerStyle}>
            <Container>{footer}</Container>
          </footer>
        )}
      </div>
    )
  }
}

export interface NavItem {
  href: string
  label: string
  /**
   * The current page. Renders `aria-current="page"`, which is both what a
   * screen reader announces and the selector the selected style hangs off —
   * one source of truth rather than a class that can disagree with it.
   */
  current?: boolean | undefined
}

/**
 * Horizontal, scrollable rather than wrapping: a second row of links inside a
 * header that already wraps reads as two navigations. `scrollbar-width` is
 * not set — hiding a scrollbar hides the affordance.
 */
const navListStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-1)",
  margin: 0,
  padding: 0,
  listStyle: "none",
  overflowX: "auto",
})

/**
 * The first consumer of `accent-subtle` and `accent-border`, which the schema
 * has carried since the design system landed for exactly this: a selected nav
 * item. A badge was the wrong home for them — four saturated blocks inline in
 * a paragraph — and a filled `accent` here would put a button in the header.
 *
 * The transition names its properties: `background` and `color` move, and the
 * border does not, because the selected item's border appears rather than
 * changing shade.
 */
const navLinkStyle = css({
  display: "block",
  paddingInline: "var(--sp-3)",
  paddingBlock: "var(--sp-2)",
  borderRadius: "var(--r-sm)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "transparent",
  fontSize: "var(--fs-sm)",
  fontWeight: "var(--fw-medium)",
  lineHeight: "var(--lh-tight)",
  color: "var(--ink-muted)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  transitionProperty: "background, color",
  transitionDuration: "var(--dur-fast)",
  transitionTimingFunction: "var(--ease-out-quad)",
  "&:hover": {
    background: "var(--surface-hover)",
    color: "var(--ink)",
  },
  '&[aria-current="page"]': {
    background: "var(--accent-subtle)",
    borderColor: "var(--accent-border)",
    color: "var(--accent)",
  },
})

export interface NavProps {
  items: readonly NavItem[]
  /**
   * The landmark's accessible name. Defaults to `Primary`, and matters as soon
   * as a page has a second `<nav>` — two unnamed navigation landmarks are
   * indistinguishable in a screen reader's landmark list.
   */
  label?: string | undefined
  mix?: MixInput<HTMLElement> | undefined
}

/**
 * Links in a list in a landmark, and nothing else: no client JavaScript, no
 * tab panels, no active-state bookkeeping. These are server-rendered apps, so
 * the current page is something the server already knows — `aria-current`
 * carries it, and the style follows the attribute.
 */
export function Nav(handle: Handle<NavProps>) {
  return () => {
    const { items, label = "Primary", mix } = handle.props
    return (
      <nav aria-label={label} mix={mix}>
        <ul mix={navListStyle}>
          {items.map((item) => (
            <li key={item.href}>
              <a
                aria-current={item.current === true ? "page" : undefined}
                href={item.href}
                mix={navLinkStyle}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    )
  }
}
