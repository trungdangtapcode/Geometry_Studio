# Timeline Row Value Readouts

## Purpose

After Effects exposes property values directly beside keyframed properties. That
matters when animating because the user needs to see the current value while
scrubbing, not only the key markers.

Geometry Studio now shows live value readouts in the left dope-sheet row labels.
For example, Position X displays the current X value, Rotation Y displays the
current Y rotation in degrees, material rows show scalar or color values, and
texture rotation is shown in degrees.

## Behavior

- Object rows read from the selected scene object, so values update immediately
  after numeric inspector edits, TransformControls edits, timeline scrubbing,
  and playback evaluation.
- Camera and light rows show evaluated values when their tracks have keyframes.
- Axis-expanded transform rows show one channel value, matching the row name.
- Vector rows show compact comma-separated values.
- Color rows show a hex color.
- Visibility rows show `On` or `Off`.

## Architecture

`ui/timelinePanel.ts` owns the display because it already renders the
dope-sheet row labels. It imports:

- `timelineValueForEntry()` for current object values.
- `evaluateTimelineTrack()` for keyed camera and light values.

The scene document schema does not change. This is an editor presentation
feature over the existing timeline data and runtime evaluator.

## Validation

Playwright verifies that:

- Position and Rotation row labels show current inspector values.
- A keyed Position X row updates to the interpolated value while scrubbing
  between two transform pose keys.
