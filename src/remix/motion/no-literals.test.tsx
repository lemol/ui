import { describe, expect, it } from "bun:test"
import type { RemixNode } from "remix/component"
import { renderToHtml } from "../../../test/render.ts"
import { stylesOf } from "../../../test/styles.ts"
import { CopyButton } from "../copy-button/copy-button.tsx"
import { Field } from "../field/field.tsx"
import { Skeleton } from "../skeleton/skeleton.tsx"
import { dissolve, drawCheck, pop, shake, shimmer } from "./motion.ts"

const literal = /\b\d+(\.\d+)?m?s\b/
const timing = { duration: "var(--ui-probe-duration)", easing: "var(--ui-probe-easing)" }

/** Every render the motion system touches. Tasks C–H add their component here. */
const renders: Record<string, () => RemixNode> = {
  mixins: () => (
    <div mix={[shake(timing), pop(timing), drawCheck(timing), dissolve(timing), shimmer(timing)]} />
  ),
  skeleton: () => <Skeleton />,
  copyButton: () => <CopyButton id="a" value="x" />,
  field: () => <Field error="e" label="Q" name="q" type="search" />,
}

describe("motion, as rendered", () => {
  for (const [name, render] of Object.entries(renders)) {
    it(`${name} spends no literal duration and no literal curve`, async () => {
      const styles = stylesOf(await renderToHtml(render()))

      expect(styles).not.toBe("")
      expect(styles).not.toMatch(literal)
      expect(styles).not.toContain("cubic-bezier")
    })
  }
})
