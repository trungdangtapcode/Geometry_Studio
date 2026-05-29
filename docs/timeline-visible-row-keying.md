# Timeline Visible Row Keying

## Purpose

`Set Visible` records keyframes for every currently visible dope-sheet row at
the playhead. It is intended for AE-style workflows where the user narrows the
timeline with row filtering or search, then keys the displayed property set as
one operation.

## Behavior

- The command reads the rendered timeline rows after the active row filter and
  row search have been applied.
- Object transform axis rows are deduplicated. If Position X, Position Y, and
  Position Z are visible, the command writes one vector Position keyframe.
- Existing keyframes at the playhead are updated instead of duplicated.
- Locked tracks are skipped and reported in the toast message.
- Object transform keys clear preset procedural animation on the affected
  object, so authored timeline keys are the source of truth.
- Camera, light, object material, texture, visibility, and transform rows all
  use the same command path.

## Authoring Pattern

1. Select or search the rows that should be keyed.
2. Set the playhead to the source pose time and click `Set Visible`.
3. Change the object, camera, light, material, texture, or visibility state.
4. Move the playhead to the destination time and click `Set Visible` again.
5. Scrub or play the timeline to inspect the interpolation.

This gives the project a broader dope-sheet keying operation than `Set Key`
for the active track and `Set TRS` for object transforms only.

## Implementation Notes

- `KeyframeTimelinePanel.visibleRowTargets()` collects visible row targets from
  the timeline label DOM and deduplicates by `targetId + trackKind`.
- `main.ts` validates those targets, skips locked tracks, writes all keys under
  one undo history entry, rebuilds the timeline runtime once, and selects the
  created or updated keyframes.
- The command intentionally respects row search. Searching for `texture`, for
  example, records only Texture Repeat, Texture Offset, and Texture Rotation.
