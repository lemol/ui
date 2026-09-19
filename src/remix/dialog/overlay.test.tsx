import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../test/render.ts"
import { markupOf } from "../../../test/styles.ts"
import { DialogDemo } from "./dialog.demo.tsx"
import { overlay } from "./overlay.tsx"

describe("overlay", () => {
  it("binds a trigger to the dialog it opens, with one string written once", async () => {
    const NewTask = overlay("new-task")
    const markup = markupOf(
      await renderToHtml(
        <>
          <NewTask.Trigger tone="primary">New task</NewTask.Trigger>
          <NewTask.Dialog title="New task">Body</NewTask.Dialog>
        </>,
      ),
    )
    expect(markup).toContain('command="show-modal"')
    expect(markup).toContain('commandfor="new-task"')
    // Attribute by attribute, not as one string: the renderer emits them in
    // the order the JSX lists them, so a single substring would break the day
    // someone reorders two props that have no ordering.
    const dialogTag = /<dialog[^>]*>/.exec(markup)?.[0] ?? ""
    expect(dialogTag).toContain('id="new-task"')
    expect(dialogTag).toContain('aria-labelledby="new-task-title"')
  })

  it("gives Close the dismissal, so a caller's cancel button needs no id", async () => {
    const NewTask = overlay("new-task")
    const markup = markupOf(await renderToHtml(<NewTask.Close tone="ghost">Cancel</NewTask.Close>))
    expect(markup).toContain('command="close"')
    expect(markup).toContain('commandfor="new-task"')
    expect(markup).toContain("Cancel")
  })

  it("passes a trigger's button props through", async () => {
    // Trigger is a Button, so tone, size and disabled are not reinvented here.
    const NewTask = overlay("new-task")
    const markup = markupOf(
      await renderToHtml(
        <NewTask.Trigger disabled size="sm">
          New task
        </NewTask.Trigger>,
      ),
    )
    expect(markup).toContain("disabled")
  })

  it("exposes the id it minted", () => {
    expect(overlay("new-task").id).toBe("new-task")
  })

  it("keeps two overlays apart", async () => {
    // Both halves of both overlays, not just the triggers: the invocations are
    // minted inside overlay(), and a `close` hoisted to shared scope would
    // hand two dialogs the same dismissal target — a button that closes the
    // wrong one. Comparing only the triggers cannot see that.
    const First = overlay("first")
    const Second = overlay("second")
    const markup = markupOf(
      await renderToHtml(
        <>
          <First.Trigger>One</First.Trigger>
          <Second.Trigger>Two</Second.Trigger>
          <First.Close>Cancel one</First.Close>
          <Second.Close>Cancel two</Second.Close>
        </>,
      ),
    )
    const targets = [...markup.matchAll(/commandfor="([^"]*)"/g)].map((match) => match[1])
    expect(targets).toEqual(["first", "second", "first", "second"])
  })

  it("renders complete markup with no script", async () => {
    // The no-JS claim, asserted where it is cheap. The invocation is in the
    // markup the server sent; nothing waits for a client module to arrive.
    const NewTask = overlay("new-task")
    const html = await renderToHtml(
      <>
        <NewTask.Trigger>New task</NewTask.Trigger>
        <NewTask.Dialog title="New task">Body</NewTask.Dialog>
      </>,
    )
    expect(html).not.toContain("<script")
  })
})

describe("DialogDemo", () => {
  it("shows a trigger, a dialog and a form that cancels", async () => {
    const markup = markupOf(await renderToHtml(<DialogDemo />))
    expect(markup).toContain('command="show-modal"')
    expect(markup).toContain('command="close"')
    expect(markup).toContain("<form")
  })
})
