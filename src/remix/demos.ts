import { BadgeDemo } from "./badge/badge.demo.tsx"
import { BreadcrumbsDemo } from "./breadcrumbs/breadcrumbs.demo.tsx"
import { ButtonDemo } from "./button/button.demo.tsx"
import { CalloutDemo } from "./callout/callout.demo.tsx"
import { CheckboxDemo } from "./checkbox/checkbox.demo.tsx"
import { CommandPaletteDemo } from "./command-palette/command-palette.demo.tsx"
import { ContainerDemo } from "./container/container.demo.tsx"
import { CopyButtonDemo } from "./copy-button/copy-button.demo.tsx"
import { DensityToggleDemo } from "./density-toggle/density-toggle.demo.tsx"
import { DialogDemo } from "./dialog/dialog.demo.tsx"
import { DisclosureDemo } from "./disclosure/disclosure.demo.tsx"
import { EyebrowDemo } from "./eyebrow/eyebrow.demo.tsx"
import { FacetFilterDemo } from "./facet-filter/facet-filter.demo.tsx"
import { FieldDemo } from "./field/field.demo.tsx"
import { GridDemo } from "./grid/grid.demo.tsx"
import { HeadingDemo } from "./heading/heading.demo.tsx"
import { KbdDemo } from "./kbd/kbd.demo.tsx"
import { LiveFormDemo } from "./live-form/live-form.demo.tsx"
import { MenuDemo } from "./menu/menu.demo.tsx"
import { MeterDemo } from "./meter/meter.demo.tsx"
import { PaginationDemo } from "./pagination/pagination.demo.tsx"
import { PopoverDemo } from "./popover/popover.demo.tsx"
import { RadioDemo } from "./radio/radio.demo.tsx"
import { RowDemo } from "./row/row.demo.tsx"
import { SchemeToggleDemo } from "./scheme-toggle/scheme-toggle.demo.tsx"
import { SegmentedControlDemo } from "./segmented-control/segmented-control.demo.tsx"
import { ShortcutDemo } from "./shortcut/shortcut.demo.tsx"
import { SkeletonDemo } from "./skeleton/skeleton.demo.tsx"
import { SpinnerDemo } from "./spinner/spinner.demo.tsx"
import { StackDemo } from "./stack/stack.demo.tsx"
import { SwitchDemo } from "./switch/switch.demo.tsx"
import { TabBarDemo } from "./tab-bar/tab-bar.demo.tsx"
import { TableDemo } from "./table/table.demo.tsx"
import { TabsDemo } from "./tabs/tabs.demo.tsx"
import { TextDemo } from "./text/text.demo.tsx"
import { ToasterDemo } from "./toaster/toaster.demo.tsx"

/**
 * The catalogue's source of truth. A demo lives beside the component it
 * demonstrates and is registered here, so a component cannot be catalogued
 * from anything but its own source.
 */
export const demos = {
  badge: { title: "Badge", Demo: BadgeDemo },
  breadcrumbs: { title: "Breadcrumbs", Demo: BreadcrumbsDemo },
  button: { title: "Button", Demo: ButtonDemo },
  callout: { title: "Callout", Demo: CalloutDemo },
  checkbox: { title: "Checkbox", Demo: CheckboxDemo },
  commandPalette: { title: "CommandPalette", Demo: CommandPaletteDemo },
  container: { title: "Container", Demo: ContainerDemo },
  copyButton: { title: "CopyButton", Demo: CopyButtonDemo },
  densityToggle: { title: "DensityToggle", Demo: DensityToggleDemo },
  dialog: { title: "Dialog", Demo: DialogDemo },
  disclosure: { title: "Disclosure", Demo: DisclosureDemo },
  eyebrow: { title: "Eyebrow", Demo: EyebrowDemo },
  "facet-filter": { title: "FacetFilter", Demo: FacetFilterDemo },
  field: { title: "Field", Demo: FieldDemo },
  grid: { title: "Grid", Demo: GridDemo },
  heading: { title: "Heading", Demo: HeadingDemo },
  kbd: { title: "Kbd", Demo: KbdDemo },
  liveForm: { title: "LiveForm", Demo: LiveFormDemo },
  menu: { title: "Menu", Demo: MenuDemo },
  meter: { title: "Meter", Demo: MeterDemo },
  pagination: { title: "Pagination", Demo: PaginationDemo },
  popover: { title: "Popover", Demo: PopoverDemo },
  radio: { title: "Radio", Demo: RadioDemo },
  row: { title: "Row", Demo: RowDemo },
  schemeToggle: { title: "SchemeToggle", Demo: SchemeToggleDemo },
  segmentedControl: { title: "SegmentedControl", Demo: SegmentedControlDemo },
  shortcut: { title: "Shortcut", Demo: ShortcutDemo },
  skeleton: { title: "Skeleton", Demo: SkeletonDemo },
  spinner: { title: "Spinner", Demo: SpinnerDemo },
  stack: { title: "Stack", Demo: StackDemo },
  switch: { title: "Switch", Demo: SwitchDemo },
  table: { title: "Table", Demo: TableDemo },
  tabBar: { title: "TabBar", Demo: TabBarDemo },
  tabs: { title: "Tabs", Demo: TabsDemo },
  text: { title: "Text", Demo: TextDemo },
  toaster: { title: "Toaster", Demo: ToasterDemo },
} as const

export type DemoName = keyof typeof demos

/** One catalogue entry, so a consumer need not spell out a lookup into `demos`. */
export type DemoEntry = (typeof demos)[DemoName]

export function isDemoName(name: string): name is DemoName {
  return Object.hasOwn(demos, name)
}
