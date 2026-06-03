# Timeline Bake Track

`Bake` converts the active timeline track from sparse or interpolated keyframes
into explicit frame keys across Work In/Out.

This supports the motion-graphics workflow where procedural motion or a sparse
curve is converted into editable keyframes before final timing tweaks.

## User Workflow

1. Select the object, camera, or light track to bake.
2. Set Work In and Work Out around the range to convert.
3. Set FPS to the frame rate you want to sample.
4. Click `Bake`, or run `Bake Active Track To Frame Keys` from the command
   palette.

The command samples the active track at one key per frame, replaces the active
track with those sampled keys, and selects the baked keys.

## Rules

- The active track must already have keyframes.
- The active track must be enabled and unlocked.
- Work In/Out must be a non-empty range.
- A safety limit rejects ranges that would create more than 720 frame keys.
- Baked keys use Linear interpolation because their values already capture the
  sampled motion at frame resolution.

## Implementation

- `Source/src/ui/template.ts` adds the `Bake` toolbar button beside active
  track controls.
- `Source/src/ui/timelinePanel.ts` enables the button only when the active track
  is keyed, enabled, and unlocked.
- `Source/src/main.ts` exposes `timeline.bake-track`, samples with
  `evaluateTimelineTrack()`, replaces the active track with
  `createTimelineKeyframe()` results, and rebuilds the timeline runtime.

## Validation

`tests/timeline-bake-track.spec.ts` sets a `0-1s` work area at `4 FPS`, creates
Position keys at `0s` and `1s`, clicks `Bake`, saves JSON, and verifies the
resulting keys at `0`, `0.25`, `0.5`, `0.75`, and `1s`.
