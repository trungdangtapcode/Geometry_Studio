# Post-Processing Toggles

## Purpose

Post-processing adds compositor-style effects to the real-time viewport. This
makes the studio feel closer to an animation/compositing tool while keeping the
main renderer interactive and browser-safe.

## Research Basis

- Three.js `EffectComposer` executes post-processing passes in order, with the
  last pass rendering to screen.
- Three.js post-processing examples use `OutputPass` at the end of the chain so
  tone mapping and output color conversion are applied correctly.
- `FXAAPass` wraps the built-in `FXAAShader` and provides a lightweight
  screen-space anti-aliasing step for composer output.
- `SSAOPass` is a built-in Three.js addon for basic screen-space ambient
  occlusion. It is cheaper than heavier AO passes and fits an interactive
  editor viewport.
- `UnrealBloomPass` provides strength, threshold, and radius controls for glow.
- `ShaderPass` can run shader effects such as `VignetteShader`.

## Architecture

`Source/src/renderer/pipeline.ts` now creates this chain:

1. `RenderPass`
2. `SSAOPass`
3. `UnrealBloomPass`
4. `ShaderPass(VignetteShader)`
5. `OutlinePass`
6. `FXAAPass`
7. `OutputPass`

`Source/src/renderer/postProcessing.ts` owns defaults, normalization, pass
application, and display labels. The settings are nested under
`RenderSettings.postProcessing` and persisted in scene document version 6.

Defaults keep optional effects disabled so existing saved scenes load with the
same basic visual style. Users can enable FXAA, SSAO, Bloom, and Vignette from
the Rendering Lab.

## Controls

- FXAA toggle
- SSAO toggle
- SSAO Radius
- SSAO Min Distance
- SSAO Max Distance
- Bloom toggle
- Bloom Strength
- Bloom Threshold
- Bloom Radius
- Vignette toggle
- Vignette Darkness

The renderer summary and telemetry show whether post-processing is off or which
effects are active.

## Validation

The core Playwright smoke test enables FXAA, SSAO, Bloom, and Vignette, verifies
the renderer summary updates, and confirms the editor remains usable. Typecheck
and production build are required before committing release assets.
