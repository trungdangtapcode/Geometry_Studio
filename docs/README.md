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

## Current Recommendation

Use `animation-timeline-js@2.3.5` for the visual timeline UI and Three.js native
animation runtime for playback:

- `animation-timeline-js` gives the project MIT-licensed, TypeScript-friendly
  keyframe timeline primitives without pulling in a large application framework.
- Three.js `AnimationClip`, `VectorKeyframeTrack`, `QuaternionKeyframeTrack`, and
  `AnimationMixer` keep runtime playback aligned with the renderer already used
  by Geometry Studio.
- First implementation scope should stay narrow: object Position, Rotation, and
  Scale tracks only. More advanced property tracks can be added after the core
  editing loop is reliable.

## Implementation Status

The first transform timeline slice is implemented in `Source/`:

- `animation/timelineSchema.ts` owns timeline defaults, migration, cloning, and
  track helpers.
- `animation/clipFactory.ts` compiles Position, Rotation, and Scale tracks into
  Three.js keyframe tracks.
- `animation/timelinePlayer.ts` evaluates clips with one `AnimationMixer` per
  keyed object.
- `ui/timelinePanel.ts` wraps `animation-timeline-js` and connects the visual
  timeline to editor callbacks.

The longer-term documents remain useful for the next stages: auto-key, camera
tracks, light/material tracks, curve editing, and export workflows.

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
