# Timeline Graph Marquee Selection

## Status

Implemented for the value graph. This is an editing-only feature; it does not
change the saved timeline schema.

## User-Facing Behavior

- Drag on empty value-graph space to draw a selection rectangle.
- Every visible graph key inside the rectangle becomes selected.
- A normal marquee replaces the current keyframe selection.
- `Shift`, `Ctrl`, or `Cmd` while dragging adds the marquee result to the
  current selection.
- Dragging from a key point still moves the key; marquee only starts from empty
  graph space.
- Selecting the X, Y, or Z row first focuses the graph, which makes marquee
  selection easier when channel points overlap.

## Design Rationale

AE-style animation work needs fast spatial selection. Clicking individual graph
points is precise but slow when the user wants a small group of keys. A marquee
selection matches established motion-graphics editors and keeps dense timeline
work practical without adding another mode switch.

The feature is implemented in `ui/timelineValueGraph.ts` because that module
owns SVG coordinates and visible graph points. `ui/timelinePanel.ts` only
receives the selected key IDs and updates the shared selection state.

## Implementation Notes

- The graph stores a transient pointer-drag state with start/current SVG graph
  coordinates.
- The visible rectangle is rendered by `#timeline-graph-marquee`.
- On pointer release, the graph checks visible `.timeline-graph-key` elements
  whose SVG `cx`/`cy` coordinates fall inside the rectangle.
- Duplicate X/Y/Z points for the same authored keyframe are collapsed to one
  selected keyframe ID.
- Empty replace-marquee clears the current selection. Empty additive-marquee
  leaves the existing selection unchanged.

## Testing

Automated Playwright coverage creates three Position X keys, focuses the
Position X graph row, drags a marquee over the first two visible graph keys, and
asserts that exactly those two keys are selected.

Manual check:

1. Create three Position keys.
2. Enable Graph.
3. Click the Position X row.
4. Drag a rectangle around two graph points.
5. Confirm the selection count and selected graph-key styling update.
