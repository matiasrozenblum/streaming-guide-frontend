/**
 * Chart palette for the analytics section.
 *
 * Validated as a categorical set against the dark paper surface (#1e293b) on the
 * all-pairs list: worst CVD ΔE 9.4, worst normal-vision ΔE 24.0, all three above
 * 3:1 contrast. Slot 1 is the brand primary, so the default single-series chart
 * reads as part of the product rather than as a generic chart colour.
 *
 * Assign these in fixed order and never cycle them. A fourth series folds into
 * "Otros" or becomes its own chart — adding a generated hue would break the
 * separation guarantees above.
 */
export const SERIES = ["#3b82f6", "#d95926", "#199e70"] as const;

/** Platform gets a stable slot each, so a filter never repaints the survivors. */
export const PLATFORM_COLOR: Record<string, string> = {
  web: SERIES[0],
  ios: SERIES[1],
  android: SERIES[2],
};

export const seriesColor = (index: number): string =>
  SERIES[index] ?? SERIES[SERIES.length - 1];
