import { ButtonDemo } from "./button/button.demo.tsx"
import { RowDemo } from "./row/row.demo.tsx"
import { StackDemo } from "./stack/stack.demo.tsx"

/**
 * The catalogue's source of truth. A demo lives beside the component it
 * demonstrates and is registered here, so a component cannot be catalogued
 * from anything but its own source.
 */
export const demos = {
  button: { title: "Button", Demo: ButtonDemo },
  row: { title: "Row", Demo: RowDemo },
  stack: { title: "Stack", Demo: StackDemo },
} as const

export type DemoName = keyof typeof demos

/** One catalogue entry, so a consumer need not spell out a lookup into `demos`. */
export type DemoEntry = (typeof demos)[DemoName]

export function isDemoName(name: string): name is DemoName {
  return Object.hasOwn(demos, name)
}
