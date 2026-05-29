# Timeline Keyframe Snap

## Purpose

Snap Selected Keyframes to Frames cleans up timing after drag edits, time
stretching, imports, or FPS changes. It gives the editor a direct way to make
selected keyframes land exactly on the current frame grid without manually
typing each key time.

## Behavior

- `Snap` rounds selected keyframe times to the nearest frame boundary using the
  timeline FPS.
- `Shift+S` runs the same command when focus is outside form fields.
- The command is independent of the timeline snap step. The snap step can be
  used for fine dragging, while this command still aligns keys to frames.
- Selected keys remain selected after snapping.
- Keyframes are skipped if the snapped time would collide with another key on
  the same track.

## Architecture

The pure operation lives in `snapResolvedKeyframesToFrames` inside
`animation/timelineEditing.ts`. It groups occupancy by track, avoids collisions
with unselected keys and selected keys that already reserved a target frame,
then lets the editor shell handle Undo/Redo, timeline rebuild, viewport
application, and selection preservation.

## Testing

The Playwright snap workflow creates off-frame Position keys with a fine snap
step and low FPS, snaps them with the toolbar command, then undoes and repeats
the same operation with `Shift+S`. The value graph provides the visible key-time
evidence.
