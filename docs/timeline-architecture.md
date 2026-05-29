# Keyframe Timeline Architecture

## Design Goals

- Keep the timeline source of truth in Geometry Studio's own scene document.
- Use `animation-timeline-js` only as a view/controller adapter.
- Use Three.js native animation classes for runtime playback.
- Keep object transform tracks on Three.js native clips, and keep non-object
  editor tracks on the same scene timeline document.
- Convert preset animation actions into ordinary visible timeline keyframes so
  playback is explainable from the dope sheet.
- Make the feature testable without depending on visual judgment alone.

## Proposed Module Boundaries

The exact filenames can be adjusted during implementation, but the ownership
should stay close to this structure:

- `animation/timelineTypes.ts`: TypeScript interfaces for timeline documents,
  tracks, keyframes, easing, playback state, and migrations.
- `animation/timelineSchema.ts`: default timeline values, validation helpers,
  scene JSON v1-to-v2 migration, and normalization of loaded data.
- `animation/timelineEditing.ts`: pure keyframe edit operations such as source
  resolution, copy/paste payloads, duplication, collision-aware nudging, numeric
  keyframe editing, and target-track creation.
- `animation/timelineTracks.ts`: shared track taxonomy, label functions,
  preset-to-track mapping, and object value capture helpers used by the editor,
  editing, and playback layers.
- `animation/interpolation.ts`: evaluates Hold, Linear, Ease In, Ease Out, and
  Easy Ease timing per keyframe segment.
- `animation/timelinePlayer.ts`: owns transform playback state, scrubbing, loop
  behavior, and applying evaluated transforms.
- `ui/timelinePanel.ts`: integrates `animation-timeline-js`, renders rows,
  receives library events, and dispatches editor commands.
- `ui/timelineToolbar.ts`: play, pause, time display, duration, FPS, loop, snap,
  zoom, and add-keyframe controls.
- `editor/commands/timelineCommands.ts`: command objects for add, delete, move,
  and edit keyframes so Undo and Redo remain consistent.

The important boundary is that `ui/timelinePanel.ts` must not directly mutate
scene objects. It should dispatch callbacks. Pure timeline document edits should
live in `animation/timelineEditing.ts`; the editor shell should only coordinate
history snapshots, runtime rebuilds, scene-object side effects, and UI refresh.

## Scene Document Versioning

The scene document writes `version: 4` after adding persisted environment
lighting settings. The nested timeline document is versioned independently because
timeline capabilities are growing faster than the outer scene format.

Version 1 scene files do not contain keyframe timeline data. Version 1 and
version 2 scene files do not contain Rendering Lab data; version 3 scene files
do not contain environment lighting data. Loading them creates default empty
timeline data and default renderer settings. The current timeline schema is
version 9:

```ts
interface SceneTimelineDocument {
  version: 9;
  duration: number;
  workStart: number;
  workEnd: number;
  fps: number;
  currentTime: number;
  loop: boolean;
  snapEnabled: boolean;
  snapStep: number;
  autoKey: boolean;
  camera: CameraTimelineDocument;
  lights: LightTimelineDocument;
  objects: ObjectTimelineDocument[];
  markers: TimelineMarkerDocument[];
}

interface ObjectTimelineDocument {
  objectId: string;
  tracks: TimelineTrackDocument[];
}

type TimelineTrackKind =
  | "position"
  | "rotation"
  | "scale"
  | "objectColor"
  | "objectOpacity"
  | "objectRoughness"
  | "objectMetalness"
  | "objectTextureRepeat"
  | "objectTextureOffset"
  | "objectTextureRotation"
  | "objectVisibility"
  | "cameraPosition"
  | "cameraTarget"
  | "cameraLens"
  | "directionalPosition"
  | "directionalColor"
  | "directionalIntensity"
  | "pointPosition"
  | "pointColor"
  | "pointIntensity"
  | "spotPosition"
  | "spotColor"
  | "spotIntensity"
  | "ambientIntensity";

interface TimelineTrackDocument {
  id: string;
  kind: TimelineTrackKind;
  label: string;
  enabled: boolean;
  solo: boolean;
  locked: boolean;
  keyframes: TimelineKeyframeDocument[];
}

interface TimelineKeyframeDocument {
  id: string;
  time: number;
  value: [number, number, number];
  interpolation: "hold" | "linear" | "easeIn" | "easeOut" | "smooth";
}

interface TimelineMarkerDocument {
  id: string;
  time: number;
  label: string;
  color: string;
}
```

Migration rule:

- Loading version 1 creates a default empty timeline with duration 8 seconds,
  30 FPS, loop enabled, snap enabled, and no object tracks.
- Loading unknown future versions should fail with a clear toast message instead
  of silently corrupting the scene.
- Saving after load always writes the latest supported scene version.

## Data Flow

1. The user selects an object in the viewport or outliner.
2. The timeline panel shows transform tracks for that object and any other
   objects that already have keyframes.
