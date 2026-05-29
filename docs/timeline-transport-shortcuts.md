# Timeline Transport Shortcuts

## Purpose

J/K/L transport control makes timeline playback feel closer to editing tools
such as Premiere, After Effects, and Blender video/timeline workflows. It keeps
playback reachable while the pointer stays on the viewport, inspector, or
timeline graph.

## Behavior

- `J` plays the timeline backward through the active Work In/Out range.
- `K` pauses playback.
- `L` plays the timeline forward through the active Work In/Out range.
- Repeated `J` or `L` presses shuttle the current direction through `1x`,
  `2x`, and `4x`.
- Pressing the opposite direction resets the shuttle speed to `1x` in that
  direction.
- `Space` keeps the existing play/pause behavior and starts forward playback
  when resuming from a paused state.

The shortcuts are ignored while a text input or select menu has focus, so
typing object names, marker labels, or numeric values does not trigger
transport playback.

## Runtime Notes

The render loop now applies a signed playback delta. Forward playback advances
toward Work Out; reverse playback moves toward Work In. Looping wraps inside
the same work area in both directions. Non-loop playback stops at the reached
work-area boundary. Shuttle speed multiplies the signed delta before the
timeline document is evaluated, so transform, camera, light, material, texture,
visibility, and motion-path preview tracks all remain synchronized.

WebM preview recording always starts with forward playback from Work In so
exports remain deterministic.
