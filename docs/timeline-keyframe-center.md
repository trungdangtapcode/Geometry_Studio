# Timeline Keyframe Center

## Purpose

Center Selected Keyframes on Playhead aligns the middle of the selected timing
block to the current playhead time. It complements Move Keys to Playhead:
Move aligns the first selected key to the playhead, while Center preserves the
selected block and places its midpoint on the edit beat.

## Behavior

- `Center` shifts selected keyframes so their selected time span is centered on
  the playhead.
- `Shift+C` runs the same command when focus is outside form fields.
- A single selected key moves directly to the playhead.
- Multi-key selections keep their internal spacing.
- The selected block is clamped to the timeline duration when the requested
  center would push keys before `0` or after the end.
- Unselected keyframes on the same track still block collisions through the
  shared timeline edit path.
- Selected keys remain selected after centering.

## Architecture

The pure operation lives in `centerResolvedKeyframesOnTime` inside
`animation/timelineEditing.ts`. It computes the selected span, derives the
anchor time needed to put the span midpoint on the playhead, clamps that anchor
inside the timeline duration, and delegates to the same edit operation used by
Move Keys to Playhead.

The editor shell now uses `finishTimelineKeyframeEdit` for common keyframe edit
completion: changed transform preset cleanup, runtime rebuild, timeline player
sync, camera/light/object property application, UI refresh, selection
preservation, and toast reporting. This keeps new keyframe assistants from
adding another copy of the same command-finalization flow to `main.ts`.

## Testing

The Playwright center workflow creates Position keys at `0, 2, 4`, parks the
playhead at `3`, centers through the toolbar, and verifies graph key times
become `1, 3, 5`. It then undoes and repeats the same operation with `Shift+C`
to cover both UI entry points.
