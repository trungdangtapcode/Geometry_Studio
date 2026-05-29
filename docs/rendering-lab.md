# Rendering Lab

## Status

Rendering Lab controls are implemented as a real-time WebGL renderer slice.
The viewport remains rasterized WebGL, not ray tracing, but the user can now
change tone mapping, exposure, shadow-map quality, and generated environment
lighting from the inspector.

## Controls

- `Tone Map` switches between ACES, Linear, Reinhard, and no tone mapping.
- `Exposure` adjusts `WebGLRenderer.toneMappingExposure`.
- `Shadows` changes shadow-map quality for the directional, point, and spot
  lights.
- `Environment` switches between no image-based lighting and generated PMREM
  studio presets.
- Telemetry reports the active tone map, exposure, shadow quality, and
  environment alongside FPS, draw calls, triangles, lines, points, geometries,
  textures, and object count.

## Persistence

Scene JSON is now document version 4. Older scene versions load through
defaults:

```json
{
  "rendering": {
    "toneMapping": "aces",
    "exposure": 1.05,
    "shadowQuality": "high",
    "environment": "studio"
  }
}
```

## Architecture

`renderer/renderSettings.ts` owns tone mapping, exposure, and shadow defaults.
`renderer/environment.ts` owns generated PMREM environment lighting.
`editor/documents.ts` persists normalized settings, while `main.ts` binds UI
controls and applies settings to the active renderer, light rig, and
environment controller.

This keeps renderer-specific behavior out of the timeline and scene-object
modules, and keeps saved scene data independent of Three.js constants.

## Testing

Playwright coverage checks that the Rendering Lab controls are visible with the
default values and that selecting an environment preset updates the renderer
summary. The save/load timeline workflow also changes tone mapping, exposure,
and shadow quality, then verifies the exported scene JSON preserves those
values.
