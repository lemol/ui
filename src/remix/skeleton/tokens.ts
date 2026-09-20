/**
 * Skeleton's contract. Five names — see `spinner/tokens.ts` for why there is
 * no reduced-motion token: `--ui-skeleton-duration` reads `--dur-slow`, and
 * the global reset zeroes it under `prefers-reduced-motion: reduce`.
 */
export const skeletonTokens = {
  "ui-skeleton-bg": "var(--surface-hover)",
  "ui-skeleton-shimmer": "var(--surface-active)",
  "ui-skeleton-radius": "var(--r-sm)",
  "ui-skeleton-duration": "var(--dur-slow)",
  "ui-skeleton-easing": "var(--ease-in-out-smooth)",
} as const
