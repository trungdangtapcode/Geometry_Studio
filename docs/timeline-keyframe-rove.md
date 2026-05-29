# Timeline Keyframe Rove

## Purpose

Rove Across Time evens out interior selected timing columns while keeping the
first and last selected timing columns fixed. This adapts the motion-graphics
workflow from After Effects, where roving keyframes are used to smooth timing
between surrounding keyframes.

Reference: Adobe describes roving keyframes as available for spatial properties
and notes that Rove Across Time lets a keyframe interpolate smoothly between
surrounding keyframes:
https://helpx.adobe.com/after-effects/using/speed.html

## Behavior

- `Rove` keeps the first and last selected timing columns at their original
  times.
- `Shift+V` runs the same command when focus is outside form fields.
- At least three selected timing columns are required.
- Interior timing columns are evenly spaced between the endpoints.
- Keyframes that share the same original time move as one timing column, so
  grouped Position, Rotation, and Scale poses stay aligned.
- The command respects the current timeline snap setting after computing target
  times.
- Selected keys remain selected after roving.
- Unselected keyframes on the same track block collisions and are reported as
  skipped.

## Difference From Related Commands

- `Center` moves a selected timing block around the playhead.
- `Distribute` evenly spaces selected timing columns across Work In/Out.
- `Fit Keys` scales selected timing columns proportionally into Work In/Out.
- `Rove` only adjusts interior selected timing columns between their existing
  selected endpoints.

## Architecture

The pure operation lives in `roveResolvedKeyframesAcrossTime` inside
`animation/timelineEditing.ts`. It reuses the grouped retiming helper used by
Distribute and Fit, so collision handling, grouped timing columns, snapping,
track sorting, and changed-transform reporting stay consistent.

The editor shell in `main.ts` records Undo history, runs the pure helper, and
finishes through `finishTimelineKeyframeEdit` for runtime rebuild, viewport
application, selection preservation, and toast reporting. The timeline panel
only forwards toolbar and keyboard intent through `onRoveKeyframesAcrossTime`.

## Testing

The Playwright rove workflow creates uneven Position keyframes at `0, 1, 4, 6`,
selects the active track, roves through the toolbar, and verifies graph key
times become `0, 2, 4, 6`. It then undoes and repeats the same operation with
`Shift+V`.
