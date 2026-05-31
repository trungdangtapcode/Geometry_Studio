# Timeline Keyframe Nudge

## Status

Frame-step keyframe nudging is implemented for timeline schema v10. It does not
add new saved fields; nudging edits ordinary keyframe `time` values.

## User-Facing Behavior

- `Nudge Left` and `Nudge Right` move selected keyframes by one frame.
- If no keyframe is selected, nudge uses the keyframe under the playhead on the
  active track.
- `Alt+Left` and `Alt+Right` provide the same keyboard workflow when focus is
  outside form fields.
- Multi-keyframe nudges preserve relative timing because every source keyframe
  receives the same frame offset.
- Keyframes are not moved outside the timeline duration.
- A keyframe is skipped if its new time would collide with a non-selected
  keyframe on the same track.

## Runtime Rules

The nudge step is `1 / fps`, independent of the snap interval. This keeps the
operation frame-accurate even when the user edits the snap grid for coarser or
finer timeline dragging.

After nudging, the timeline runtime is rebuilt and the playhead moves to the
earliest nudged keyframe time.

## Testing

The Playwright timeline workflow verifies that:

- Nudge controls are visible.
- A pasted Position keyframe can be nudged one frame to the right.
- The exported scene JSON contains the moved keyframe time.
