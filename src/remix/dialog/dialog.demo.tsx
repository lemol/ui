import { css } from "remix/ui"
import { Button } from "../button/button.tsx"
import { Field } from "../field/field.tsx"
import { Row } from "../row/row.tsx"
import { Stack } from "../stack/stack.tsx"
import { Text } from "../text/text.tsx"
import { overlay } from "./overlay.tsx"

/** Primitives, not tokens: a demo is a page, not a component. */
const label = css({
  fontSize: "var(--fs-xs)",
  color: "var(--ink-subtle)",
  letterSpacing: "var(--tr-wide)",
  textTransform: "uppercase",
  marginBlockEnd: "var(--sp-2)",
})

const NewTask = overlay("new-task")

export function DialogDemo() {
  return () => (
    <>
      <p mix={label}>dialog: native modal, invoker commands, no client code in the page</p>
      <Stack gap={4}>
        <NewTask.Trigger tone="primary">New task</NewTask.Trigger>
        <Text>
          The trigger is a button carrying <code>command</code> and <code>commandfor</code>. Nothing
          on this page binds a click handler to it.
        </Text>
      </Stack>
      <NewTask.Dialog title="New task">
        <form method="post">
          <Stack gap={4}>
            <Field label="Title" name="title" required />
            <Field control="textarea" label="Notes" name="notes" rows={3} />
            <Row gap={2} justify="end">
              <NewTask.Close tone="ghost">Cancel</NewTask.Close>
              <Button tone="primary" type="submit">
                Create
              </Button>
            </Row>
          </Stack>
        </form>
      </NewTask.Dialog>
    </>
  )
}
