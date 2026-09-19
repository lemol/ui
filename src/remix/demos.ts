import { BadgeDemo } from "./badge/badge.demo.tsx"
import { ButtonDemo } from "./button/button.demo.tsx"
import { ContainerDemo } from "./container/container.demo.tsx"
import { EyebrowDemo } from "./eyebrow/eyebrow.demo.tsx"
import { FieldDemo } from "./field/field.demo.tsx"
import { GridDemo } from "./grid/grid.demo.tsx"
import { HeadingDemo } from "./heading/heading.demo.tsx"
import { RowDemo } from "./row/row.demo.tsx"
import { StackDemo } from "./stack/stack.demo.tsx"
import { TextDemo } from "./text/text.demo.tsx"

/**
 * The catalogue's source of truth. A demo lives beside the component it
 * demonstrates and is registered here, so a component cannot be catalogued
 * from anything but its own source.
 */
export const demos = {
  badge: { title: "Badge", Demo: BadgeDemo },
  button: { title: "Button", Demo: ButtonDemo },
  container: { title: "Container", Demo: ContainerDemo },
  eyebrow: { title: "Eyebrow", Demo: EyebrowDemo },
  field: { title: "Field", Demo: FieldDemo },
  grid: { title: "Grid", Demo: GridDemo },
  heading: { title: "Heading", Demo: HeadingDemo },
  row: { title: "Row", Demo: RowDemo },
  stack: { title: "Stack", Demo: StackDemo },
  text: { title: "Text", Demo: TextDemo },
} as const

export type DemoName = keyof typeof demos

/** One catalogue entry, so a consumer need not spell out a lookup into `demos`. */
export type DemoEntry = (typeof demos)[DemoName]

export function isDemoName(name: string): name is DemoName {
  return Object.hasOwn(demos, name)
}
