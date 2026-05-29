# Timeline Visible Time Cut

## Purpose

`Cut Time` cuts visible-row keyframes at the current playhead time. It is a
direct pose-column cut command for the filtered dope sheet.

## Behavior

- The command respects the current row filter and row search.
- Only visible-row keyframes at the current playhead time are cut.
- Cut keyframes are copied into the same clipboard payload used by normal
  selected-key Copy and `Copy Time`.
- Object keys cut by `Cut Time` paste back to their original objects, preserving
  multi-object pose columns.
- Locked tracks still block cutting through the same safety path as selected
  keyframe deletion.
- Removed keyframes are deleted under one undo history entry.
- Toolbar command: `Cut Time`.

## Workflow

1. Filter or search the timeline to the property group being edited.
2. Move the playhead to the pose column to cut.
3. Click `Cut Time`.
4. Move the playhead to the destination time.
5. Click `Paste`.

This supports an After Effects style pose-column move: cut the current filtered
column, park the playhead somewhere else, then paste it back with relative
timing and interpolation preserved.
