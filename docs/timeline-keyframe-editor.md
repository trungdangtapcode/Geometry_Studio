# Timeline Keyframe Editor

## Purpose

The timeline includes an AE-style numeric keyframe editor. A selected keyframe,
or the keyframe parked under the playhead on the active track, can be retimed
and edited directly without dragging.

## Behavior

- `Key Time` retimes one active keyframe with snapping and collision checks.
- `X/Y/Z`, `R/G/B`, `FOV/Near/Far`, `U/V`, or scalar `Value` fields are shown
  based on the selected track type.
- Editing value fields updates selected keyframes. With no explicit selection,
  the editor falls back to the playhead keyframe on the active track.
- Multiple selected keyframes can receive shared value edits. Time is disabled
  for multi-selection to avoid accidental destructive retiming.
- Transform keyframe edits disable preset object animations for that object, so
  authored timeline motion remains authoritative.

## Architecture

- `ui/timelinePanel.ts` owns the compact detail strip and track-aware axis
  labeling.
- `animation/timelineEditing.ts` owns pure keyframe retime/value mutation through
  `editResolvedKeyframes`.
- `main.ts` only coordinates history, selected-object side effects, runtime
  rebuild, scene application, and UI refresh.

This keeps UI concerns, document mutation, and renderer side effects separated.
