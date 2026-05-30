# SSAO Rendering

## Purpose

Geometry Studio now includes optional screen-space ambient occlusion in the
Rendering Lab. SSAO adds contact darkening around nearby surfaces, which makes
models, primitives, and ground contact points read with more depth without
switching the viewport to an offline renderer.

## Research Basis

- Three.js `SSAOPass` is a built-in post-processing addon for basic
  screen-space ambient occlusion.
- The Three.js source notes that `SAOPass` and `GTAPass` can produce more
  advanced ambient occlusion but cost more GPU time.
- SSAO is a raster post-process. It is not ray tracing or path tracing, so it
  remains appropriate for an interactive editor viewport.

## Architecture

`Source/src/renderer/pipeline.ts` inserts `SSAOPass` after `RenderPass` and
before Bloom, Vignette, Outline, and Output. The pass uses a capped internal
resolution during resize, matching the existing Bloom budget pattern so high-DPI
screens do not create excessive post-processing buffers.

`Source/src/renderer/postProcessing.ts` owns SSAO defaults, scene-file
normalization, pass application, and renderer-summary labeling. SSAO settings
are nested under `RenderSettings.postProcessing`, so they are saved and loaded
with the rest of the rendering configuration.

## Controls

- `SSAO`: enables or disables the pass.
- `SSAO Radius`: controls the sampling radius and visible spread of occlusion.
- `SSAO Min`: controls the minimum affected distance.
- `SSAO Max`: controls the maximum affected distance.

Defaults keep SSAO disabled to preserve performance and compatibility. The
evaluator can enable it from Rendering Lab when demonstrating shading effects.
The pass is disabled in automated browsers and on detected software WebGL
backends, while the user's setting still remains visible and persists in scene
JSON. In supported hardware-backed browsers, enabling SSAO lowers the internal
post-processing pixel budget so the editor remains interactive.

## Validation

The Playwright core smoke test toggles SSAO, checks the renderer summary, edits
the radius control, and verifies scene JSON persistence. Typecheck and
production build must pass before release assets are committed.
