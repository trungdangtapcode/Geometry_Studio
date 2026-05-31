# Keyframe Timeline Implementation Plan

## Status

The first transform timeline slice has been implemented. Geometry Studio now has
a bottom keyframe dock for Position, Rotation, and Scale tracks, scene JSON
version 2 timeline persistence, direct per-keyframe transform playback, basic
Undo/Redo integration, and Playwright coverage for saving transform keyframes.

The follow-up AE-style slices are also partially implemented:

- Timeline schema v3 adds Camera Position, Camera Target, and Camera Lens tracks.
- Timeline schema v4 adds directional, point, spot, and ambient light tracks.
- Timeline schema v5 adds object Color, Opacity, and Visibility tracks.
- Timeline schema v6 adds object Roughness and Metalness tracks.
- Timeline schema v7 adds Texture Repeat, Offset, and Rotation tracks.
- Timeline schema v8 adds Work In/Out playback range controls.
- Timeline schema v9 adds named marker cue points.
- WebM preview export records the current work area from the WebGL canvas.
- Auto-Key, duplicate, previous/next keyframe navigation, interpolation editing,
  zoom controls, clear-track commands, row filtering, resizable dock height, and
  preset-to-keyframe baking are implemented.

The remaining plan below is still the long-term roadmap for polish and deeper
track types.

## First-Version Scope

Version one should implement a clean transform timeline only:

- Position X/Y/Z
- Rotation X/Y/Z in UI degrees, compiled to Euler channel tracks for playback
- Scale X/Y/Z
- Per-object rows
- Play, pause, scrub, loop, duration, FPS, and snap
- Add, delete, drag, and edit keyframes
- Save/load round trip through scene JSON
- Undo/Redo for timeline edits

Out of scope for the original first version:

- Per-axis texture/transform expansion, bone, morph target, and audio tracks
- Graph editor curves
- Nested sequence composition
- WebM or GIF export
- Timeline blending with preset object animations

## Week 1: Foundations And Schema

Deliverables:

- Add `animation-timeline-js@2.3.5`.
- Add timeline TypeScript interfaces and default values.
- Add scene document migration from version 1 to version 2.
- Add empty timeline save/load support.
- Add clip factory tests for position, rotation, and scale tracks.
- Add a disabled or hidden timeline panel shell so layout work can begin without
  exposing incomplete behavior.

Engineering notes:

- Keep scene JSON as the source of truth.
- Store rotation keyframes in degrees for readable JSON.
- Compile rotation keyframes to per-axis `NumberKeyframeTrack` channels in the
  clip factory so authored full turns such as `0 -> 360` remain visible.
- Start with linear interpolation only, but keep the schema field for future
  hold and smooth modes.

Acceptance:

- Existing scenes load through migration.
- New scenes save as version 2.
- Typecheck and build pass.
- Unit tests confirm clip times and values are generated correctly.

## Week 2: Timeline Panel And Editing Commands

Deliverables:

- Add bottom timeline dock with collapsed and expanded states.
- Render object rows and Position, Rotation, Scale child tracks.
- Add playhead, scrub interaction, zoom, pan, and basic snapping.
- Implement add keyframe at current time for the selected object and selected
  transform track.
- Implement delete selected keyframes.
- Implement drag keyframe markers with a single Undo command per drag.
- Add duration, FPS, loop, and snap controls.

UI behavior:

- Clicking the timeline ruler moves the playhead.
- Dragging the playhead scrubs without starting playback.
- Pressing Play starts playback from the current time.
- Pressing Stop freezes playback at the current time.
- Loop repeats from zero when the playhead reaches duration.
- Snap rounds keyframe time to the configured snap step.
- Add Keyframe captures the selected object's current transform value.
- Delete removes selected keyframes after confirming only when multiple rows are
  affected.
- Dragging a keyframe clamps it between zero and duration.
- Dragging multiple selected keyframes preserves their relative spacing where
  possible.

Acceptance:

- Undo and Redo work for add, delete, and drag.
- Timeline UI does not overlap existing inspector controls.
- Mobile layout keeps the timeline usable as a compact drawer.

## Week 3: Runtime Playback And Scene Integration

Deliverables:

- Add `timelinePlayer` with direct transform-track evaluation for keyed objects.
- Rebuild affected object runtime references after timeline edits.
- Scrub by evaluating tracks at `currentTime`.
- Integrate timeline playback into the existing render loop.
- Apply conflict rules with preset object animations.
- Update duplicate, delete, rename, import, reset, and load flows to respect
  timeline data.
- Add timeline status indicators to show active object tracks and playback mode.

Runtime behavior:

- Timeline transform tracks override preset transform animations for the same
  object.
- Adding the first transform keyframe to an object turns off that object's preset
  animation mode.
- Stopping playback leaves objects at the current playhead-evaluated transform.
- Reset Scene clears timeline data unless a future reset preset explicitly adds
  demo keyframes.
- Imported models animate at their root group.

Acceptance:

- Saved keyframes load and play the same motion.
- Imported model root transforms can be keyed.
- Object deletion, duplication, and rename keep timeline data consistent.
- Evaluation and cinematic tours stop before entering active timeline playback.

## Week 4: Hardening, Tests, And Documentation

Deliverables:

- Add unit tests for migration, normalization, clip generation, conflict rules,
  and command behavior.
- Add Playwright workflows for the timeline panel.
- Update `Readme.txt` and the LaTeX report after implementation is complete.
- Add screenshots showing the timeline dock and keyframed motion.
- Rebuild `Release/` and run the release smoke checklist.

Automated tests:

- TypeScript check.
- Production build.
- Scene v1-to-v2 migration.
- Save/load timeline round trip.
- Add keyframe command.
- Delete keyframe command.
- Drag keyframe command with one Undo step.
- Position, rotation, and scale clip generation.
- Playwright: open Release, expand timeline, add keyframe, scrub, switch object,
  save JSON, and verify no console errors.
- Playwright mobile: open Release, expand compact timeline drawer, verify toolbar
  and playhead remain reachable.

Manual tests:

- Create cube, sphere, and imported model.
- Add position keyframes and scrub.
- Add rotation keyframes and confirm a `0 -> 360` turn reaches about `180`
  degrees halfway through playback.
- Add scale keyframes and loop playback.
- Save JSON, reload the scene, and replay.
- Delete object with timeline data and confirm no orphan rows remain.
- Duplicate object with timeline data and confirm copied motion uses new IDs.
- Toggle preset animation buttons and confirm they create visible Position,
  Rotation, or Scale keyframes instead of hidden procedural motion.

## Suggested Commit Sequence

1. `Add timeline schema and migration`
2. `Add timeline clip factory`
3. `Add timeline panel shell`
4. `Add transform keyframe editing commands`
5. `Add timeline playback runtime`
6. `Add timeline save load tests`
7. `Polish timeline responsive layout`
8. `Document keyframe timeline usage`

Each commit should keep the app buildable. This feature is large enough that a
single giant commit would be difficult to review and risky to debug.

## Long-Term Extensions

After the transform timeline is stable, future versions can add:

- Camera tracks for cinematic shots.
- Light intensity, color, and position tracks.
- Texture source switching and advanced material map tracks.
- Visibility tracks.
- Auto-key mode.
- Easing presets and a graph editor.
- Timeline templates such as turntable, bounce intro, product reveal, and orbit
  camera.
- Exported demo presets for evaluator walkthroughs.
