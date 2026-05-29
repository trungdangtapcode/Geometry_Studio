# Timeline Visible Time Selection

## Purpose

`Select Time` selects visible-row keyframes at the current playhead time. This
supports pose-column editing: after recording a group of properties with
`Set Visible`, the user can select only the keys that belong to the current
timing column and copy, delete, paste, nudge, or retime that column.

## Behavior

- The command respects the current row filter and row search.
- X/Y/Z rows are deduplicated because transform tracks are stored as vector
  keyframes.
- Only keyframes whose time matches the playhead within a small floating-point
  tolerance are selected.
- Toolbar command: `Select Time`.
- Keyboard shortcut: `Ctrl/Cmd+Alt+K`.

## Workflow

1. Use row search or filters to isolate a property group.
2. Move the playhead to a pose time.
3. Click `Select Time` or press `Ctrl/Cmd+Alt+K`.
4. Use Copy, Delete, Paste, Nudge, Move to Playhead, Reverse, Snap, or other
   keyframe commands on that pose column.

This is the dope-sheet counterpart to selecting a vertical column of keys in a
motion-graphics editor.
