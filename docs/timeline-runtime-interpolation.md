# Timeline Runtime Interpolation

## Purpose

The timeline schema stores interpolation on each keyframe. The runtime must
therefore evaluate interpolation per segment, not as a single mode for an entire
track.

Geometry Studio now uses one deterministic evaluator for transform, camera,
light, material, texture, visibility, and motion-path sampling.

## Behavior

- `Hold` keeps the left keyframe value until the next keyframe.
- `Linear` interpolates directly from the left keyframe to the right keyframe.
- `Easy Ease` uses smoothstep interpolation for the segment after the left
  keyframe.
- Scrubbing exactly onto a keyframe always returns that keyframe's authored
  value, even when the previous segment uses Hold interpolation.
- Mixed tracks are supported. For example, a Position track can hold from
  \(t_0\) to \(t_1\), then interpolate linearly from \(t_1\) to \(t_2\).

## Architecture

`animation/interpolation.ts` owns `evaluateTimelineTrack`. The same function is
used by:

- `animation/timelinePlayer.ts` for object Position, Rotation, and Scale
  playback,
- `main.ts` for camera, light, material, texture, and visibility tracks,
- `scene/motionPath.ts` for viewport motion-path preview sampling,
- `ui/timelineValueGraph.ts` for selected-track value graph sampling and key
  point placement.

This replaces the previous transform-only `AnimationMixer` path. Three.js
keyframe tracks choose interpolation per track, while this project needs
per-keyframe interpolation. Direct evaluation keeps the saved timeline semantics
and viewport playback aligned.

## Testing

The grouped transform Playwright workflow verifies mixed interpolation by:

1. Creating Position keys at 0, 2, and 4 seconds.
2. Applying Hold to the first key.
3. Applying Linear to the second key.
4. Scrubbing to 1 second and verifying the object still holds the first value.
5. Scrubbing to 3 seconds and verifying the object interpolates between the
   second and third keys.
