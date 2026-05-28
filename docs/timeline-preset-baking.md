# Timeline Preset Baking

## Purpose

Geometry Studio no longer lets preset object motion run invisibly outside the
timeline. Spin, Orbit, Bounce, and Pulse are treated as keyframe generators, so
the motion a user sees during playback is backed by visible dope-sheet keys.

This makes the animation model closer to After Effects: playback should be
explainable from rows, tracks, and keyframes.

## Behavior

- Selecting `Spin` creates Rotation keyframes over the current Work In/Out
  range.
- Selecting `Orbit` creates Position keyframes and a Rotation keyframe pair.
- Selecting `Bounce` creates Position keyframes with a raised midpoint.
- Selecting `Pulse` creates Scale keyframes with an enlarged midpoint.
- After baking, the object procedural mode is set back to `none`.
- The active timeline track switches to the primary baked track so the new keys
  are immediately visible and editable.
- Existing transform tracks for the selected object are replaced when a preset
  is explicitly baked.

## Demo And Legacy Rules

- The default scene, Reset Scene, Cinematic Demo, and Evaluation Tour use baked
  keyframes instead of hidden procedural motion.
- Light sweep in demos is baked as a light position track.
- Saved scenes from older versions that contain procedural animation modes but no
  transform timeline tracks are migrated by baking those modes on load.

## Architecture Notes

The baking logic lives in `main.ts` because it coordinates scene state, history,
work-area settings, and runtime rebuilds. It still writes ordinary
`TimelineTrackDocument` and `TimelineKeyframeDocument` records through the
timeline schema helpers.

No separate preset schema is needed. Exported scene JSON remains inspectable and
portable because baked motion is stored as normal timeline data.
