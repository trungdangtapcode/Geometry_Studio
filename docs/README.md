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
- [Preview Export](preview-export.md) documents WebM work-area recording.

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

## Implementation Status

The implemented timeline stack in `Source/` now includes object transform,
object appearance, camera, and light tracks:

- `animation/timelineSchema.ts` owns timeline defaults, migration, cloning, and
  track helpers.
- `animation/clipFactory.ts` compiles Position, Rotation, and Scale tracks into
  Three.js keyframe tracks.
- `animation/timelinePlayer.ts` evaluates clips with one `AnimationMixer` per
  keyed object.
- `ui/timelinePanel.ts` wraps `animation-timeline-js` and connects the visual
  timeline to editor callbacks.
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
