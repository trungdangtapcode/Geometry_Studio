# Timeline Visible Row Selection

## Purpose

`Select Visible` selects every keyframe on the rows currently shown in the
timeline. It complements `Set Visible`: row search and row filters can now be
used both to create keys and to select the exact property set that should be
copied, pasted, nudged, reversed, snapped, distributed, or fit to the work area.

## Behavior

- The command respects the current timeline row filter, including Focus,
  Selected Layer, Selected Keyed, Keyed, Pinned, and All.
- The command respects row search. Searching for `texture`, for example, limits
  selection to visible texture tracks.
- X/Y/Z rows are deduplicated because transform tracks are stored as vector
  keyframes.
- The toolbar button selects all keyframes on visible rows.
- `Ctrl/Cmd+Alt+A` selects all keyframes on visible rows.
- `Ctrl/Cmd+Alt+Shift+A` selects visible-row keyframes inside Work In/Out.
- Command Palette `Select Visible Row Keys Before Playhead` selects visible-row
  keyframes earlier than the current playhead time.
- Command Palette `Select Visible Row Keys After Playhead` selects visible-row
  keyframes later than the current playhead time.

## Workflow

1. Filter or search the timeline rows that represent the property group to edit.
2. Click `Select Visible` or press `Ctrl/Cmd+Alt+A`.
3. Use existing keyframe tools such as Copy, Paste, Nudge, Reverse, Snap,
   Distribute, Fit Keys, or Preview Sel.
4. For work-area-only edits, set Work In/Out and press
   `Ctrl/Cmd+Alt+Shift+A`.
5. For tail edits, park the playhead at the edit point and use the Command
   Palette to select visible-row keys before or after the playhead.

This makes the timeline behave more like a real dope sheet: visible properties
become an editable selection scope instead of only a display filter.
