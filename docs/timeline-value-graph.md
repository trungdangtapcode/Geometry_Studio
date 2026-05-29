# Timeline Value Graph

## Purpose

The timeline now includes a compact value graph for the active track. This is a
graph-editor preview, not a second animation system. It helps users verify what
the authored keys will actually do before pressing Play.

## Behavior

- The Graph toolbar button toggles the value graph panel.
- The panel follows the selected timeline track and the selected object, camera,
  or light target.
- Position, Rotation, and Scale can show X, Y, and Z curves.
- When an X, Y, or Z row is selected, the graph focuses on that channel.
- Scalar tracks such as Opacity or light Intensity show one curve.
- The vertical playhead line follows scrubbing and playback.
- Hold, Linear, and Easy Ease segments are drawn from the same evaluator used by
  runtime playback.

## Architecture

`ui/timelinePanel.ts` owns the graph UI because it is an editor surface tied to
the active track and playhead. It samples `animation/interpolation.ts` through
`evaluateTimelineTrack`, which is also used by playback and motion-path
preview.

The data path is:

1. User records or edits timeline keyframes.
2. The active `TimelineTrackDocument` is resolved from the selected object,
   camera, or light target.
3. The graph samples the work range with `evaluateTimelineTrack`.
4. Each enabled channel is normalized into SVG coordinates.
5. The SVG paths are redrawn whenever the timeline document, playhead, selected
   track, selected axis, or graph visibility changes.

This keeps the preview deterministic: if the graph shows a Hold segment, the
object also holds during playback.

## Current Scope

This first graph version is intentionally lightweight:

- It previews values but does not yet allow Bezier handle editing.
- It uses per-channel normalization so small changes remain visible.
- It focuses on validation and authoring clarity before adding editable curve
  tangents.

The next upgrade should add draggable graph keys and tangent handles only after
the dope-sheet workflow is stable.

## Tests

The Playwright smoke workflow verifies that:

- The Graph toggle is visible.
- The graph panel opens without breaking the resizable timeline dock.
- A keyed Position track draws a non-empty X-channel SVG path.
- The graph reports the active keyed track count.
