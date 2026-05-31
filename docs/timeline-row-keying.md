# Timeline Row Keying

## Purpose

After Effects users expect each property row to be directly keyable. Geometry
Studio now adds a small diamond button on every visible timeline row so users do
not need to switch to a global track dropdown before adding a key.

## Behavior

- Clicking a row still selects that target and property track.
- Clicking the diamond button on a row selects that row and immediately creates
  or updates a keyframe at the current playhead time.
- The global key button records a full Position/Rotation/Scale pose whenever the
  active dropdown track is `Position`, `Rotation`, or `Scale`. Its label changes
  between `Set Pose` and `Update Pose`.
- The global key button still uses `Set Key` / `Update Key` for non-transform
  tracks such as material, camera, light, visibility, and texture channels.
- Row diamonds remain single-row key controls. Use them when only one transform
  property should be keyed.
- Object group rows expose the same pose-key command, so a user can key a
  complete object pose directly from the layer stack without first selecting a
  transform child row.
- Object rows select the matching scene object before writing the key.
- Camera and light rows write to their global timeline tracks.
- A row diamond is filled only when the current playhead time already has a key
  on that row. This makes the difference between setting a new key and updating
  the current key explicit.

## Architecture

The feature is implemented in `ui/timelinePanel.ts` as an adapter-level event.
The panel does not mutate timeline data directly. It selects the row target,
then calls the existing `onAddKeyframe(kind)` callback so `main.ts` remains the
single place that records history, captures the current scene value, rebuilds
runtime playback, and refreshes UI state.

This keeps the interaction AE-like without creating a second keyframe writing
path.

Group-row pose keying follows the same rule. The group button calls
`onSetObjectTransformKeyframes(targetId)`, and the editor shell reuses the
toolbar transform-key command to capture Position, Rotation, and Scale in one
undoable operation.

## Testing

The Playwright smoke workflow verifies row-level keying for:

- Object Rotation rows.
- Camera Position rows.
- Object group pose-key buttons creating selected Position, Rotation, and Scale
  keys.

The release browser smoke also verifies no console errors during row-key
creation.
