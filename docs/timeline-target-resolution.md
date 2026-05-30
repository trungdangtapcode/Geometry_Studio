# Timeline Target Resolution

## Purpose

Timeline row actions often start from UI-visible rows and must resolve those
rows into real saved tracks. This module keeps that mapping outside the editor
shell so future AE-style commands do not keep expanding `main.ts`.

## Module

`Source/src/animation/timelineTargets.ts` owns:

- `TimelineRowTarget`: a UI-independent `{ targetId, kind }` row reference.
- `dedupeTimelineRowTargets`: collapses expanded channel rows back to one
  vector track target.
- `resolveTimelineRowTrackTargets`: maps visible row targets to camera, light,
  or object timeline tracks and skips locked/empty tracks.

## Design Rules

- UI code can report visible rows, but it should not own timeline document
  mutation rules.
- Gap editing, visible-time copy/delete, and future row-scoped commands should
  share the same target resolution behavior.
- Expanded X/Y/Z rows intentionally resolve to the shared Position/Rotation/
  Scale track so vector keyframes stay synchronized.
- Camera and light tracks resolve by track kind because they are global
  timeline targets.
- Object tracks resolve only when the object still exists in the scene.

## Current Users

- `Set Visible` uses deduped row targets before creating row-scoped keyframes.
- `Insert Gap`, `Lift Work`, and `Extract Work` resolve visible rows into
  editable timeline tracks before calling pure edit helpers in
  `timelineEditing.ts`.

## Why This Matters

The timeline is now feature-rich enough that new commands should be assembled
from small, testable modules:

1. UI panel reports visible rows or selected keyframes.
2. Target resolution maps UI rows to timeline document tracks.
3. Pure edit helpers mutate timeline data.
4. `main.ts` handles history, runtime rebuild, and scene/UI synchronization.

That separation keeps later AE-like operations, such as ripple insert, paste
attributes, or row-scoped bake commands, from becoming one-off mutations in the
application shell.
