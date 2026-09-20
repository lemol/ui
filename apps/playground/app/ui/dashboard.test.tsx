import { describe, expect, it } from "bun:test"
import { renderToHtml } from "../../../../test/render.ts"
import { DashboardPage } from "./dashboard.tsx"

describe("DashboardPage", () => {
  it("composes stats, tasks, settings and a dialog in one layout", async () => {
    const page = await renderToHtml(<DashboardPage location="/pages/dashboard" />)
    expect(page).toContain("Dashboard")
    expect(page).toContain("Open tasks")
    expect(page).toContain("Renew the TLS certificate")
    expect(page).toContain("Project settings")
    expect(page).toContain("No activity yet")
    expect(page).toContain("New task")
  })

  it("opens its dialog natively, with no client code", async () => {
    const page = await renderToHtml(<DashboardPage location="/pages/dashboard" />)
    expect(page).toContain("commandfor=")
    expect(page).toContain("<dialog")
  })

  it("submits its forms with GET, preserving the switchers", async () => {
    const empty = await renderToHtml(<DashboardPage location="/pages/dashboard" />)
    expect(empty).toContain('method="get"')
    expect(empty).not.toContain('type="hidden"')

    const switched = await renderToHtml(<DashboardPage location="/pages/dashboard?scheme=dark" />)
    expect(switched).toContain('type="hidden"')
    expect(switched).toContain('value="dark"')
  })

  it("confirms a settings round trip from the query string", async () => {
    const page = await renderToHtml(
      <DashboardPage location="/pages/dashboard?project=Beta&plan=free" />,
    )
    expect(page).toContain("Saved")
    expect(page).toContain("Beta")
    expect(page).toContain("free")
  })

  it("confirms a created task from the query string", async () => {
    const page = await renderToHtml(
      <DashboardPage location="/pages/dashboard?task-title=Write+docs" />,
    )
    expect(page).toContain("Created")
    expect(page).toContain("Write docs")
  })
})
