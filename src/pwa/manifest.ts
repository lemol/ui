/** An icon the manifest names: a content-addressed file the host serves. */
export interface ManifestIcon {
  readonly src: string
  readonly sizes: string
  readonly type: string
  /** `maskable` when the drawing keeps inside the safe zone, a circle 80% across. */
  readonly purpose?: "any" | "maskable" | "monochrome" | undefined
}

/** A destination a long press on the installed icon offers. */
export interface ManifestShortcut {
  readonly name: string
  readonly url: string
}

export interface WebManifestOptions {
  readonly name: string
  readonly shortName?: string | undefined
  readonly description?: string | undefined
  /** The app's identity across manifest changes; the start URL when unset. */
  readonly id?: string | undefined
  readonly startUrl?: string | undefined
  readonly scope?: string | undefined
  readonly display?: "standalone" | "fullscreen" | "minimal-ui" | "browser" | undefined
  /** The splash an installed launch paints before the page does: the dark ground. */
  readonly background: string
  /** The frame's colour, which the platform's own chrome takes. */
  readonly theme: string
  readonly icons: ReadonlyArray<ManifestIcon>
  readonly shortcuts?: ReadonlyArray<ManifestShortcut> | undefined
}

/** The web app manifest an install reads, as JSON to serve as `application/manifest+json`. */
export const webManifest = (options: WebManifestOptions): string => {
  const start = options.startUrl ?? "/"

  return JSON.stringify({
    id: options.id ?? start,
    name: options.name,
    short_name: options.shortName ?? options.name,
    ...(options.description === undefined ? {} : { description: options.description }),
    start_url: start,
    scope: options.scope ?? "/",
    display: options.display ?? "standalone",
    background_color: options.background,
    theme_color: options.theme,
    icons: options.icons.map((icon) => ({
      src: icon.src,
      sizes: icon.sizes,
      type: icon.type,
      purpose: icon.purpose ?? "any",
    })),
    ...(options.shortcuts === undefined || options.shortcuts.length === 0
      ? {}
      : { shortcuts: options.shortcuts }),
  })
}
