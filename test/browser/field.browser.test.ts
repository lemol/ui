import { afterAll, expect, test } from "bun:test"
import { closeHarness, withPage } from "./harness.ts"

afterAll(closeHarness)

const chosen =
  "Lemol Studio — design, research and the shared component library for every product team"

for (const width of [1440, 390]) {
  test(`a chosen value longer than its select stays on one line inside the box at ${width}px`, async () => {
    await withPage(async (page, baseUrl) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`${baseUrl}/c/field`)

      const select = page.getByLabel("Workspace")
      const layout = await select.evaluate((element) => {
        const content = element.querySelector("selectedcontent")

        if (content === null) return null

        const outer = element.getBoundingClientRect()
        const inner = content.getBoundingClientRect()
        const chevron = element.parentElement
          ?.querySelector(":scope > svg")
          ?.getBoundingClientRect()

        const style = getComputedStyle(content)

        return {
          cut: content.scrollWidth > content.clientWidth,
          inside:
            inner.top >= outer.top &&
            inner.bottom <= outer.bottom &&
            inner.left >= outer.left &&
            inner.right <= outer.right,
          clearOfChevron: chevron !== undefined && inner.right <= chevron.left,
          height: inner.height,
          lineHeight: Number.parseFloat(style.lineHeight),
          textOverflow: style.textOverflow,
        }
      })

      // The value really is longer than its box, so the rest is not vacuous.
      expect(layout).not.toBeNull()
      expect(layout?.cut).toBe(true)
      expect(layout?.inside).toBe(true)
      expect(layout?.clearOfChevron).toBe(true)
      expect(layout?.height).toBeCloseTo(layout?.lineHeight ?? 0, 0)
      expect(layout?.textOverflow).toBe("ellipsis")
      // The cut text is still read whole: the button it sits in is named by all of it.
      expect(await select.getByRole("button", { name: chosen, exact: true }).count()).toBe(1)

      await select.click()

      const option = select.getByRole("option", { name: chosen, exact: true })

      // The open list still shows the option whole.
      expect(await select.evaluate((element) => element.matches(":open"))).toBe(true)
      expect(await option.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      )

      // Wait for the block-axis entry translate to settle before measuring.
      await page.waitForFunction(() => {
        const element = document.querySelector("select:open")

        if (element === null) return false

        const picker = getComputedStyle(element, "::picker(select)")

        return picker.translate === "none" && picker.opacity === "1"
      })

      // The options span the picker's content box. Include the picker chrome,
      // not just the inset options, when checking all four outer edges.
      const viewport = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }))

      const pickerBox = await select.evaluate((element) => {
        const options = element.querySelectorAll("option")
        const first = options[0]!.getBoundingClientRect()
        const last = options[options.length - 1]!.getBoundingClientRect()
        const picker = getComputedStyle(element, "::picker(select)")

        return {
          left:
            first.left -
            Number.parseFloat(picker.paddingLeft) -
            Number.parseFloat(picker.borderLeftWidth),
          right:
            first.right +
            Number.parseFloat(picker.paddingRight) +
            Number.parseFloat(picker.borderRightWidth),
          top:
            first.top -
            Number.parseFloat(picker.paddingTop) -
            Number.parseFloat(picker.borderTopWidth),
          bottom:
            last.bottom +
            Number.parseFloat(picker.paddingBottom) +
            Number.parseFloat(picker.borderBottomWidth),
        }
      })

      expect(pickerBox.left).toBeGreaterThanOrEqual(0)
      expect(pickerBox.right).toBeLessThanOrEqual(viewport.width)
      expect(pickerBox.top).toBeGreaterThanOrEqual(0)
      expect(pickerBox.bottom).toBeLessThanOrEqual(viewport.height)
    })
  })
}
