# Timeline Playhead Ruler

## Status

The timeline now exposes an After Effects style Current Time Indicator in the
header ruler and layer overview:

- A red playhead handle appears in the marker/work-area strip.
- The playhead line continues through the layer overview strip, so object layer
  ranges can be compared against the current frame.
- Dragging the handle scrubs the timeline using the existing timeline snapping
  settings.

## Runtime Rules

- Dragging the playhead calls the same `onTimeChanged` path as numeric time
  input, timeline canvas scrubbing, transport buttons, and keyboard shortcuts.
- Timeline playback state, camera tracks, light tracks, object tracks, and UI
  readouts all update from the existing central time-change flow.
- The ruler handle has higher pointer priority than markers and work-area
  editing, so grabbing the Current Time Indicator never accidentally retimes a
  marker or trims the work area.
- The layer overview playhead is visual only and does not intercept layer range
  dragging.

## Testing

Playwright verifies that:

1. The ruler playhead and layer playhead render on startup.
2. Dragging the ruler playhead to `4s` updates the timeline time input and
   handle state.
3. Dragging back to `1s` updates the same state without console errors.

Manual check:

1. Enable snapping and set Snap to `1`.
2. Drag the red playhead handle to `4s`.
3. Confirm Time reads `4`, the viewport updates, and the red layer line aligns
   with the same timeline position.
4. Drag the handle back to `1s`.
5. Confirm markers and work-area handles still drag independently.
