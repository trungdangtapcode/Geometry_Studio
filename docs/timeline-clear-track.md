# Timeline Clear Track

## Purpose

Clear Track removes every keyframe from the currently active property track
without deleting the object, light, camera, or neighboring tracks. It is the
timeline equivalent of clearing one animated property in After Effects while
leaving the layer itself intact.

## Behavior

- The toolbar button is disabled until the active track has keyframes.
- Locked tracks cannot be cleared. Unlock the track first.
- The Command Palette exposes the same operation as `Clear Active Track`.
- Clearing a track records undo history, removes the empty track from scene
  JSON, rebuilds playback runtime data, and refreshes camera, light, object,
  motion-path, and inspector state.

The active track comes from the timeline track dropdown or the selected row in
the dope sheet. For object tracks, the selected scene object is the target. For
camera and light tracks, the global camera or light timeline is the target.

## Architecture

`KeyframeTimelinePanel` owns button availability through
`selectedTrackState()`. It uses the same track metadata as Track On/Off, Lock,
and Solo so the clear action follows existing row-selection behavior.

`main.ts` owns the mutation through `clearTimelineTrack(kind)`. The function
resolves camera, light, and object targets separately because they live in
different timeline document branches. After mutation it calls the standard
timeline rebuild and UI refresh path.

The command palette checks `hasClearableTimelineTrack()` before enabling
`timeline.clear-track`, so keyboard-first users get the same guardrails as
toolbar users.

## Validation

Playwright verifies that Clear Track is disabled for an empty active track,
becomes enabled after a keyframe is set, is available through the Command
Palette, clears the position track, and saves scene JSON without the cleared
track.
