# Light Timeline Tracks

## Status

Light timeline tracks were introduced in schema v4 and remain supported in the
current schema v10. They extend the existing dope-sheet rather than adding a
second editor or animation framework.

The supported tracks are:

- Directional light: position, color, intensity.
- Point light: position, color, intensity.
- Spot light: position, color, intensity.
- Ambient light: intensity.

## Why This Design

Object transform animation, light animation, and object appearance animation now
share the same direct timeline evaluator. Lights still need a separate adapter
because Geometry Studio exposes active light state, helpers, shadows, sweep
mode, and inspector controls directly from the editor.

For this slice, light tracks use the same timeline schema and
`animation-timeline-js` UI, then apply evaluated values directly to Three.js
light objects:

- Position tracks write to `light.position`.
- Color tracks write to `light.color`.
- Intensity tracks write to `light.intensity`.
- Ambient intensity writes to `ambient.intensity`.

This keeps the implementation small, inspectable, and consistent with camera
tracks. It also avoids creating hidden mixer roots for renderer-owned editor
infrastructure.

## Data Model

Light tracks were added with timeline version 4. The current timeline document
uses version 9 after object appearance, material, texture, work-area, and marker
features were added:

```ts
interface SceneTimelineDocument {
  version: 10;
  duration: number;
  fps: number;
  currentTime: number;
  loop: boolean;
  snapEnabled: boolean;
  snapStep: number;
  autoKey: boolean;
  camera: CameraTimelineDocument;
  lights: LightTimelineDocument;
  objects: ObjectTimelineDocument[];
}

interface LightTimelineDocument {
  tracks: TimelineTrackDocument[];
}

type LightTimelineTrackKind =
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
```

All keyframe values still use `[number, number, number]` for schema consistency:

- Position: `[x, y, z]`
- Color: `[r, g, b]`
- Intensity: `[intensity, 0, 0]`

## Runtime Rules

- Scrubbing the timeline applies light tracks immediately.
- Playback applies light tracks on every timeline tick.
- Auto-Key creates or updates a light track when the user edits the active
  light's position, color, or intensity.
- Light sweep is suspended whenever light timeline tracks exist, because the
  keyed timeline must be deterministic.
- Undo and Redo use full scene snapshots, matching the existing editor command
  behavior.
- Save/load round trips include `timeline.lights.tracks`.

## UI Rules

Light rows appear after object and camera rows in the bottom timeline panel.
They use the same commands as other tracks:

- Add keyframe.
- Delete selected keyframes.
- Duplicate selected keyframes.
- Previous/next keyframe navigation.
- Clear active track.
- Linear, Ease In, Ease Out, Easy Ease, and Hold interpolation.
- Snap, loop, duration, FPS, and Auto-Key.

## Testing

The Playwright timeline workflow now verifies that a point-light intensity track
can be keyed through the UI and saved to scene JSON. The production build also
typechecks the expanded timeline schema.

Recommended manual checks:

1. Select Point light.
2. Select `Point Intensity` in the timeline track dropdown.
3. Add a keyframe at 0 seconds.
4. Move to 2 seconds and change intensity with Auto-Key enabled.
5. Scrub between 0 and 2 seconds and confirm the light changes smoothly.
6. Save JSON and verify the current timeline schema version and
   `timeline.lights.tracks` contains the new track.

## Next Extensions

Object Color, Opacity, Roughness, Metalness, Visibility, and texture transform
tracks have since been implemented. The next property-track slice should target
per-axis expansion and curve editing.

These can reuse the same track collection pattern but need clearer UI grouping,
because material tracks belong to selected scene objects while light tracks are
global scene controls.
