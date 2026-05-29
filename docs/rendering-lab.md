# Rendering Lab

## Status

Rendering Lab controls are implemented as a real-time WebGL renderer slice.
The viewport remains rasterized WebGL, not ray tracing, but the user can now
change tone mapping, exposure, and shadow-map quality from the inspector.

## Controls

- `Tone Map` switches between ACES, Linear, Reinhard, and no tone mapping.
- `Exposure` adjusts `WebGLRenderer.toneMappingExposure`.
- `Shadows` changes shadow-map quality for the directional, point, and spot
  lights.
- Telemetry reports the active tone map, exposure, and shadow quality alongside
  FPS, draw calls, triangles, lines, points, geometries, textures, and object
  count.

## Persistence

Scene JSON is now document version 3. Older version 1 and version 2 scenes load
through defaults:

```json
{
  "rendering": {
    "toneMapping": "aces",
    "exposure": 1.05,
    "shadowQuality": "high"
  }
}
```

## Architecture

`renderer/renderSettings.ts` owns the rendering defaults, normalization, labels,
and Three.js application logic. `editor/documents.ts` persists the normalized
settings, while `main.ts` binds UI controls and applies settings to the active
renderer and light rig.

This keeps renderer-specific behavior out of the timeline and scene-object
modules, and keeps saved scene data independent of Three.js constants.

## Testing

Playwright coverage checks that the Rendering Lab controls are visible with the
default values. The save/load timeline workflow also changes tone mapping,
exposure, and shadow quality, then verifies the exported scene JSON preserves
those values.
