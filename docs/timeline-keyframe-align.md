# Timeline Keyframe Alignment

## Purpose

Move Keys to Playhead is a dope-sheet timing command for blocking animation
quickly. It lets an editor park the playhead at an exact beat, select one or
more keyframes, and move the selected timing block so the first selected key
starts at the playhead.

## Behavior

- `To Playhead` moves selected keyframes so the earliest selected key lands on
  the current playhead time.
- `Shift+Enter` runs the same command when focus is outside form fields.
- Multi-key selections preserve relative spacing.
- The command is implemented through `moveResolvedKeyframesToTime` in
  `animation/timelineEditing.ts`, which reuses the same block-retiming rules as
  the numeric keyframe editor.
- Undo/Redo, collision checks, snapping, timeline rebuilds, selected-key
  preservation, and transform preset cleanup stay consistent with the rest of
  the timeline editing stack.
- If moving would collide with an unselected keyframe on the same track, that
  keyframe is skipped and the toast reports the skipped count.

## Testing

The Playwright timeline workflow creates Position keys, selects the active
track, moves the selected block with the toolbar command, then moves it again
with `Shift+Enter`. The value graph is used as the browser-visible source of
truth for the resulting key times.
