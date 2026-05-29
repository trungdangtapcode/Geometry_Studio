# Timeline Value Graph

## Purpose

The timeline now includes a compact value graph for the active track. It is a
graph-editor surface for inspecting and editing key values, not a second
animation system. It helps users verify and adjust what the authored keys will
actually do before pressing Play.

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
- Key points are drawn on top of the curves.
- Dragging a key point horizontally retimes the keyframe, and dragging
  vertically edits that keyframe channel value. For precise transform edits,
  select the X, Y, or Z row first so overlapping channel points collapse to the
  focused channel.
- A graph drag is stored as one undoable edit through the same drag snapshot
  mechanism used by dope-sheet keyframe dragging.
- Visibility tracks are drawn as value curves but remain locked because they are
  discrete on/off data, not continuous animation values.

## Architecture

`ui/timelineValueGraph.ts` owns graph rendering, key point DOM, channel
normalization, visibility persistence, and graph drag interaction.
`ui/timelinePanel.ts` resolves the active track and bridges graph events into
editor callbacks. The graph samples `animation/interpolation.ts` through
`evaluateTimelineTrack`, which is also used by playback and motion-path
preview.

The data path is:

1. User records or edits timeline keyframes.
2. The active `TimelineTrackDocument` is resolved from the selected object,
   camera, or light target.
3. The graph samples the work range with `evaluateTimelineTrack`.
4. Each enabled channel is normalized into SVG coordinates.
5. Key points are rendered at authored keyframe times and values.
6. Dragging a graph key emits keyframe time and value mutations for one axis.
7. The SVG paths are redrawn whenever the timeline document, playhead, selected
   track, selected axis, graph visibility, or dragged value changes.

This keeps the preview deterministic: if the graph shows a Hold segment, the
object also holds during playback.

## Current Scope

This graph version is intentionally focused:

- It edits keyed channel values and keyframe time but does not yet allow Bezier
  handle editing.
- It uses per-channel normalization so small changes remain visible.
- It expands the visible value range slightly so graph keys can be dragged above
  or below the current key values without immediately hitting the panel edge.

The next upgrade should add tangent handles after the dope-sheet workflow and
graph key dragging remain stable.

## Tests

The Playwright smoke workflow verifies that:

- The Graph toggle is visible.
- The graph panel opens without breaking the resizable timeline dock.
- A keyed Position track draws a non-empty X-channel SVG path.
- The graph reports the active keyed track count.
- A graph key point can be dragged horizontally and vertically to retime a
  Position key and change its value.
- Undo restores the time and value before the graph drag.