3. The user adds, deletes, edits, or drags a keyframe.
4. The timeline panel dispatches a command such as `AddKeyframeCommand` or
   `MoveKeyframesCommand`.
5. The editor store updates the `SceneTimelineDocument`.
6. The timeline runtime rebuilds the affected object's transform playback
   references.
7. During playback or scrubbing, the timeline player evaluates tracks at
   `currentTime` and applies the result to scene objects.
9. Save JSON writes the timeline document with the rest of the scene.

This makes the scene JSON the durable state and prevents the UI library from
becoming hidden storage.

## Runtime Evaluation Strategy

Use one direct timeline runtime entry per object that has transform tracks.
Position and Scale write vector values directly to the object group.

Rotation tracks are stored as Euler XYZ degrees in the scene document for easy
inspection and editing. At playback time, each axis converts to radians and is
assigned to the matching Euler rotation channel.
This preserves authored multi-turn motion such as `0 -> 360`, which a quaternion
track would reduce to equivalent start/end orientations.

The player should rebuild runtime references when timeline data changes, but it
should not allocate per frame. Rebuild only after an edit, import, delete,
duplicate, load, or reset.

## Conflict Rules

The project exposes preset buttons such as Spin, Orbit, Bounce, Pulse, and Light
Sweep. These are treated as keyframe generators rather than hidden animation
engines, so an evaluator can inspect the resulting motion in the timeline.

Rules:

- Selecting Spin, Orbit, Bounce, or Pulse creates visible Position, Rotation, or
  Scale keyframes over the current work area and sets the object's procedural
  mode to `none`.
- Cinematic and evaluation demos bake their object and light motion into
  timeline tracks before playback starts.
- Legacy saved scenes that contain procedural animation modes but no transform
  timeline tracks are migrated by baking those presets into ordinary keyframes
  on load.
- Light sweep is represented as a light position track when used in demos,
  because keyed light values must be deterministic during playback and scrubbing.
- Cinematic and evaluation tours may temporarily drive camera or scene state, but
  entering timeline edit mode should stop those tours.
- If playback is stopped and the user drags an object with TransformControls, the
  object moves normally. If auto-key is later added, that motion can create a
  keyframe. Auto-key is out of first-version scope.

## Timeline UI Adapter

The timeline should appear as a bottom dock:

- Collapsible panel so it does not crowd the existing viewport.
- Resizable height on desktop.
- Compact full-width drawer on mobile.
- Left row labels for object name and track kind.
- Right canvas area owned by `animation-timeline-js`.
- Toolbar with play, pause, current time, duration, FPS, loop, snap, and add
  keyframe controls.

Recommended row model:

- Parent row: object name.
- Child rows: Position, Rotation, Scale.
- Keyframe markers appear on child rows.

Event handling:

- `timeChanged`: update playhead and scrub the Three.js mixers.
- `selected`: update selected keyframe IDs in editor state.
- `dragStarted`: capture one Undo snapshot.
- `drag`: update temporary keyframe time for immediate visual feedback.
- `dragFinished`: commit one command so Undo reverses the whole drag.
- `keyframeChanged`: normalize keyframe time, clamp to duration, and rebuild
  affected clips.

## Undo And Redo

Every timeline mutation should use the existing command system pattern. Timeline
dragging is the main special case:

- Do not create one command per mousemove.
- Capture the starting state on drag start.
- Apply temporary state during drag.
- Commit a single command on drag finish.
- Cancel drag should restore the captured starting state.

Commands needed for version one:

- `AddTimelineKeyframeCommand`
- `DeleteTimelineKeyframesCommand`
- `MoveTimelineKeyframesCommand`
- `SetTimelineKeyframeValueCommand`
- `SetTimelineDurationCommand`
- `SetTimelinePlaybackSettingsCommand`

## Object Lifecycle Rules

- Deleting an object removes its timeline tracks.
- Duplicating an object copies its timeline tracks with new object and keyframe
  IDs.
- Renaming an object updates labels through object metadata; timeline tracks keep
  stable IDs.
- Imported models use the imported root group as the animation target.
- If a loaded timeline references a missing object, keep the scene load
  successful but drop that orphan timeline entry with a warning toast.

## Performance And Cleanup

- Dispose old clips and stop old mixer actions before replacing an object's
  timeline runtime.
- Do not rebuild all clips while dragging if only one keyframe is moving; rebuild
  only the affected object.
- Clamp timeline duration and imported scene size so the UI does not become
  unusable.
- Keep timeline rendering independent from the main WebGL canvas so UI redraws
  do not force extra Three.js resource churn.

## Acceptance Criteria

- A scene saved with transform keyframes can be loaded and plays identically.
- Scrubbing the playhead updates object transforms immediately.
- Undo and Redo work for adding, deleting, and dragging keyframes.
- Timeline tracks override preset object animations predictably.
- The static `Release/` build works without a backend or network dependency.
