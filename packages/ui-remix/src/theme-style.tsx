import type { Theme } from "@lemol/ui-design"
import { emitTokensCss } from "@lemol/ui-design/css"
import type { Handle } from "remix/ui"
import { type ComponentTokenName, componentTokens as ownTokens } from "./tokens.ts"

export interface ThemeStyleProps {
  theme: Theme<ComponentTokenName>
  /** Defaults to this package's aggregate. Supply a wider record to add to it. */
  componentTokens?: Readonly<Record<string, string>> | undefined
}

/**
 * The emitted stylesheet, in the document.
 *
 * **This belongs in `<head>`, and the placement is load-bearing.** remix
 * collects every `css({...})` rule and splices the resulting style elements in
 * immediately before `</head>` — after all authored head content, before
 * anything in the body. So a ThemeStyle in the body is evaluated after
 * `@layer rmx.*` already exists, and `@layer base, rmx;` then registers `base`
 * at the *end* of the order rather than the front, because a layer statement
 * cannot move a layer that exists. Element defaults start beating components,
 * with no error at all.
 *
 * A runtime assertion cannot catch that: this renders during the tree walk and
 * remix injects its style elements afterwards, so at render time there is no
 * remix style element to find. The check is a render test on the document
 * instead — see apps/playground/app/router.test.tsx.
 *
 * `innerHTML` rather than text children because remix escapes &, < and > in
 * element text content, which would quietly break any declaration carrying
 * one. `emitTokensCss()` rejects those characters as well; this is the half of
 * the defence that does not depend on the emitter keeping that rule.
 */
export function ThemeStyle(handle: Handle<ThemeStyleProps>) {
  return () => {
    const { theme, componentTokens = ownTokens } = handle.props
    return <style innerHTML={emitTokensCss(theme, { componentTokens })} />
  }
}
