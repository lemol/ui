import type { PrimitiveTokens } from "./tokens.ts"

type Base<C extends string> = PrimitiveTokens & Readonly<Partial<Record<C, string>>>
type Overrides<C extends string> = Readonly<Partial<PrimitiveTokens & Record<C, string>>>

export interface Theme<C extends string = never> {
  readonly base: Base<C>
  readonly dark: Overrides<C> | undefined
  readonly compact: Overrides<C> | undefined
}

export interface ThemeInput<C extends string = never> {
  readonly base: Base<C>
  readonly dark?: Overrides<C>
  readonly compact?: Overrides<C>
}

export interface ThemeOverrides<C extends string = never> {
  readonly base?: Overrides<C>
  readonly dark?: Overrides<C>
  readonly compact?: Overrides<C>
}

function mergeAxis<C extends string>(
  current: Overrides<C> | undefined,
  next: Overrides<C> | undefined,
): Overrides<C> | undefined {
  if (current === undefined && next === undefined) return undefined
  return Object.freeze({ ...current, ...next }) as Overrides<C>
}

export function defineTheme<C extends string = never>(input: ThemeInput<NoInfer<C>>): Theme<C> {
  return Object.freeze({
    base: Object.freeze({ ...input.base }) as Base<C>,
    dark: mergeAxis<C>(undefined, input.dark),
    compact: mergeAxis<C>(undefined, input.compact),
  })
}

export function extendTheme<C extends string = never>(
  theme: Theme<C>,
  overrides: ThemeOverrides<NoInfer<C>>,
): Theme<C> {
  return Object.freeze({
    base: Object.freeze({ ...theme.base, ...overrides.base }) as Base<C>,
    dark: mergeAxis<C>(theme.dark, overrides.dark),
    compact: mergeAxis<C>(theme.compact, overrides.compact),
  })
}
