# Timeline Keyframe Deselect

## Purpose

After Effects users need a fast way to clear selected keyframes before deleting
objects, changing tools, or selecting another timing block. Geometry Studio now
uses `Escape` for that timeline selection reset.

## Behavior

- `Escape` clears explicitly selected timeline keyframes.
- The selected scene object is not changed.
- The playhead time is not changed.
- If the playhead is parked on a keyframe after the selection is cleared, the UI
  can still show a playhead key as active. That is not a selected keyframe.
- The Command Palette exposes the same action as `Deselect Timeline Keyframes`.
- Text inputs, row search, object renaming, Quick Help, and the Command Palette
  keep their own `Escape` behavior first.

## Implementation

`KeyframeTimelinePanel.clearSelectedKeyframes()` owns the selected keyframe ID
set and refreshes the dope sheet, key editor, value graph, and selection label.
`main.ts` exposes the action through the command palette and global keyboard
handler so all selection state still flows through the timeline panel adapter.

The command is intentionally not undoable because it changes editor selection
state only, not scene data or timeline data.

## Testing

The Playwright workflow creates transform pose keys, moves the playhead between
keys, presses `Escape`, and verifies:

- selected-key count returns to `No keyframe selected`;
- the key editor label clears;
- the scene object remains selected.
