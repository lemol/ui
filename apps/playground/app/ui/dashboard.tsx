import { css, type Handle } from "remix/component"
import { EmptyState } from "../../../../src/mini/index.ts"
import {
  Badge,
  Button,
  Eyebrow,
  Field,
  Grid,
  Heading,
  LinkButton,
  overlay,
  Row,
  Stack,
  Text,
} from "../../../../src/remix/index.ts"
import { HiddenFields, splitLocation } from "./forms.tsx"
import { PlaygroundShell } from "./layout.tsx"

/**
 * Contract gaps this recipe surfaced (also recorded on task 19):
 *
 * - No neutral panel. The stat and task panels below are hand-styled from
 *   primitives. M2's Callout is tinted, not neutral, so if a second recipe
 *   needs panels, `mini` wants a Panel of its own rather than a third copy
 *   of these four declarations.
 * - No Table (M2). The task rows are hand-styled Rows; the day Table lands,
 *   this list is its first consumer.
 * - Grid has no responsive mode — already documented on `GridProps.cols`,
 *   so the two-column sections squeeze on a phone rather than stacking.
 *   Nothing here needed a new token: every panel, row and stat reads
 *   primitives the theme already carries.
 */

const panel = css({
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-md)",
  padding: "var(--sp-6)",
})

const statValue = css({
  fontSize: "var(--fs-2xl)",
  fontWeight: "var(--fw-semibold)",
  letterSpacing: "var(--tr-tight)",
  lineHeight: "var(--lh-tight)",
})

const taskRow = css({
  paddingBlock: "var(--sp-3)",
  borderBlockEnd: "1px solid var(--hairline)",
})

const NewTask = overlay("dashboard-new-task")

const tasks = [
  { status: "Overdue", tone: "danger", title: "Renew the TLS certificate", due: "due yesterday" },
  { status: "Due Friday", tone: "warning", title: "Draft the launch notes", due: "due in 3 days" },
  { status: "In review", tone: "info", title: "Refresh the pricing page", due: "waiting on Mara" },
  {
    status: "Backlog",
    tone: "neutral",
    title: "Archive last quarter's invoices",
    due: "no due date",
  },
] as const

const plans = ["free", "team", "enterprise"] as const

export interface DashboardPageProps {
  /** Path plus query string — see `splitLocation`. */
  location: string
}

/**
 * One composed page: stats, a task list, an empty activity feed, a settings
 * form and a dialog, all native. Both forms submit with `method="get"`, so
 * saving round-trips through the query string and the confirmation below
 * each form is the proof — with the no-JS toggle on, nothing here changes.
 */
export function DashboardPage(handle: Handle<DashboardPageProps>) {
  return () => {
    const { pathname, params } = splitLocation(handle.props.location)
    const createdTask = params.get("task-title")?.trim() || undefined
    const savedProject = params.get("project")?.trim() || undefined
    const savedPlan = params.get("plan")
    const currentPlan = plans.includes(savedPlan as (typeof plans)[number])
      ? (savedPlan as (typeof plans)[number])
      : "team"

    return (
      <PlaygroundShell location={handle.props.location} nav="dashboard">
        <Stack gap={8}>
          <Stack gap={4}>
            <Stack gap={2}>
              <Eyebrow>Acme · Website</Eyebrow>
              <Heading level={1}>Dashboard</Heading>
              <Text tone="muted">
                A composed recipe: every M1 component earning its place in one layout, and the page
                the no-JS toggle is for.
              </Text>
            </Stack>
            <Row gap={2} wrap>
              <NewTask.Trigger tone="primary">New task</NewTask.Trigger>
              <LinkButton href="#settings">Project settings</LinkButton>
            </Row>
            {createdTask === undefined ? null : (
              <Row gap={2}>
                <Badge tone="success">Created</Badge>
                <Text as="span">{createdTask}</Text>
              </Row>
            )}
          </Stack>

          <Grid cols={3} gap={4}>
            <div mix={panel}>
              <Stack gap={2}>
                <Eyebrow>Open tasks</Eyebrow>
                <div mix={statValue}>12</div>
                <Row gap={2}>
                  <Badge tone="warning">4 overdue</Badge>
                </Row>
              </Stack>
            </div>
            <div mix={panel}>
              <Stack gap={2}>
                <Eyebrow>Done this week</Eyebrow>
                <div mix={statValue}>34</div>
                <Row gap={2}>
                  <Badge tone="success">+12%</Badge>
                </Row>
              </Stack>
            </div>
            <div mix={panel}>
              <Stack gap={2}>
                <Eyebrow>Members</Eyebrow>
                <div mix={statValue}>8</div>
                <Row gap={2}>
                  <Badge tone="info">2 new</Badge>
                </Row>
              </Stack>
            </div>
          </Grid>

          <Grid cols={2} gap={4}>
            <div mix={panel}>
              <Stack gap={2}>
                <Heading level={2} size={3}>
                  Open tasks
                </Heading>
                <Stack gap={0}>
                  {tasks.map((task) => (
                    <div key={task.title} mix={taskRow}>
                      <Row gap={2} justify="between">
                        <Row gap={2}>
                          <Badge tone={task.tone}>{task.status}</Badge>
                          <Text as="span">{task.title}</Text>
                        </Row>
                        <Text as="span" size="sm" tone="subtle">
                          {task.due}
                        </Text>
                      </Row>
                    </div>
                  ))}
                </Stack>
              </Stack>
            </div>

            <EmptyState
              description="Ship something and it shows up here."
              eyebrow="Activity"
              title="No activity yet"
            />
          </Grid>

          <div id="settings">
            <Stack gap={4}>
              <Stack gap={2}>
                <Heading level={2}>Project settings</Heading>
                <Text tone="muted">
                  A plain GET form: saving reloads this page with the values in the query string.
                </Text>
              </Stack>
              {savedProject === undefined ? null : (
                <Row gap={2}>
                  <Badge tone="success">Saved</Badge>
                  <Text as="span">
                    {savedProject} · {currentPlan}
                  </Text>
                </Row>
              )}
              <form action={pathname} method="get">
                <HiddenFields except={["project", "plan"]} params={params} />
                <Stack gap={4}>
                  <Field
                    label="Project name"
                    name="project"
                    required
                    value={savedProject ?? "Acme website"}
                  />
                  <Field control="select" label="Plan" name="plan">
                    {plans.map((plan) => (
                      <option key={plan} selected={plan === currentPlan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </Field>
                  <Row gap={2}>
                    <Button tone="primary" type="submit">
                      Save
                    </Button>
                  </Row>
                </Stack>
              </form>
            </Stack>
          </div>
        </Stack>

        <NewTask.Dialog title="New task">
          <form action={pathname} method="get">
            <HiddenFields except={["task-title", "task-notes"]} params={params} />
            <Stack gap={4}>
              <Field label="Title" name="task-title" required />
              <Field control="textarea" label="Notes" name="task-notes" rows={3} />
              <Row gap={2} justify="end">
                <NewTask.Close tone="ghost">Cancel</NewTask.Close>
                <Button tone="primary" type="submit">
                  Create
                </Button>
              </Row>
            </Stack>
          </form>
        </NewTask.Dialog>
      </PlaygroundShell>
    )
  }
}
