# Timeline Track Controls

## Status

Track enable/disable is implemented for timeline schema v8. The schema already
stored `TimelineTrackDocument.enabled`; this update exposes it in the editor and
ensures all runtime evaluators respect it.

## User-Facing Behavior

- `Track On` / `Track Off` toggles the active timeline track.
- The button is disabled when the active track has no keyframes.
- Disabled tracks keep their keyframes in the scene JSON.
- Disabled tracks are skipped during object transform playback, camera
  playback, light playback, and object property playback.
- Re-enabling a track restores its animation because no keyframe data is lost.

This gives the editor an After Effects style non-destructive way to test motion
or look changes without clearing a track.

## Runtime Rules

- Transform tracks are filtered before Three.js `AnimationClip` generation.
- Camera, light, material, texture, and visibility tracks return no evaluated
  value while disabled.
- Save/Load round trips preserve the `enabled` flag through the existing
  timeline schema normalization.

## Testing

The Playwright timeline workflow verifies that the active Position track can be
toggled off and that exported scene JSON preserves `enabled: false` while
keeping all keyframes.
