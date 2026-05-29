# Timeline Visible Time Duplicate

## Purpose

`Dup Time` duplicates visible-row keyframes at the current playhead time by the
timeline snap step. It is a one-command pose-column duplicate workflow built on
top of `Select Time` and the existing duplicate-keyframe operation.

## Behavior

- The command respects the current row filter and row search.
- Only keyframes on visible rows at the current playhead time are duplicated.
- Duplicates are offset by the active snap step, matching normal selected-key
  duplication.
- If the destination time is occupied on a track, the duplicate is moved to the
  next available snapped time on that same track.
- Duplicated keyframes stay selected for immediate retiming or easing.
- Toolbar command: `Dup Time`.

## Workflow

1. Filter or search the timeline to the property group being edited.
2. Move the playhead to the pose column to duplicate.
3. Click `Dup Time`.
4. Move or edit the duplicated column with the existing timeline tools.

This reduces a common dope-sheet workflow from select-column, duplicate, and
retime into a direct pose-column command.
