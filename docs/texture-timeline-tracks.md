# Texture Timeline Tracks

## Status

Texture transform timeline tracks were introduced in schema v7 and remain
supported in current schema v9:

- Texture Repeat.
- Texture Offset.
- Texture Rotation.

This continues the After Effects style property expansion by making texture
mapping animatable from the same dope-sheet as transforms, camera, lights, and
material properties.

## Data Model

Timeline schema v7 extends object tracks:

```ts
type ObjectTimelineTrackKind =
  | "objectTextureRepeat"
  | "objectTextureOffset"
  | "objectTextureRotation";
```

All keyframes still use `[number, number, number]`:

- Repeat: `[repeatX, repeatY, 0]`
- Offset: `[offsetX, offsetY, 0]`
- Rotation: `[rotationRadians, 0, 0]`

Scene objects now save these base texture properties:

```ts
interface SerializedObject {
  textureRepeat: [number, number];
  textureOffset?: [number, number];
  textureRotation?: number;
}
```

## Runtime Rules

- Scrubbing applies texture tracks immediately.
- Playback applies texture tracks on every timeline tick.
- Auto-Key creates or updates the matching texture transform track when the
  inspector controls change.
- Texture tracks do not disable transform animation. Motion presets are baked
  into ordinary Position, Rotation, or Scale keyframes.
- Texture rotation uses a texture center of `(0.5, 0.5)` so rotation behaves
  like an editor control rather than spinning around the UV origin.

## UI Rules

The Texture inspector now exposes:

- Repeat X/Y.
- Offset X/Y.
- Rotation in degrees.

The timeline track dropdown exposes:

- Texture Repeat.
- Texture Offset.
- Texture Rotation.

## Testing

The Playwright timeline workflow verifies:

- Texture tracks are saved in the current timeline schema.
- Texture Repeat, Offset, and Rotation tracks are created through the UI.
- Track keyframes round trip into exported scene JSON.
- Base scene texture transform values round trip in the saved object document.

Recommended manual check:

1. Select an object and apply the UV texture preset.
2. Enable Auto-Key.
3. Add Repeat, Offset, and Rotation keyframes at time 0.
4. Move the playhead and change the texture controls.
5. Scrub the timeline and confirm the texture mapping changes.
6. Save JSON and verify the current timeline schema version.

## Remaining Timeline Work

Texture source changes are not yet keyframed. The next useful timeline
extensions are:

- Per-axis tracks for transform and texture values.
- Graph/curve editing.
- Clip blocks and timeline regions.
- Nested model bone and morph target tracks.
