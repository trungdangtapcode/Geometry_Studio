# Auto-Key Initial Pose

## Purpose

Auto-Key should create useful motion with the fewest steps. In motion graphics
tools, a common workflow is:

1. Enable Auto-Key.
2. Move the playhead to a later time.
3. Change an object transform or camera value.
4. Scrub backward and see motion from the original pose to the edited pose.

If the editor writes only the later key, there is no visible interpolation. The
track stays constant because there is no earlier authored value. Geometry Studio
now seeds the initial value automatically when a supported Auto-Key track has no
existing keys.

## Behavior

- Applies to object Position, Rotation, Scale, and camera Position, Target, and
  Lens auto-key edits.
- If the playhead is after `Work In` and the edited track has no
  keyframes, the editor writes the pre-edit value at `Work In`.
- The edited value is then written at the current playhead time.
- If the track already has any keyframes, Auto-Key updates only the current
  playhead key as before.
- When Auto-Key is enabled, the timeline dock shows an active recording state so
  the user can see that edits will write keys.
- Manual `Set Key`, row diamonds, and `Set TRS` keep their explicit behavior.
- The operation uses the same Undo snapshot as the transform edit.

## Architecture

`main.ts` owns the mutation because it already coordinates Undo/Redo, the
timeline document, TransformControls, and the selected object.

For numeric inspector edits, the previous value is captured before the input
mutation. For viewport TransformControls drags, the selected object's Position,
Rotation, and Scale are captured when dragging starts. The helpers
`seedInitialTransformAutoKey()` and `seedInitialCameraAutoKey()` write a Work In
key only when the destination track is empty and unlocked.

This keeps the saved JSON format unchanged: seeded keys are ordinary timeline
keyframes.

## Validation

Focused Playwright workflows verify object Position and camera Position:

- enable Auto-Key,
- move the playhead to one second,
- edit the value,
- verify the timeline interpolates halfway at `0.5s`,
- verify saved scene JSON contains both the Work In key and edited key.
