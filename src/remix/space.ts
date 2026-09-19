import { type CSSMixinDescriptor, css } from "remix/ui"
import { schema } from "../design/index.ts"

/**
 * The space scale as a prop type, derived from the schema rather than
 * restated: add `sp-32` there and every gap prop widens with no edit here.
 *
 * `infer N extends number` turns the token suffix into a number literal, so a
 * caller writes `gap={4}` and reads it as arithmetic on the schema's 4px unit
 * rather than as a token name they had to learn.
 */
type StepName = (typeof schema.space)[number]
export type SpaceStep = StepName extends `sp-${infer N extends number}` ? N : never

/**
 * One `css()` block per step, shared by Stack, Row and Grid.
 *
 * Shared rather than copied into each: `remix/ui` caches a block by content,
 * so three identical copies would collapse to one sub-layer and save nothing
 * — the duplication would cost only source, and drift.
 *
 * Every block declares `gap` and nothing else. That is what lets a component
 * compose one beside its own base block and stay property-disjoint, which is
 * the rule that keeps sub-layer order from deciding anything (see
 * docs/design-system.md, "Cascade layers").
 *
 * The cast is the one unchecked step: `Object.fromEntries` widens to a string
 * index signature. Keys and `SpaceStep` both derive from `schema.space`, so
 * they cannot disagree, and space.test.tsx checks the Record against the
 * schema in both directions.
 */
export const gaps = Object.fromEntries(
  schema.space.map((name) => [name.slice(3), css({ gap: `var(--${name})` })]),
) as Record<SpaceStep, CSSMixinDescriptor>
