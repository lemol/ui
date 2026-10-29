import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { blocksOn, markupOf, sharedProperties, stylesOf } from "../../../test/styles.ts"
import { scheduleDismiss } from "./dismiss-timer.ts"
import { toast } from "./toaster.tsx"

describe("scheduleDismiss", () => {
  it("calls onFire after the given delay", async () => {
    let fired = false
    scheduleDismiss(5, () => {
      fired = true
    })
    expect(fired).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(fired).toBe(true)
  })

  it("never fires once cancelled", async () => {
    let fired = false
    const cancel = scheduleDismiss(5, () => {
      fired = true
    })

    cancel()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(fired).toBe(false)
  })
})

describe("toast", () => {
  it("binds a trigger to the toast it dismisses, with one string written once", async () => {
    const Saved = toast("saved-toast")
    const markup = markupOf(
      await renderToHtml(
        <>
          <Saved.Trigger>Save</Saved.Trigger>
          <Saved.Toast>Saved.</Saved.Toast>
        </>,
      ),
    )

    expect(markup).toContain('command="--dismiss-toast"')
    expect(markup).toContain('commandfor="saved-toast"')
    const toastTag = /<div[^>]*id="saved-toast"[^>]*>/.exec(markup)?.[0] ?? ""

    expect(toastTag).toContain('popover="manual"')
    expect(toastTag).toContain('data-ui-toast-duration="5000"')
  })

  it("carries a custom duration", async () => {
    const Saved = toast("saved-toast")
    const markup = markupOf(await renderToHtml(<Saved.Toast duration={4000}>Saved.</Saved.Toast>))

    expect(markup).toContain('data-ui-toast-duration="4000"')
  })

  it("dismisses through a native command, not a second hand-written one", async () => {
    const Saved = toast("saved-toast")
    const markup = markupOf(await renderToHtml(<Saved.Toast>Saved.</Saved.Toast>))

    expect(markup).toContain('command="hide-popover"')
    expect(markup).toContain('commandfor="saved-toast"')
    expect(markup).toContain('aria-label="Dismiss"')
  })

  it("is announced to assistive tech through role and aria-live, not focus", async () => {
    const Saved = toast("saved-toast")
    const markup = markupOf(await renderToHtml(<Saved.Toast>Saved.</Saved.Toast>))

    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
  })

  it("exposes the id it minted", () => {
    expect(toast("saved-toast").id).toBe("saved-toast")
  })

  it("gives every tone its own three tokens and nothing borrowed", async () => {
    const tones = ["neutral", "success", "warning", "danger", "info"] as const

    for (const tone of tones) {
      const Saved = toast("saved-toast")
      const styles = stylesOf(await renderToHtml(<Saved.Toast tone={tone}>Saved.</Saved.Toast>))

      expect(styles).toContain(`background: var(--ui-toast-${tone}-bg)`)
      expect(styles).toContain(`border-color: var(--ui-toast-${tone}-border)`)
      expect(styles).toContain(`color: var(--ui-toast-${tone}-ink)`)
    }
  })

  it("declares display only in the open state", async () => {
    const Saved = toast("saved-toast")
    const html = await renderToHtml(<Saved.Toast>Saved.</Saved.Toast>)
    const toastBlock = blocksOn(html, "div")[0] ?? ""
    const openBlock = /&:popover-open\s*\{([^}]*)\}/.exec(toastBlock)?.[1] ?? ""

    expect(openBlock).toContain("display: flex")
    expect(toastBlock.replace(/&:popover-open[^}]*\}/g, "")).not.toContain("display: flex")
  })

  it("declares the transition twice, the second with allow-discrete", async () => {
    const Saved = toast("saved-toast")
    const html = await renderToHtml(<Saved.Toast>Saved.</Saved.Toast>)
    const toastBlock = blocksOn(html, "div")[0] ?? ""
    const declarations = [...toastBlock.matchAll(/transition:\s*([^;]+);/g)].map(
      (match) => match[1] ?? "",
    )

    expect(declarations).toHaveLength(2)
    expect(declarations[0]).not.toContain("allow-discrete")
    expect(declarations[1]).toContain("overlay var(--ui-toast-transition-duration) allow-discrete")

    for (const declaration of declarations) {
      expect(declaration).not.toMatch(/\d+m?s|cubic-bezier/)
    }
  })

  it("mints a transition name per toast for a stack shift, in its style attribute", async () => {
    const Saved = toast("saved")
    const Synced = toast("synced")
    const html = await renderToHtml(
      <>
        <Saved.Toast>Saved.</Saved.Toast>
        <Synced.Toast>Synced.</Synced.Toast>
      </>,
    )

    expect(/<div[^>]*id="saved"[^>]*>/.exec(markupOf(html))?.[0]).toContain(
      'style="view-transition-name: saved--toast"',
    )
    expect(/<div[^>]*id="synced"[^>]*>/.exec(markupOf(html))?.[0]).toContain(
      'style="view-transition-name: synced--toast"',
    )
    expect(stylesOf(html)).not.toContain("view-transition")
  })

  it("refuses, where it is minted, an id that cannot name a transition", () => {
    expect(() => toast("1st")).toThrow('"1st"')
  })

  it("keeps the shell, tone and close blocks disjoint by property", async () => {
    const Saved = toast("saved-toast")
    const html = await renderToHtml(<Saved.Toast tone="success">Saved.</Saved.Toast>)
    const divBlocks = blocksOn(html, "div")

    expect(divBlocks).toHaveLength(2)
    expect(sharedProperties(divBlocks)).toEqual([])
    const buttonBlocks = blocksOn(html, "button")

    expect(buttonBlocks.length).toBeGreaterThan(0)
  })
})
