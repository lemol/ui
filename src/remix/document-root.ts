/**
 * The id `DensityToggle` and `SchemeToggle` `commandfor`, and the id any
 * document shell must give its `<html>` for the same two toggles to work
 * there — a `<button>`'s `commandfor` needs a real id, and `<html>` carries
 * none by default. `mini`'s `Document` renders it; a static SPA
 * `index.html` would need to carry it too.
 *
 * Exported from here, not minted separately in each toggle, so the id used
 * to render `<html>` and the id used to target it cannot drift apart —
 * `mini/document.tsx` imports this same constant rather than restating the
 * string.
 */
export const documentRootId = "app-root"
