# Texture Timeline Tracks

## Status

Texture transform timeline tracks were introduced in schema v7. Texture source
keyframing was added in schema v10. They remain supported in current schema
v10:

- Texture Source.
- Texture Repeat.
- Texture Offset.
- Texture Rotation.

This continues the After Effects style property expansion by making texture
mapping animatable from the same dope-sheet as transforms, camera, lights, and
material properties.

## Data Model

Timeline schema v7 extended object texture transform tracks. Timeline schema
v10 adds a discrete texture source track:

```ts
type ObjectTimelineTrackKind =
  | "objectTextureSource"
  | "objectTextureRepeat"
  | "objectTextureOffset"
  | "objectTextureRotation";
```

All keyframes still use `[number, number, number]`:

- Source: `[texturePresetIndex, 0, 0]`
- Repeat: `[repeatX, repeatY, 0]`
- Offset: `[offsetX, offsetY, 0]`
- Rotation: `[rotationRadians, 0, 0]`

Texture source values are categorical and use Hold interpolation by default.
The current preset order is None, Checker, UV, Grid. Uploaded bitmap textures
remain a runtime-only object texture and are not serialized into source
keyframes.

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
- Auto-Key creates or updates the matching texture source or transform track
  when the inspector controls change.
- Texture tracks do not disable transform animation. Motion presets are baked
  into ordinary Position, Rotation, or Scale keyframes.
- Texture rotation uses a texture center of `(0.5, 0.5)` so rotation behaves
  like an editor control rather than spinning around the UV origin.
- Texture Source switches rebuild the selected object's visual material because
  the texture map itself changes.

## UI Rules

The Texture inspector now exposes:

- Repeat X/Y.
- Offset X/Y.
- Rotation in degrees.

The timeline track dropdown exposes:

- Texture Repeat.
- Texture Offset.
- Texture Rotation.
- Texture Source.

## Testing

The Playwright timeline workflow verifies:

- Texture tracks are saved in the current timeline schema.
- Texture Source, Repeat, Offset, and Rotation tracks are created through the
  UI.
- Track keyframes round trip into exported scene JSON.
- Base scene texture transform values round trip in the saved object document.

Recommended manual check:

1. Select an object and apply the UV texture preset.
2. Enable Auto-Key.
3. Add Source, Repeat, Offset, and Rotation keyframes at time 0.
4. Move the playhead and change the texture controls.
5. Scrub the timeline and confirm the texture mapping changes.
6. Save JSON and verify the current timeline schema version.

## Remaining Timeline Work

The next useful timeline extensions are:

- Per-axis tracks for transform and texture values.
- Graph/curve editing.
- Clip blocks and timeline regions.
- Nested model bone and morph target tracks.
