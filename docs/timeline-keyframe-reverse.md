# Timeline Keyframe Reverse

## Purpose

Time Reverse Keyframes mirrors the selected timing block, matching the common
After Effects keyframe assistant workflow. It is useful for quickly turning an
ease-in motion into an ease-out return, reversing a camera move, or checking
alternate timing without rebuilding keys manually.

## Behavior

- `Reverse` mirrors selected keyframe times inside the selected time span.
- `Shift+R` runs the same command when focus is outside form fields.
- Keyframe values and interpolation modes stay attached to their original
  keyframes, so reversing timing reverses the motion.
- Multi-track selections are supported because the operation works on resolved
  object, camera, and light keyframe sources.
- Unselected keyframes on the same track block collisions. Blocked keys are
  skipped and reported in the toast.

## Architecture

The pure operation lives in `reverseResolvedKeyframes` inside
`animation/timelineEditing.ts`. The editor shell handles selection, Undo/Redo,
runtime rebuild, viewport application, and selected-key preservation after the
helper updates the document.

## Testing

The Playwright keyframe timing workflow creates Position keys, moves the
selected block to the playhead, reverses it with `Shift+R`, verifies the
evaluated transform value changed at the first key time, then reverses it again
with the toolbar button.
