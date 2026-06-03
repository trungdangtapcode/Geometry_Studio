# Timeline Exponential Scale

`Expo Scale` is an After Effects style keyframe assistant for Scale animation.
It converts selected Scale endpoint keys into explicit frame keys whose values
change multiplicatively instead of linearly.

This is useful for zooms and product reveals where a constant percentage change
per frame feels smoother than a constant unit change.

## User Workflow

1. Select the Scale track for an object.
2. Create or select at least two Scale keyframes.
3. Click `Expo Scale`, or run `Apply Exponential Scale` from the command
   palette.

The earliest selected Scale key and latest selected Scale key become the
endpoints. The selected span is replaced with one Scale key per frame at the
current timeline FPS. Outside keys on the same Scale track are preserved.

Example at `2 FPS`:

| Endpoint scale | Resulting X scale keys |
| --- | --- |
| `1` at `0s`, `16` at `2s` | `1`, `2`, `4`, `8`, `16` |

## Rules

- Requires selected Scale keyframes from one object.
- Requires at least two different key times.
- The Scale track must be unlocked.
- The command uses the same 720-key safety limit as active-track baking.
- Positive scale axes use exponential interpolation. Non-positive axes fall
  back to linear interpolation.
- Generated keys use Linear interpolation because their values already encode
  the exponential curve.

## Implementation

- `Source/src/ui/template.ts` adds the `Expo Scale` toolbar button.
- `Source/src/ui/timelinePanel.ts` routes it through the selected-keyframe
  action surface.
- `Source/src/main.ts` exposes `timeline.exponential-scale`, validates selected
  Scale sources, samples frame times, replaces keys inside the selected span,
  and rebuilds the timeline runtime.

## Validation

`tests/timeline-exponential-scale.spec.ts` creates Scale keys at `0s` and `2s`,
sets FPS to `2`, runs `Expo Scale`, saves scene JSON, and verifies generated
keys at `0`, `0.5`, `1`, `1.5`, and `2s` with X scale values `1`, `2`, `4`,
`8`, and `16`.
