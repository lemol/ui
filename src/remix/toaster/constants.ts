/**
 * Shared between `toaster.tsx`, which writes this attribute, and
 * `runtime.ts`, which reads it — a leaf module with no framework import so
 * neither side has to import the other to agree on the name.
 */
export const TOAST_DURATION_ATTR = "data-ui-toast-duration"

/** Milliseconds a toast stays before `--dismiss-toast` hides it, absent an explicit `duration`. */
export const DEFAULT_TOAST_DURATION_MS = 5000
