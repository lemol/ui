import { css, type Handle } from "remix/ui"
import { RuntimeProbe, RuntimeProbeView } from "./public/runtime-probe.tsx"

export interface HomePageProps {
  /** With scripts off the probe renders dead rather than absent, so the
   * unenhanced page shows exactly what the enhanced one does. */
  scripts: boolean
}

const page = css({
  maxWidth: "42rem",
  margin: "4rem auto",
  padding: "0 1.5rem",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.6,
})

export function HomePage(handle: Handle<HomePageProps>) {
  return () => (
    <main mix={page}>
      <h1>lemol ui playground</h1>
      <p>
        Nothing is catalogued yet. This page exists to prove the pipeline underneath it: server
        rendering, the asset server, and a client entry that hydrates markup the server already
        sent.
      </p>
      <p>{handle.props.scripts ? <RuntimeProbe /> : <RuntimeProbeView clicks={0} />}</p>
      <p>
        {handle.props.scripts
          ? "Client JavaScript is on: the button counts."
          : "Client JavaScript is off: the button is complete markup that does nothing."}
      </p>
    </main>
  )
}
