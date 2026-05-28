# Keyframe Timeline Research

## Goal

Geometry Studio already includes preset animation modes such as spin, orbit,
bounce, pulse scale, cinematic demo motion, and light sweep. The next major
feature is a visual keyframe timeline similar in spirit to Premiere Pro or After
Effects: users should be able to place a playhead, add transform keyframes, scrub
time, drag markers, and save the result into the scene document.

The key design question is how much to build from scratch. A timeline editor is
a specialized interaction surface with zooming, panning, rows, selection,
dragging, snapping, time formatting, and state synchronization. The best path is
to stand on proven references while keeping the final code small enough for a
course project.

## Current Project Context

- Stack: vanilla TypeScript, Vite, Three.js, no React, no backend.
- Runtime target: static `Release/` folder served from a local web server.
- Existing animation: object presets and cinematic/evaluation tours, but no
  per-object keyframe tracks.
- Persistence: scene JSON already exists and should be versioned rather than
  replaced.
- Design priority: evaluator clarity first, portfolio polish second.

## Candidates Studied

| Candidate | Link | License Notes | Fit |
| --- | --- | --- | --- |
| Three.js Editor | https://github.com/mrdoob/three.js/tree/dev/editor | MIT as part of Three.js | Excellent architectural reference for a browser-based 3D editor, but its timeline and editor shell are not a drop-in component. |
| Three.js animation system | https://threejs.org/manual/en/animation-system.html | MIT | Best runtime playback layer because the project already uses Three.js. It does not provide timeline UI. |
| Three.js animation keys example | https://threejs.org/examples/#misc_animation_keys | MIT | Useful example for keyframe tracks and mixers. It also demonstrates why quaternion rotation tracks are safer than Euler rotation interpolation. |
| Theatre.js | https://github.com/theatre-js/theatre | Mixed package reality: the repository is public, `@theatre/core` is Apache-2.0, and `@theatre/studio` was observed on npm as AGPL-3.0-only | Powerful professional sequencing system, but too heavy and legally awkward for a simple static course submission when the visual Studio package is needed. |
| Wick Editor | https://github.com/Wicklets/wick-editor | GPL-3.0 | Strong reference for frame, layer, tween, and playhead concepts. GPL makes it reference-only for this project. |
| animation-timeline-js | https://www.npmjs.com/package/animation-timeline-js and https://github.com/ievgennaida/animation-timeline-control | MIT | Best UI primitive choice: TypeScript, no production dependencies, keyframe rows, dragging, selection, zoom, scrollbars, and timeline events. |
| Motion Canvas | https://github.com/motion-canvas/motion-canvas | MIT | Excellent animation tooling, but primarily code-driven and presentation-oriented rather than a lightweight embedded keyframe editor. |
| vis-timeline | https://github.com/visjs/vis-timeline | Project-specific license metadata should be checked before use | Better suited for calendar/event timelines than dense animation keyframes. |

## Detailed Findings

### Three.js Editor

The official Three.js Editor is the closest conceptual reference because it is a
complete web-based 3D scene editor. It shows useful patterns for separating
editor state, commands, signals, object selection, viewport tools, and persistent
scene data.

It should be treated as an architecture reference, not code to copy wholesale.
The editor is broad and its UI framework does not match Geometry Studio's
current lightweight TypeScript structure.

Useful ideas:

- Keep editor actions command-based so Undo and Redo can share one model.
- Treat object selection as shared editor state, not local panel state.
- Serialize animation data with the scene instead of storing it in temporary UI
  structures.
- Keep viewport playback and timeline editing decoupled.

### Three.js Native Animation Runtime

Three.js already provides the playback primitives needed for the runtime layer:

- `AnimationClip` stores the complete animation for one object.
- `VectorKeyframeTrack` can animate `.position` and `.scale`.
- `QuaternionKeyframeTrack` can animate `.quaternion`.
- `AnimationMixer` evaluates clips over time.

This is the correct runtime foundation because it avoids a custom interpolator
in the render loop and keeps playback aligned with Three.js object transforms.
The UI should emit project-level timeline JSON, then a clip factory should
compile that JSON into Three.js clips.

The first version should use quaternion tracks for rotation. Euler rotations are
easy for users to edit in degrees, but interpolating Euler values can produce
surprising rotational paths. The editor can store user-friendly Euler degrees
and convert them to quaternions when building runtime clips.

### Theatre.js

Theatre.js is the strongest professional-feeling reference. It has a rich
studio, property sheets, sequenced tracks, scrubbing, and editor/runtime
separation. It is useful for understanding:

- how timeline state maps to object properties,
- how a studio/editor layer can be separate from a production runtime,
- how polished property sequencing behaves.

It is not selected for implementation because the visual editor package is too
heavy for this project and `@theatre/studio` was observed on npm with an
AGPL-3.0-only license. Using it directly would complicate a course submission and
portfolio release. `@theatre/core` alone is lighter and permissive, but without
Studio it does not solve the requested visual timeline editor.

### Wick Editor

Wick Editor is a useful reference for timeline vocabulary: layers, frames,
playhead, frame selection, tweens, and playback. It is not suitable as a
dependency or code source because it is GPL-3.0. The right use is conceptual
inspiration only.

### animation-timeline-js

`animation-timeline-js` is the recommended UI library. It is MIT licensed,
written in TypeScript, and focused exactly on keyframe timeline interactions. It
provides primitives for rows, keyframes, playhead movement, zooming, panning,
scrolling, selection, and drag events.

Why it fits this project:

- It is small compared with complete animation editor applications.
- It has no production dependencies, which keeps the static release simpler.
- It provides UI primitives while letting Geometry Studio own the data model.
- It can live inside the existing vanilla TypeScript application without React.
- It does not replace Three.js runtime playback.

Risks:

- It is a UI primitive, not a full animation system. Geometry Studio still needs
  its own schema, clip factory, command integration, and save/load logic.
- Visual styling and object-row labels will need custom work to match the
  current app.
- The project must wrap library events carefully so timeline drags do not bypass
  Undo and Redo.

## Final Recommendation

Use a two-layer approach:

1. Timeline UI: `animation-timeline-js@2.3.5`.
2. Runtime playback: Three.js `AnimationClip`, `VectorKeyframeTrack`,
   `QuaternionKeyframeTrack`, and `AnimationMixer`.

This keeps the feature realistic, legally safe, and maintainable. The app should
own the scene timeline schema and treat the timeline library as an interaction
adapter, not as the source of truth.

## First-Version Scope

The first version intentionally implemented only transform tracks:

- Position: X, Y, Z
- Rotation: X, Y, Z in the UI, converted to quaternion tracks at runtime
- Scale: X, Y, Z

Camera, light, and object appearance/material tracks have since been added as
incremental schema extensions after the transform editing loop became testable.
Texture transform and nested model bone tracks remain later work because they
need more UI grouping and validation.
