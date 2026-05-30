# AE-Style Timeline Integration Research

## Goal

Improve Geometry Studio's keyframe timeline without reinventing timeline editor
infrastructure. The project should reuse an existing timeline UI library where
possible, keep the runtime tied to Three.js animation primitives, and adopt
proven editor patterns from larger open-source projects only when they fit the
current vanilla TypeScript architecture.

## Repositories And Libraries Checked

| Project | Link | What It Solves | Integration Decision |
| --- | --- | --- | --- |
| animation-timeline-js | https://github.com/ievgennaida/animation-timeline-control | Canvas timeline UI with rows, keyframes, snapping, drag, selection, zoom, pan, scrollbars, keyboard support, and virtualization. | Use directly. It is already installed and is the best fit for the current app. |
| Three.js animation system | https://threejs.org/manual/en/animation-system.html | Runtime playback through `AnimationClip`, `KeyframeTrack`, and `AnimationMixer`. | Use directly. It avoids a custom animation evaluator in the render loop. |
| Three.js Editor | https://github.com/mrdoob/three.js/tree/dev/editor | Full browser-based 3D editor architecture, command flow, scene serialization, and viewport/editor separation. | Reference only. Good architecture ideas, not a drop-in timeline widget. |
| Theatre.js | https://github.com/theatre-js/theatre | Professional web motion editor with sequence, dope sheet, and property editing concepts. | Reference only. Strong UX model, but the visual Studio package is heavier and has license complexity for course/portfolio distribution. |
| react-timeline-editor | https://github.com/xzdarcy/react-timeline-editor | React timeline editor with actions, tracks, dragging, scaling, and playback patterns. | Reference only. Useful track/action vocabulary, but adopting React would fight the current app structure. |
| Motion Canvas | https://github.com/motion-canvas/motion-canvas | Code-driven animation editor and preview system. | Reference only. Good playback/editor separation; not a lightweight embedded dope-sheet control. |
| Wick Editor | https://github.com/Wicklets/wick-editor | Frame/layer/tween animation authoring model. | Reference only. GPL-3.0 makes direct integration inappropriate for this project. |

## Decision

The implementation should continue using `animation-timeline-js@2.3.5` as the
visual dope-sheet component. Its own README describes the hard UI primitives the
project needs: canvas rendering, snapping, zooming, panning, multi-keyframe
selection, dragging, keyboard support, scrollbars, and virtualization.

Geometry Studio should not build a custom timeline renderer. The project-owned
code should only handle:

- Mapping scene objects and tracks to `animation-timeline-js` rows/keyframes.
- Converting timeline events into editor commands.
- Persisting a versioned scene timeline schema.
- Compiling saved keyframes into Three.js runtime clips.
- Coordinating Undo/Redo, Auto-Key, selection, and transform controls.

## Patterns To Integrate Now

The next implementation slice should add AE-like editing behavior using the
existing timeline library and the current Three.js runtime:

- Auto-Key toggle: transform edits at the current playhead time create or update
  a keyframe for the active transform track.
- Previous/Next keyframe: jump the playhead to the nearest saved keyframe.
- Duplicate keyframes: copy selected keyframes forward by the snap step.
- Clear track: remove the selected object's active Position, Rotation, or Scale
  track.
- Interpolation control: apply Linear, Ease In, Ease Out, Easy Ease, or Hold
  interpolation to selected keyframes, or to the active track keyframe under the
  playhead.
- Timeline zoom controls: use the timeline library's built-in zoom and a local
  fit-to-duration command rather than custom canvas scaling code.
- Track conflict rule: timeline transform tracks continue to override preset
  object animation modes for the same object.

## Implemented Timeline Slices

- Transform dope sheet backed by `animation-timeline-js`.
- Direct per-segment playback for Position, Rotation, and Scale tracks so mixed
  Hold, Linear, Ease In, Ease Out, and Easy Ease timing works within a single
  track.
- JSON persistence for timeline v2, including Auto-Key state.
- Auto-Key, previous/next keyframe, duplicate keyframe, and clear-track commands.
- Interpolation editing for Linear, Ease In, Ease Out, Easy Ease, and Hold
  keyframes, with distinct marker and preview treatment in the dope sheet.
- Timeline zoom-in, zoom-out, and fit-to-duration controls built on the installed
  timeline component API.
- Camera timeline tracks for Camera Position, Camera Target, and Camera Lens
  values, persisted in timeline schema v3 and evaluated during playback.
- Light timeline tracks for directional, point, spot, and ambient lights,
  persisted in timeline schema v4 and evaluated during scrubbing/playback.
  Light sweep is disabled while light tracks exist so keyed lighting remains
  deterministic.
- Object appearance/material tracks for Color, Opacity, Roughness, Metalness,
  and Visibility, persisted through timeline schema v6 and evaluated during
  scrubbing/playback without disabling preset transform animation.
- Texture transform tracks for Repeat, Offset, and Rotation, persisted through
  timeline schema v7 and evaluated during scrubbing/playback.

## Patterns To Defer

These should remain later phases because they require more schema and UI work:

- Curve editor / graph editor.
- Separate per-axis tracks.
- Texture source switching and other deeper material tracks.
- Full layer clip blocks with ripple editing. Keyframe-level ripple delete is
  implemented first as a smaller, deterministic editing primitive.
- Audio/video tracks.

## Architecture Constraint

Do not introduce React, Theatre Studio, or a second animation runtime for this
phase. A second framework would increase bundle size and create two sources of
truth. The clean extension point is the existing `KeyframeTimelinePanel` adapter
around `animation-timeline-js`.
