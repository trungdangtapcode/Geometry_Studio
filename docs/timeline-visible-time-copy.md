# Timeline Visible Time Copy

## Purpose

`Copy Time` copies visible-row keyframes at the current playhead time. It is a
direct pose-column copy command for the filtered dope sheet.

## Behavior

- The command respects the current row filter and row search.
- Only visible-row keyframes at the current playhead time are copied.
- The copied keys use the same clipboard payload as normal selected-key Copy.
- Pasting at another playhead time preserves relative timing and interpolation.
- Toolbar command: `Copy Time`.

## Workflow

1. Filter or search the timeline to the property group being edited.
2. Move the playhead to the pose column to copy.
3. Click `Copy Time`.
4. Move the playhead to the destination time.
5. Click `Paste`.

This reduces a common filtered dope-sheet workflow from select-column, copy,
move, paste into a direct column-copy operation.
