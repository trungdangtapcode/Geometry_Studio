# Timeline Selected Range Preview

## Status

Implemented as a playback workflow on top of selected keyframes and Work
In/Out. It does not add timeline schema fields because the preview range is
derived from the current keyframe selection.

## User-Facing Behavior

- `Preview Sel` fits Work In/Out to the selected keyframe time span.
- The playhead jumps to the first selected keyframe.
- Playback starts forward at `1x`.
- `Shift+Space` runs the same command.
- If one keyframe is selected, the preview range expands by the larger of one
  frame, snap step, or `0.001` seconds so playback has a valid span.
- If no keyframes are selected, the editor shows a toast and leaves playback
  unchanged.

## Design Rationale

After editing a keyframe block, the immediate question is whether the motion
between the first and last selected keys reads correctly. Manually setting Work
In, setting Work Out, jumping to the start, and pressing Play is too slow for
iterative animation work. `Preview Sel` collapses that operation into one
command while still using the existing Work In/Out playback system.

The command deliberately updates Work In/Out instead of creating a temporary
hidden playback range. Visible state is easier to evaluate and matches the
project goal: every animation behavior should be inspectable from the UI.

## Implementation Notes

`main.ts` shares range calculation between `Shift+B` work-area fitting and
selected-range preview through `selectedTimelineKeyRange`. This keeps edge-case
handling consistent:

- selected IDs are resolved through the same active timeline selection model as
  nudge, rove, distribute, fit, and reverse;
- start and end are clamped to the timeline duration;
- minimum span comes from snap step or one frame;
- range values are rounded with the timeline time rounding helper.

Before starting playback, the transport is paused internally so preview always
starts at `1x`, even if the user previously pressed `L` multiple times for
shuttle playback.

## Testing

Automated coverage verifies:

- The `Preview Sel` button is visible in the core smoke test.
- Selecting keys inside Work In/Out and clicking `Preview Sel` sets Work In/Out
  to the selected span.
- Preview starts playback at `Pause 1x`.
- `Shift+Space` performs the same selected-range preview.

Manual check:

1. Create Position keys at `0`, `1`, `3`, and `5` seconds.
2. Set Work In to `1` and Work Out to `3`.
3. Press `Select Work`.
4. Press `Preview Sel`.
5. Confirm playback starts at `1`, loops or stops at `3` depending on Loop, and
   does not preview the outer keys at `0` and `5`.
