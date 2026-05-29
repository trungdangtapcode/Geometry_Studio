# Timeline Keyframe Distribution

## Purpose

Distribute Selected Keyframes spaces selected timing columns evenly across the
active Work In/Out range. This matches a common motion-graphics timing workflow:
set the important poses, define the active work area, then make the selected
keys land on clean beats without typing every time manually.

## Behavior

- `Distribute` places selected keyframes evenly from Work In to Work Out.
- `Shift+D` runs the same command when focus is outside form fields.
- At least two selected timing columns are required.
- Keyframes that share the same original time move as one timing column. This
  keeps grouped Position, Rotation, and Scale poses aligned instead of spreading
  their tracks apart.
- The command respects timeline snapping by passing target times through the
  same snap helper used by drag and numeric edit workflows.
- Selected keys remain selected after distribution.
- Unselected keyframes on the same track block collisions. Blocked keys are
  skipped and reported in the toast.

## Architecture

The pure operation lives in `distributeResolvedKeyframesAcrossRange` inside
`animation/timelineEditing.ts`. It receives resolved keyframe sources from the
editor shell, groups them by original time, computes evenly spaced target times
between Work In and Work Out, applies per-track collision checks, and returns
the changed transform object ids for runtime refresh.

The editor shell in `main.ts` owns Undo/Redo, Work In/Out selection, timeline
runtime rebuild, viewport application, and selection preservation. The timeline
panel only forwards toolbar and keyboard intent through
`onDistributeKeyframes`, keeping DOM code separate from timeline document
mutation.

## Testing

The Playwright distribution workflow creates three Position keyframes, sets a
0-6 second work area, selects the active track, distributes through the toolbar,
and verifies graph key times become `0, 3, 6`. It then undoes and repeats the
same operation with `Shift+D` to cover both UI entry points.
