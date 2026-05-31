# Object Property Timeline Tracks

## Status

Object appearance timeline tracks were introduced in schema v5 and expanded in
schema v6. They remain supported in current schema v10. This adds a second class
of object-owned tracks beyond transforms:

- Color.
- Opacity.
- Roughness.
- Metalness.
- Visibility.

These tracks make Geometry Studio closer to an After Effects style editor where
the timeline can animate multiple exposed properties of the selected layer.

## Design

Object Position, Rotation, and Scale are evaluated directly from the timeline
document so per-keyframe Hold, Linear, Ease In, Ease Out, and Easy Ease timing
works consistently.
Color, Opacity, and Visibility use the same evaluator and are applied to
renderer/editor properties during scrubbing and playback.

This keeps the architecture split clear:

- Transform tracks: direct transform application.
- Object appearance tracks: direct property application.
- Camera and light tracks: direct property application.

The timeline document remains the only durable source of truth.

## Data Model

Timeline schema v6 extends object tracks:

```ts
type ObjectTimelineTrackKind =
  | "position"
  | "rotation"
  | "scale"
  | "objectColor"
  | "objectOpacity"
  | "objectRoughness"
  | "objectMetalness"
  | "objectVisibility";
```

All keyframes continue to use `[number, number, number]`:

- Color: `[r, g, b]` in Three.js linear color component values.
- Opacity: `[opacity, 0, 0]`, clamped from 0 to 1.
- Roughness: `[roughness, 0, 0]`, clamped from 0 to 1.
- Metalness: `[metalness, 0, 0]`, clamped from 0 to 1.
- Visibility: `[1, 0, 0]` for visible, `[0, 0, 0]` for hidden.

Scene objects also save their current `opacity` and `visible` state so a scene
round trip preserves the non-animated base appearance. Schema v6 also saves
`roughness` and `metalness`.

## Runtime Rules

- Scrubbing applies object appearance tracks immediately.
- Playback applies object appearance tracks on every timeline tick.
- Auto-Key creates or updates Color, Opacity, Roughness, Metalness, and
  Visibility tracks when the matching inspector controls change.
- Appearance tracks do not disable transform animation. Position, Rotation, and
  Scale tracks drive motion, including presets that are baked into visible
  keyframes.
- Opacity updates existing object materials in place instead of rebuilding the
  visual hierarchy every frame.
- Roughness and metalness update Standard materials in place.
- Visibility tracks toggle the object root group.

## UI Rules

The timeline track dropdown now exposes:

- Position.
- Rotation.
- Scale.
- Color.
- Opacity.
- Roughness.
- Metalness.
- Visibility.

The Render Mode inspector exposes matching base controls for color, opacity,
roughness, metalness, and visibility. With Auto-Key enabled, editing those
controls records keyframes at the current playhead time.

## Testing

The Playwright timeline workflow verifies:

- Schema v6 is saved.
- Object Color, Opacity, Roughness, Metalness, and Visibility tracks are created
  through the UI.
- Track keyframes round trip into exported scene JSON.
- Clearing a transform track leaves appearance tracks intact, so the object is
  still reported as keyframed.

Recommended manual check:

1. Select an object.
2. Enable Auto-Key.
3. Add Color, Opacity, Roughness, Metalness, and Visibility keyframes at time 0.
4. Move the playhead and change the inspector controls.
5. Scrub the timeline and confirm the object changes appearance.
6. Save JSON and verify the current timeline schema version.

## Remaining Property Track Work

The next useful additions are:

- Per-axis expansion for Position, Rotation, and Scale.
- Graph/curve editing for finer interpolation control.
