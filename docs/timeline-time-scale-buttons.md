# Timeline 50% / 200% Timing Scale Buttons

## Purpose

The `50%` and `200%` buttons provide a fast After Effects-style timing stretch
workflow for selected keyframes. They are intended for the common case where the
motion shape is correct but the timing is too slow or too fast.

## Behavior

- `50%` compresses selected key timing to half of the current span.
- `200%` stretches selected key timing to double the current span.
- The first selected timing column remains anchored.
- All later selected timing columns scale proportionally.
- Keyframe values and interpolation metadata are preserved.
- Existing locked-track checks, snapping, Undo history, runtime rebuilds, and
  motion-path updates are reused.

Example:

| Source | 50% | 200% after 50% |
| --- | --- | --- |
| `0s, 2s, 4s` | `0s, 1s, 2s` | `0s, 2s, 4s` |

## Architecture

- `Source/src/main.ts` owns the two commands and computes the target span.
- `stretchResolvedKeyframesToSpan` in `timelineEditing.ts` performs the actual
  proportional retime, so the new buttons do not introduce a second timing
  algorithm.
- `Source/src/ui/timelinePanel.ts` exposes a generic
  `onScaleKeyframeTiming(factor, keyframeIds)` callback.
- `Source/src/ui/template.ts` contains the toolbar buttons and Quick Help entry.

## Validation

`tests/timeline-time-scale-buttons.spec.ts` creates three Position keys,
clicks `50%`, verifies timing becomes `0s, 1s, 2s`, then clicks `200%` and
verifies timing returns to `0s, 2s, 4s` while values remain unchanged.
