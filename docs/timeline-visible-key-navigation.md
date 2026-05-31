# Timeline Visible Key Navigation

## Purpose

Visible key navigation jumps the playhead to the previous or next keyframe on
the rows currently shown in the dope sheet. It complements active-track
navigation by making row search and row filters behave like an editing scope.

## Behavior

- The command respects the current timeline row filter, including Focus,
  Selected Layer, Selected Keyed, Keyed, Pinned, and All.
- The command respects row search. Searching for `texture`, for example, jumps
  only between visible texture key columns.
- X/Y/Z transform rows are deduplicated because transform tracks are stored as
  vector keyframes.
- Toolbar commands:
  - Previous visible-row keyframe.
  - Next visible-row keyframe.
- Keyboard shortcuts:
  - `Ctrl/Cmd+Alt+Left`: previous visible-row keyframe.
  - `Ctrl/Cmd+Alt+Right`: next visible-row keyframe.

## Workflow

1. Filter or search the timeline to the properties being edited.
2. Use visible key navigation to move between timing columns in that filtered
   view.
3. Use `Select Time` when the current timing column should be edited as a pose
   group.

This makes the filtered dope sheet function as a real editing surface rather
than only a visual filter.
