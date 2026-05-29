# Transform Inspector Keying

## Purpose

After Effects users expect transform properties to expose direct key controls
near the editable values. Geometry Studio now mirrors that workflow in the
Transform inspector: Position, Rotation, and Scale each have a compact diamond
button beside the row label.

## Behavior

- The diamond button records the current row value at the current playhead time.
- If a key already exists at that time, the button shows a filled diamond and
  updates the existing key.
- If the row track is locked, the button shows a lock icon and is disabled.
- Pressing an inspector diamond also selects the matching timeline track, so the
  dope sheet, graph, and keyframe editor stay in sync.
- The command reuses the existing `setTimelineKeyframe` editor path, so Undo,
  snapping, JSON persistence, runtime rebuilds, and motion-path updates remain
  consistent with timeline row keying.

## Architecture

`Source/src/ui/transformInspector.ts` owns the DOM rendering and event binding
for the transform value grid. The editor shell passes the selected object,
current key state, and mutation callbacks into that adapter.

This keeps the inspector UI separate from `main.ts`, while `main.ts` remains the
single owner of scene mutation, Undo/Redo history, auto-keying, and timeline
runtime rebuilds.

## User Workflow

1. Select an object.
2. Set the playhead to the desired time.
3. Edit Position, Rotation, or Scale in the Transform inspector.
4. Press the row diamond beside that transform property.
5. Move to another time, edit the property again, and press the same diamond.
6. Scrub or play the timeline to preview interpolation.

Use `Set TRS` when a complete pose should be recorded across Position,
Rotation, and Scale together.

## Validation

The focused Playwright workflow verifies that:

- inspector transform key buttons are visible,
- pressing Position creates a key and switches to the Position timeline track,
- moving the playhead changes the button back to Set Key state,
- pressing Rotation creates a separate Rotation key,
- no console errors occur during the workflow.
