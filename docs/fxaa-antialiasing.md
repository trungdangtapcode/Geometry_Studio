# FXAA Anti-Aliasing

## Purpose

FXAA gives the post-processing renderer a lightweight edge-smoothing option.
The app already creates `WebGLRenderer` with `antialias: true`, but the
`EffectComposer` chain renders through intermediate textures, so a final
screen-space anti-aliasing pass is useful when Bloom, SSAO, Vignette, or
Outline are active.

## Research Basis

- Three.js ships an official `FXAAPass` addon in
  `three/addons/postprocessing/FXAAPass.js`.
- `FXAAPass` wraps the official `FXAAShader`, which exposes the expected
  screen-resolution uniform and avoids project-specific shader code.
- `pmndrs/postprocessing` provides a larger effect framework with FXAA and
  SMAA, but adding that dependency just for one anti-aliasing toggle would make
  the current Vite release larger and increase integration surface.

Decision: use Three.js `FXAAPass` directly.

## Architecture

`Source/src/renderer/pipeline.ts` adds `FXAAPass` near the end of the composer:

1. `RenderPass`
2. `SSAOPass`
3. `UnrealBloomPass`
4. `ShaderPass(VignetteShader)`
5. `OutlinePass`
6. `FXAAPass`
7. `OutputPass`

Placing FXAA after Outline smooths the selected-object edge as well as scene
geometry. `OutputPass` remains last so final output conversion stays centralized.

`Source/src/renderer/postProcessing.ts` owns the default `fxaa: false`, scene
JSON normalization, pass application, and summary label. The toggle is persisted
under `RenderSettings.postProcessing.fxaa`, so older saved scenes still load by
falling back to the disabled default.

## UI

The Rendering Lab inspector exposes a single `FXAA` toggle. It is intentionally
simple: no algorithm-specific parameters are surfaced because the Three.js pass
only needs resize-aware resolution.

## Validation

Playwright checks that:

- the FXAA toggle starts disabled,
- enabling FXAA updates the renderer summary,
- FXAA can be combined with SSAO,
- saved scene JSON preserves the `postProcessing.fxaa` setting.

TypeScript and production build must pass before release assets are committed.
