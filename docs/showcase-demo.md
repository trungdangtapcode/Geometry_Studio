# Coursework Showcase Demo

## Reference

The reference GIF at
`https://raw.githubusercontent.com/Karhdo/CS105.M11.KHCL/188e42b7eaf16d825bd5b07e650d2890a83cc767/Image/final_project.gif`
uses a simple but effective presentation pattern:

- a full-screen grid floor,
- one animated wireframe sphere,
- a strong visible contact shadow,
- compact feature controls,
- a small scene that immediately demonstrates geometry, lighting, shadow, and
  animation.

## Design Direction

Geometry Studio should not copy that UI literally. The current app is a real
editor with timeline, import, render modes, postprocessing, and save/load, so a
full downgrade to the reference layout would reduce usability.

Instead, the app includes a `Showcase` preset that reproduces the reference
presentation quality while keeping every result editable:

- a white wire sphere layered over a transparent glass shadow-casting sphere,
- a dark animated shadow-study disk on the ground,
- cool studio background, bloom, vignette, FXAA, and high quality shadows,
- hidden axes/helpers for a cleaner first impression,
- editable Position/Rotation/Scale timeline keys,
- automatic playback so the evaluator sees motion immediately.

## User Workflow

1. Press `Showcase` in the bottom bar, or open Commands and run
   `Run Coursework Showcase Demo`.
2. Press `K` to stop playback if needed.
3. Inspect the generated objects in the outliner.
4. Open the timeline and edit the Position/Rotation keys like any other object.
5. Use `Screenshot` or `Record WebM` for report assets.

## Implementation Notes

The preset is implemented in `startShowcaseDemo()` in `Source/src/main.ts`.
It uses existing editor primitives and timeline infrastructure:

- `addPrimitive()` creates the cylinder and sphere entries.
- `replaceTimelineTrack()` writes editable timeline keys.
- `normalizeRenderSettings()`, `applyRenderSettings()`, and
  `applyPostProcessingSettings()` stage the final render look.
- `syncLights()` applies shadow settings to the generated objects.

No separate runtime or special-case object type is introduced. The demo stays
inside the same scene document format as user-authored work.
