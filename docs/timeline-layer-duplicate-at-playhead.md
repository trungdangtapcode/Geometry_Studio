# Timeline Layer Duplicate At Playhead

Duplicate Selected Layer At Playhead is an AE-style command for copying the
selected object layer and shifting the copied layer timing so its layer start
lands at the current playhead.

Use it when you have one animated object and want a second copy to perform the
same animation later in the shot without manually copying, pasting, and moving
every keyframe.

## User Workflow

1. Select an object in the viewport, outliner, or timeline.
2. Create Position, Rotation, Scale, material, texture, visibility, camera, or
   other object keys on that selected layer.
3. Move the playhead to the desired start time for the duplicate.
4. Open the Command Palette and run `Duplicate Selected Layer At Playhead`, or
   press `Ctrl+Alt+Shift+D`.
5. The copied layer becomes selected. Its copied keyframes are shifted so the
   copied layer begins at the playhead.

`Ctrl+Alt+D` remains the normal duplicate command: it copies the layer while
keeping the original keyframe times. `Ctrl+Alt+Shift+D` copies and retimes the
new layer to the current time.

## Behavior

- Duplicates the selected object and its timeline tracks.
- Generates fresh object, track, and keyframe IDs.
- Preserves geometry, material, parent relationship, interpolation, easing,
  track enable state, solo state, and lock state.
- Shifts copied object tracks, including object visibility keys, by the delta
  from the source layer start to the current playhead.
- Selects the copied layer and copied keyframes after the command runs.
- Skips copied keys that would move outside the scene duration and reports the
  skipped count in the toast.

The command shifts the new duplicate even if copied tracks are locked, because
the shift is part of layer creation rather than an edit to the original source
layer. The copied track lock state is still preserved after placement.

## Implementation

- `main.ts` exposes `timeline.duplicate-layer-at-playhead` in the Command
  Palette with shortcut `Ctrl+Alt+Shift+D`.
- `duplicateEntryWithTimeline()` centralizes object duplication and
  `copyTimelineObject()` usage for both duplicate commands.
- `shiftDuplicatedLayerTracks()` retimes the copied object timeline, including
  visibility tracks, then rebuilds runtime animation clips and reapplies the
  playhead pose.
- No permanent toolbar button is added, keeping the timeline UI compact while
  still making the command searchable.

## Validation

`Source/tests/timeline-layer-duplicate-at-playhead.spec.ts` creates transform
keys at time `0`, moves the playhead to `2s`, runs the Command Palette command,
saves the scene JSON, and verifies that the selected duplicate has Position,
Rotation, and Scale keys at `2s` while the source layer keeps its original keys.
