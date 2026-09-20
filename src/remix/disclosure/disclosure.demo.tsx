import { css } from "remix/ui"
import { Accordion, Disclosure } from "./disclosure.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

export function DisclosureDemo() {
  return () => (
    <>
      <p mix={label}>disclosure: native details/summary, no client code</p>
      <Disclosure summary="What is this?">
        A single disclosure, open and closed with no script — it is a <code>&lt;details&gt;</code>{" "}
        element.
      </Disclosure>

      <p mix={label}>accordion: one name, one open at a time</p>
      <Accordion
        items={[
          { children: "Charged monthly, cancel any time.", id: "billing", summary: "Billing" },
          {
            children: "Email support, response within one business day.",
            id: "support",
            summary: "Support",
          },
          {
            children: "Exported as CSV or JSON from account settings.",
            id: "export",
            summary: "Data export",
          },
        ]}
        name="faq"
      />
    </>
  )
}
