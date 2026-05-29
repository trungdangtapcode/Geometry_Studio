# Timeline Keyframe Fit

## Purpose

Fit Selected Keyframes to Work Area time-stretches the selected key block into
the active Work In/Out range while preserving the authored spacing between
timing columns. It is the precise command version of scaling selected timing in
a graph or dope sheet.

## Behavior

- `Fit Keys` maps the earliest selected timing column to Work In and the latest
  selected timing column to Work Out.
- `Shift+F` runs the same command when focus is outside form fields.
- Interior timing columns keep their proportional spacing.
- Keyframes that share the same original time move as one timing column, so
  grouped Position, Rotation, and Scale poses stay aligned.
- The command respects timeline snapping after computing the proportional target
  times.
- Selected keys remain selected after fitting.
- Unselected keyframes on the same track block collisions. Blocked keys are
  skipped and reported in the toast.

## Architecture

The pure operation lives in `fitResolvedKeyframesToRange` inside
`animation/timelineEditing.ts`. It reuses the shared grouped retiming helper
also used by keyframe distribution. The helper owns grouped-time detection,
per-track occupancy, collision checks, snap-aware retiming, changed-track
sorting, and changed-transform reporting.

The editor shell in `main.ts` owns Undo/Redo, Work In/Out inputs, timeline
runtime rebuild, viewport application, and selection preservation. The timeline
panel exposes the command through `onFitKeyframesToWorkArea` without mutating
timeline data directly.

## Difference From Distribution

- `Distribute` ignores original spacing and creates equal spacing.
- `Fit Keys` preserves original spacing ratios while scaling the whole selected
  time span into Work In/Out.

## Testing

The Playwright fit workflow creates uneven Position keyframes at `1, 2, 5`,
sets a `0-8` second work area, fits with the toolbar, and verifies graph key
times become `0, 2, 8`. It then undoes and repeats the same operation with
`Shift+F` to cover both UI entry points.
