# Timeline Transform Keying

## Purpose

Object motion usually needs Position, Rotation, and Scale to be recorded as one
pose. A user should be able to park the playhead at \(t_0\), set an object pose,
record it, then park the playhead at \(t_1\), set a second pose, and record it
without manually keying three separate tracks.

Geometry Studio now provides `Set Pose` in the timeline and `Set Pose Key` in
the Transform inspector for this workflow.

## Behavior

- `Set Pose` / `Set Pose Key` records the selected object's current Position,
  Rotation, and Scale values at the current playhead time.
- If a key already exists on any of those tracks at that time, the command
  updates that key instead of creating a duplicate.
- The command uses one undo history entry for the whole pose record operation.
- The active track dropdown does not matter. `Set Pose` always writes transform
  tracks only.
- A single-property `Set Key` remains available for focused editing, and row
  diamonds remain available for direct row-level keying.
- Recording transform keys disables the older preset animation mode for that
  object, so authored timeline tracks remain the source of truth.

## User Workflow

1. Select an object.
2. Move the playhead to \(t_0\).
3. Set Position, Rotation, and Scale in the viewport or inspector.
4. Press `Set Pose` or `Set Pose Key`.
5. Move the playhead to \(t_1\).
6. Set the second Position, Rotation, and Scale pose.
7. Press `Set Pose` or `Set Pose Key` again.
8. Scrub or play the timeline to preview interpolation between the two poses.

This matches the expected motion-graphics pattern: key a complete pose, change
time, change the pose, key again.

## Architecture

The timeline panel exposes `onSetTransformKeyframes()` as an adapter callback.
It does not write timeline data directly. The main editor records one history
snapshot, captures Position, Rotation, and Scale before touching the timeline
runtime, then writes all three tracks and rebuilds playback once.

That keeps transform group-keying on the same code path as all other keyframe
creation semantics:

- timeline snapping
- existing-key update semantics
- runtime clip rebuild
- UI refresh
- JSON persistence
- Undo/Redo

## Testing

The Playwright smoke workflow verifies that:

- the `Set Pose Key` inspector control is visible,
- pressing it creates Position, Rotation, and Scale keys at the playhead,
- pressing it at a later time records a second pose,
- scrubbing between poses interpolates Position, Rotation, and Scale together,
- no console errors occur during the workflow.
