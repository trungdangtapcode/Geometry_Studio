# Rendering Lab

## Status

Rendering Lab controls are implemented as a real-time WebGL renderer slice.
The viewport remains rasterized WebGL, not ray tracing, but the user can now
change tone mapping, exposure, shadow-map quality, generated environment
lighting, Bloom, and Vignette from the inspector.

## Controls

- `Tone Map` switches between ACES, Linear, Reinhard, and no tone mapping.
- `Exposure` adjusts `WebGLRenderer.toneMappingExposure`.
- `Shadows` changes shadow-map quality for the directional, point, and spot
  lights.
- `Environment` switches between no image-based lighting and generated PMREM
  studio presets.
- `Bloom` enables `UnrealBloomPass` with strength, threshold, and radius
  controls.
- `Vignette` enables `VignetteShader` darkness control.
- Telemetry reports the active tone map, exposure, shadow quality, environment,
  and post-processing state alongside FPS, draw calls, triangles, lines, points,
  geometries, textures, and object count.

## Persistence

Scene JSON is now document version 6. Older scene versions load through
defaults:

```json
{
  "rendering": {
    "toneMapping": "aces",
    "exposure": 1.05,
    "shadowQuality": "high",
    "environment": "studio",
    "postProcessing": {
      "bloom": false,
      "bloomStrength": 0.42,
      "bloomRadius": 0.22,
      "bloomThreshold": 0.72,
      "vignette": false,
      "vignetteDarkness": 0.75
    }
  }
}
```

## Architecture

`renderer/renderSettings.ts` owns tone mapping, exposure, and shadow defaults.
`renderer/environment.ts` owns generated PMREM environment lighting.
`renderer/postProcessing.ts` owns Bloom and Vignette settings.
`editor/documents.ts` persists normalized settings, while `main.ts` binds UI
controls and applies settings to the active renderer, light rig, environment
controller, and post-processing passes.

This keeps renderer-specific behavior out of the timeline and scene-object
modules, and keeps saved scene data independent of Three.js constants.

## Testing

Playwright coverage checks that the Rendering Lab controls are visible with the
default values and that selecting an environment preset updates the renderer
summary. The core smoke test enables Bloom and Vignette. The save/load timeline
workflow also changes tone mapping, exposure, and shadow quality, then verifies
the exported scene JSON preserves those values.
