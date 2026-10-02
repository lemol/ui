import type { Handle } from "remix/component"
import {
  Badge,
  type BadgeTone,
  Button,
  type ButtonSize,
  type ButtonTone,
  Eyebrow,
  Field,
  Heading,
  type HeadingLevel,
  Row,
  Stack,
  Text,
  type TextSize,
  type TextTone,
} from "../../../../src/remix/index.ts"
import { HiddenFields, splitLocation } from "./forms.tsx"

/**
 * An allow-listed read: an unrecognised value falls back to the default
 * rather than rendering nothing, because a knob URL is user input — typed,
 * linked, bookmarked — and `?tone=primay` should show a button, not an
 * empty preview.
 */
function oneOf<T extends string>(value: string | null, options: readonly T[], fallback: T): T {
  return value !== null && options.includes(value as T) ? (value as T) : fallback
}

const buttonTones: readonly ButtonTone[] = ["primary", "neutral", "ghost", "danger"]
const buttonSizes: readonly ButtonSize[] = ["md", "sm"]
const badgeTones: readonly BadgeTone[] = ["neutral", "success", "warning", "danger", "info"]
const textTones: readonly TextTone[] = ["default", "muted", "subtle"]
const textSizes: readonly TextSize[] = ["sm", "md", "lg"]
const headingLevels: readonly HeadingLevel[] = [1, 2, 3, 4, 5, 6]

export interface KnobField {
  name: string
  label: string
  options: readonly string[]
  current: string
}

export interface KnobsFormProps {
  /** Path plus query string — see `splitLocation`. */
  location: string
  fields: readonly KnobField[]
}

/**
 * Variant controls as a GET form: submitting re-renders the catalogue route
 * on the server with the knobs in the query string. The selects are Fields,
 * so the knobs dogfood the form controls they sit beside.
 */
export function KnobsForm(handle: Handle<KnobsFormProps>) {
  return () => {
    const { pathname, params } = splitLocation(handle.props.location)
    const { fields } = handle.props
    return (
      <form action={pathname} method="get">
        <HiddenFields except={fields.map((field) => field.name)} params={params} />
        <Row align="end" gap={3} wrap>
          {fields.map((field) => (
            <Field control="select" key={field.name} label={field.label} name={field.name}>
              {field.options.map((option) => (
                <option key={option} selected={option === field.current} value={option}>
                  {option}
                </option>
              ))}
            </Field>
          ))}
          <Button tone="primary" type="submit">
            Apply
          </Button>
        </Row>
      </form>
    )
  }
}

/**
 * The caption under each preview, naming the values it shows. It is the
 * assertion surface — tone is paint, and paint is the one thing a render
 * test cannot read — and the explanation when a bookmarked `?tone=primay`
 * renders the default.
 */
function KnobCaption(handle: Handle<{ text: string }>) {
  return () => (
    <Text size="sm" tone="subtle">
      {handle.props.text}
    </Text>
  )
}

export interface KnobSectionProps {
  /** Path plus query string — see `splitLocation`. */
  location: string
}

/**
 * `?tone=primary&size=sm`, the spec's own example. The full demo below
 * still enumerates every variant; this is the one combination under test.
 */
export function ButtonKnobs(handle: Handle<KnobSectionProps>) {
  return () => {
    const { params } = splitLocation(handle.props.location)
    const tone = oneOf(params.get("tone"), buttonTones, "neutral")
    const size = oneOf(params.get("size"), buttonSizes, "md")
    return (
      <Stack gap={4}>
        <Eyebrow>Knobs</Eyebrow>
        <KnobsForm
          fields={[
            { current: tone, label: "Tone", name: "tone", options: buttonTones },
            { current: size, label: "Size", name: "size", options: buttonSizes },
          ]}
          location={handle.props.location}
        />
        <Stack gap={2}>
          <Row gap={2}>
            <Button size={size} tone={tone}>
              Preview
            </Button>
          </Row>
          <KnobCaption text={`tone="${tone}" size="${size}"`} />
        </Stack>
      </Stack>
    )
  }
}

export function BadgeKnobs(handle: Handle<KnobSectionProps>) {
  return () => {
    const { params } = splitLocation(handle.props.location)
    const tone = oneOf(params.get("tone"), badgeTones, "neutral")
    return (
      <Stack gap={4}>
        <Eyebrow>Knobs</Eyebrow>
        <KnobsForm
          fields={[{ current: tone, label: "Tone", name: "tone", options: badgeTones }]}
          location={handle.props.location}
        />
        <Stack gap={2}>
          <Row gap={2}>
            <Badge tone={tone}>Preview</Badge>
          </Row>
          <KnobCaption text={`tone="${tone}"`} />
        </Stack>
      </Stack>
    )
  }
}

export function TextKnobs(handle: Handle<KnobSectionProps>) {
  return () => {
    const { params } = splitLocation(handle.props.location)
    const tone = oneOf(params.get("tone"), textTones, "default")
    const size = oneOf(params.get("size"), textSizes, "md")
    return (
      <Stack gap={4}>
        <Eyebrow>Knobs</Eyebrow>
        <KnobsForm
          fields={[
            { current: tone, label: "Tone", name: "tone", options: textTones },
            { current: size, label: "Size", name: "size", options: textSizes },
          ]}
          location={handle.props.location}
        />
        <Stack gap={2}>
          <Text size={size} tone={tone}>
            The quick brown fox jumps over the lazy dog.
          </Text>
          <KnobCaption text={`tone="${tone}" size="${size}"`} />
        </Stack>
      </Stack>
    )
  }
}

export function HeadingKnobs(handle: Handle<KnobSectionProps>) {
  return () => {
    const { params } = splitLocation(handle.props.location)
    const level = oneOf(params.get("level"), ["1", "2", "3", "4", "5", "6"], "2")
    const parsed = Number(level) as HeadingLevel
    return (
      <Stack gap={4}>
        <Eyebrow>Knobs</Eyebrow>
        <KnobsForm
          fields={[
            {
              current: level,
              label: "Level",
              name: "level",
              options: headingLevels.map(String),
            },
          ]}
          location={handle.props.location}
        />
        <Stack gap={2}>
          <Heading level={parsed}>The quick brown fox</Heading>
          <KnobCaption text={`level={${parsed}}`} />
        </Stack>
      </Stack>
    )
  }
}
