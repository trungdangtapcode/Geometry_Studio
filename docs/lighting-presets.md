# Lighting Presets

## Purpose

Lighting presets make the renderer easier to demonstrate. Instead of manually
tuning four controls and three light positions, the evaluator can switch
between named rigs that show shadow, fill, rim, product, and mood lighting
differences immediately.

## Research Basis

- Blender documents tri-lighting as a three-point studio setup built from
  key, fill, and back lights.
- Three.js recommends choosing light types by behavior: `DirectionalLight` for
  sun-like light, `PointLight` for local fill, and `SpotLight` for cone-shaped
  focused light.
- Three.js shadow documentation notes that shadow maps are rendered from the
  light point of view, so practical real-time rigs should avoid unnecessary
  high-cost shadow casters.

Decision: use the existing ambient, directional, point, and spot light rig, then
add named presets on top of it. No new dependency is needed.

## Presets

- `Studio`: neutral default used by the starter scene.
- `Product`: clean high-key product lighting with a cooler fill and warm rim.
- `Dramatic`: low ambient light, warm key, blue fill, stronger spot emphasis.
- `Soft`: higher ambient fill and lower direct light for low-contrast shape
  inspection.
- `Night`: cool low-key rig with stronger local point light and warm accent.

## Architecture

`Source/src/scene/lightingPresets.ts` owns preset data and helper functions:

- `lightingPresetById()`
- `applyLightingPreset()`
- `lightRigMatchesPreset()`

`main.ts` only binds buttons, records history, applies the preset, syncs shadow
state to scene objects, and updates the UI. Existing scene JSON already stores
all affected light values, so no new document version is required.

## Validation

Playwright applies the Product preset, verifies inspector controls and active
button state, exports scene JSON, and checks persisted ambient, directional,
point, shadow, and sweep values.
