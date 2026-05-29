# Environment Lighting Presets

## Purpose

Environment lighting is the next renderer improvement after PBR material
presets. It gives Standard materials more realistic reflections and roughness
response while keeping the viewport real-time and offline-safe.

## Research Basis

- Three.js `PMREMGenerator` is designed to prefilter environment maps for
  physically based rendering, especially roughness-dependent reflections.
- Three.js `RoomEnvironment` is a generated local studio environment. It avoids
  external HDR downloads and is based on the environment approach used by
  Google model-viewer.
- The implementation keeps rasterized WebGL as the main renderer. It does not
  claim ray tracing.

## Architecture

The feature lives in `Source/src/renderer/environment.ts`:

- `EnvironmentPresetId` is stored in `RenderSettings`.
- `createEnvironmentController()` builds one PMREM texture from
  `RoomEnvironment`.
- `environmentController.apply()` updates `scene.environment`,
  `scene.environmentIntensity`, background color, fog, and environment
  rotation.
- Scene JSON is bumped to version 4. Older scene files migrate to the default
  `studio` environment.

The controller is intentionally separate from `main.ts` so future HDR assets,
custom cube maps, or uploaded environment maps can be added without expanding
the editor shell.

## Presets

- Off: disables image-based lighting for baseline comparison.
- Studio: neutral default for grading demos.
- Gallery: brighter showroom lighting.
- Warm Studio: warmer background and rotated environment.
- Cool Lab: cooler inspection lighting.

## Validation

The smoke test selects the Gallery environment and verifies that the Rendering
Lab summary updates. TypeScript, production build, and browser smoke tests must
pass before release assets are committed.
