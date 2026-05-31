# Timeline Keyframe Editor

## Purpose

The timeline includes an AE-style numeric keyframe editor. A selected keyframe,
or the keyframe parked under the playhead on the active track, can be retimed
and edited directly without dragging.

## Behavior

- `Key Time` retimes one active keyframe with snapping and collision checks.
  When multiple keyframes are selected, it edits the earliest selected key as
  the anchor and shifts the selected block while preserving relative spacing.
- `Span` is enabled for selected keyframes at two or more distinct times. It
  time-stretches the selected block from the earliest selected key.
- `X/Y/Z`, `R/G/B`, `FOV/Near/Far`, `U/V`, or scalar `Value` fields are shown
  based on the selected track type.
- Editing value fields updates selected keyframes. With no explicit selection,
  the editor falls back to the playhead keyframe on the active track.
- Keyframe-specific commands are disabled when there is no selected keyframe
  and no active-track keyframe under the playhead.
- Multiple selected keyframes can receive shared value edits. Their time can
  also be edited as an anchored group retime or proportional span stretch.
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
