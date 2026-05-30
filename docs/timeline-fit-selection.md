# Timeline Fit Selected Keyframes

## Purpose

Fit Selected Keyframes gives the dope sheet an After Effects style way to zoom
the timeline view around the current edit. The existing `0` command fits the
whole composition duration; this command fits the selected keyframe range so
dense timing edits do not require repeated manual zoom and scroll operations.

## Behavior

- The toolbar exposes a `Fit selected keyframes` icon beside the full-duration
  fit button.
- The Command Palette exposes the same action as `Fit Selected Keyframes`.
- The command is disabled until the active timeline context has a selected or
  playhead keyframe.
- Multiple selected keyframes fit their full time span with side padding.
- A single selected or playhead keyframe fits a small minimum time window around
  that key so the playhead remains visible instead of producing an unusable
  maximum zoom jump.

## Architecture

`main.ts` keeps ownership of selected-keyframe source resolution through the
existing `selectedTimelineKeyRange()` helper. `KeyframeTimelinePanel` only owns
the view operation through `fitTimelineToRange(start, end)`, which uses
`animation-timeline-js` public methods:

- `setZoom()` to scale time horizontally.
- `valToPx()` to convert the fitted range start into timeline pixels.
- `scrollLeft` to bring the range into view with padding.

This keeps edit-state rules in the application shell while keeping view math in
the timeline panel adapter.

## Validation

Playwright verifies that the command is disabled before a keyframe exists,
becomes enabled after setting a key, and increases the timeline zoom level when
executed from the Command Palette.
