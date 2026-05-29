# Timeline Visible Time Delete

## Purpose

`Del Time` deletes visible-row keyframes at the current playhead time. It is a
direct pose-column delete command for the filtered dope sheet.

## Behavior

- The command respects the current row filter and row search.
- Only visible-row keyframes at the current playhead time are deleted.
- Locked tracks still block deletion through the same safety path as selected
  keyframe deletion.
- Deleted keyframes are removed under one undo history entry.
- Toolbar command: `Del Time`.

## Workflow

1. Filter or search the timeline to the property group being edited.
2. Move the playhead to the pose column to remove.
3. Click `Del Time`.

This avoids the repeated select-column-then-delete sequence when cleaning up
pose timing columns.
