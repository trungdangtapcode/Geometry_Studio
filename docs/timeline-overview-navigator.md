# Timeline Overview Navigator

## Purpose

Dense animation edits need a way to stay oriented after zooming into a small
timing span. The Timeline Overview Navigator adds a compact dope-sheet mini-map
above the main timeline, similar to the overview/navigator strips used in
professional editing tools.

## Behavior

- The overview spans the full timeline duration.
- Keyframe ticks show where authored keys exist across object, camera, and
  light tracks.
- Selected keyframes are highlighted in the overview.
- The work area is shown as a teal band.
- The current-time indicator is shown as a red vertical line.
- The visible timeline range is shown as a draggable highlighted window.
- Clicking outside the highlighted window scrubs the playhead to that time.
- Dragging the highlighted window pans the zoomed dope-sheet view.

## Architecture

The feature remains an adapter around existing timeline state:

- `KeyframeTimelinePanel` reads the scene timeline document and renders the
  overview DOM strip.
- Main timeline rendering, keyframe dragging, zoom, scroll, and hit testing stay
  inside `animation-timeline-js`.
- Overview panning uses `Timeline.pxToVal`, `Timeline.valToPx`, and
  `Timeline.scrollLeft`; it does not duplicate timeline scroll math.
- Overview scrubbing uses the same `onTimeChanged` callback and timeline
  snapping helper used by the marker/ruler controls.
- No scene schema fields are added because the overview is editor view state,
  not project data.

## Validation

The Playwright workflow creates transform keys, verifies overview key ticks,
clicks the overview to scrub to the middle of a longer timeline, zooms in until
the dope sheet becomes scrollable, and drags the highlighted viewport window to
confirm that the main timeline scroll position changes.
