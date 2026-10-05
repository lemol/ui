import { css, type Handle, type MixInput } from "remix/component"

const progressStyle = css({
  inlineSize: "100%",
  blockSize: "var(--ui-meter-height)",
  accentColor: "var(--ui-meter-fill)",
})

const meterStyle = css({
  inlineSize: "100%",
  blockSize: "var(--ui-meter-height)",
})

export interface ProgressProps {
  /**
   * Omit for an indeterminate `<progress>` — no `value` attribute is what
   * gives it the UA's own animated, no-JS loading state.
   */
  value?: number | undefined
  max?: number | undefined
  mix?: MixInput<HTMLProgressElement> | undefined
}

export function Progress(handle: Handle<ProgressProps>) {
  return () => {
    const { value, max = 1, mix } = handle.props

    return <progress max={max} mix={[progressStyle, mix]} value={value} />
  }
}

export interface MeterProps {
  /** Required: a gauge with nothing to show is not a gauge. */
  value: number
  min?: number | undefined
  max?: number | undefined
  low?: number | undefined
  high?: number | undefined
  optimum?: number | undefined
  mix?: MixInput<HTMLMeterElement> | undefined
}

export function Meter(handle: Handle<MeterProps>) {
  return () => {
    const { value, min, max = 1, low, high, optimum, mix } = handle.props

    return (
      <meter
        high={high}
        low={low}
        max={max}
        min={min}
        mix={[meterStyle, mix]}
        optimum={optimum}
        value={value}
      />
    )
  }
}
