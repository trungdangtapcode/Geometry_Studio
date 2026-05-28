# Geometry Studio Engineering Docs

This folder contains engineering design notes for future development. It does
not replace `Doc/`, which contains the formal LaTeX course report and generated
PDF.

## Timeline Planning Set

- [Timeline Research](timeline-research.md) compares timeline and animation
  editor references, including Three.js Editor, Three.js native animation,
  Theatre.js, Wick Editor, Motion Canvas, vis-timeline, and
  `animation-timeline-js`.
- [Timeline Architecture](timeline-architecture.md) defines the proposed
  keyframe timeline data model, module boundaries, playback pipeline, scene JSON
  migration, and conflict rules.
- [Timeline Implementation Plan](timeline-implementation-plan.md) breaks the
  feature into a four-week implementation plan with first-version scope,
  interaction behavior, and tests.
- [Improvement Roadmap](improvement-roadmap.md) records the next research-backed
  upgrade path for rendering quality, OBJ/MTL import, post-processing, timeline
  polish, and optional path-traced preview.
- [AE-Style Timeline Integration Research](ae-timeline-integration-research.md)
  records the no-reinvention decision for the next timeline phase: keep
  `animation-timeline-js` as the dope-sheet component and integrate proven
  Auto-Key / duplicate / navigation workflows around it.
- [Light Timeline Tracks](light-timeline-tracks.md) documents the implemented
  light property tracks, playback rules, and current schema status.
- [Object Property Timeline Tracks](object-property-timeline-tracks.md)
  documents schema v6 object Color, Opacity, Roughness, Metalness, and
  Visibility tracks.
- [Texture Timeline Tracks](texture-timeline-tracks.md) documents schema v7
  texture Repeat, Offset, and Rotation tracks.
- [Timeline Work Area](timeline-work-area.md) documents schema v8 Work In/Out
  playback range behavior.
- [Timeline Markers](timeline-markers.md) documents schema v9 marker cue points.
- [Timeline Preset Baking](timeline-preset-baking.md) documents why preset
  animation buttons now generate visible keyframes instead of hidden procedural
  motion.
- [Timeline Resizable Dock](timeline-resizable-dock.md) documents the persistent
  dock height handle, row alignment, and scroll synchronization.
- [Timeline Frame Navigation](timeline-frame-navigation.md) documents
  frame-step controls, Work Out jump, and timecode display.
- [Timeline Keyframe Clipboard](timeline-keyframe-clipboard.md) documents
  keyframe copy/paste behavior for object, camera, and light tracks.
- [Timeline Keyframe Nudge](timeline-keyframe-nudge.md) documents frame-step
  retiming controls for selected or playhead keyframes.
- [Timeline Keyframe Editor](timeline-keyframe-editor.md) documents numeric
  keyframe time and value editing.
- [Timeline Track Controls](timeline-track-controls.md) documents active-track
  enable/disable behavior.
- [Timeline Row Selection](timeline-row-selection.md) documents dope-sheet row
  label selection and active/disabled row states.
- [Timeline Row Keying](timeline-row-keying.md) documents the AE-style diamond
  key buttons on each property row.
- [Timeline Row Filtering](timeline-row-filtering.md) documents Focus, Keyed,
  and All row visibility modes for dense scenes.
- [Timeline Motion Paths](timeline-motion-paths.md) documents selected-object
  position path rendering for visible spatial keyframe feedback.
- [Preview Export](preview-export.md) documents WebM work-area recording.
- [UI Density Control](ui-density.md) documents the Blender-style compact
  control-density system.

## Current Recommendation

Use `animation-timeline-js@2.3.5` for the visual timeline UI and Three.js native
animation runtime where it fits:

- `animation-timeline-js` gives the project MIT-licensed, TypeScript-friendly
  keyframe timeline primitives without pulling in a large application framework.
- Three.js `AnimationClip`, `VectorKeyframeTrack`, `QuaternionKeyframeTrack`, and
  `AnimationMixer` keep runtime playback aligned with the renderer already used
  by Geometry Studio.
- Object Position, Rotation, and Scale tracks use Three.js clips and mixers.
- Camera, light, and object appearance tracks use the same timeline document and
  UI adapter, then apply evaluated values directly to renderer-owned properties
  during scrubbing/playback.
- Timeline keyframe clipboard support copies selected or playhead keyframes and
  pastes them at the current playhead time while preserving relative timing and
  interpolation.
- Frame-step keyframe nudge controls retime selected or playhead keyframes
  without dragging.
- A compact keyframe editor allows precise selected/playhead keyframe time and
  value edits.
- Track enable/disable controls mute individual property tracks without deleting
  saved keyframes.
- Row-label selection makes the left timeline column a direct track navigation
  surface for object, camera, and light tracks.
- Row-level diamond buttons add or update keys directly from the property row,
  matching common motion-graphics editor workflows.
- Row filtering keeps dense scenes manageable through Focus, Keyed, and All
  timeline views.
- Selected objects with two or more Position keys show a viewport motion path,
  turning hidden `A_t0 -> A_t1` data into visible spatial feedback.
- Timeline markers add named cue points for animation beats and demo segments.
- Preset animation buttons bake visible Position, Rotation, or Scale keyframes,
  keeping playback inspectable from the timeline.
- The keyframe dock has a persisted height resize handle, with row labels and
  canvas scrolling kept in sync.
- Blender-style UI density is the default, with Compact and Comfortable options
  persisted in local storage.

## Implementation Status

The implemented timeline stack in `Source/` now includes object transform,
object appearance, camera, and light tracks:

- `animation/timelineSchema.ts` owns timeline defaults, migration, cloning, and
  track helpers.
- `animation/timelineEditing.ts` owns pure keyframe edit operations such as
  source resolution, copy/paste payloads, duplicate, frame nudge, and numeric
  keyframe editing.
- `animation/clipFactory.ts` compiles Position, Rotation, and Scale tracks into
  Three.js keyframe tracks.
- `animation/timelinePlayer.ts` evaluates clips with one `AnimationMixer` per
  keyed object.
- `ui/timelinePanel.ts` wraps `animation-timeline-js` and connects the visual
  timeline to editor callbacks.
- `ui/density.ts` owns UI-density persistence and root layout mode application.
- `main.ts` evaluates camera, light, color, opacity, and visibility tracks
  against the same keyframe schema so non-transform properties remain
  synchronized with scrubbing, Auto-Key, Undo, Redo, save, and load.

The longer-term documents remain useful for the next stages: per-axis expansion,
curve editing, nested model tracks, and export workflows.

## Reading Order

1. Read the research document to understand the library choice.
2. Read the architecture document before touching source code.
3. Follow the implementation plan one phase at a time, keeping each phase
   testable and reviewable.

## Related Project Folders

- `Source/` contains the Vite and TypeScript application.
- `Release/` contains the static production build.
- `Doc/` contains the formal LaTeX report.
- `docs/` contains engineering plans and architecture notes.
