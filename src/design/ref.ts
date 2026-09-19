import type { PrimitiveName } from "./tokens.ts"

export function v(name: PrimitiveName): string {
  return `var(--${name})`
}
