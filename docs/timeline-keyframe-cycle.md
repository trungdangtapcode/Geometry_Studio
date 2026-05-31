# Timeline Keyframe Cycle

## Purpose

Cycle repeats a selected keyframe block forward until Work Out. It is the
timeline-editor equivalent of a simple motion-graphics loop assistant: build a
small pattern once, select it, then extend that pattern across the active work
area without manually copy/pasting every beat.

## Behavior

- The command requires at least two selected keyframes with different times.
- It works across object, camera, and light tracks because it operates on
  resolved timeline keyframe sources.
- The selected timing block is repeated after its last selected key.
- The repeat period is the selected block span plus the smallest spacing between
  selected timing columns. For example, selected keys at `0s` and `1s` repeat at
  `2s`, `3s`, `4s`, `5s`, and so on.
- Work Out is the hard boundary. The command creates only full repeat cycles
  whose last duplicated key lands at or before Work Out.
- Values and interpolation modes are copied exactly.
- Existing unselected keys on the destination track block collisions; blocked
  keys are skipped and reported in the toast.
- Locked selected tracks block the operation before editing.
- Newly created repeated keys become selected after the command.

## User Workflow

1. Create a small keyframe pattern, such as Position keys at `0s` and `1s`.
2. Set Work Out to the end of the range that should receive repeats.
3. Select the pattern keys.
4. Click `Cycle`, press `Shift+Y`, or run `Cycle Selected Keyframes To Work Out`
   from the Command Palette.
5. Scrub or press Play to preview the repeated motion.

## Architecture

The pure timeline operation lives in
`animation/timelineEditing.ts` as
`cycleResolvedKeyframesAcrossWorkArea`. It accepts already-resolved keyframe
sources, duplicates document keyframes only, and returns created key IDs plus
changed transform object IDs. The editor shell in `main.ts` handles Undo/Redo,
preset-animation conflict cleanup, runtime rebuild, viewport application, and
selection.

This keeps the feature aligned with the existing retiming helpers such as
Reverse, Rove, Fit, Stagger, and Cascade.

## Testing

The Playwright workflow creates two Position keys at `0s` and `1s`, selects the
active track keys, runs `Cycle`, saves the scene JSON, and verifies the Position
track expands to `0s` through `7s` with alternating values copied from the
source pattern.
