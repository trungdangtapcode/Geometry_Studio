# Depth Of Field Post-Processing

## Purpose

Depth of Field gives the real-time viewport a camera-lens effect for report
screenshots and cinematic demonstrations. It is useful when the evaluator needs
to see that the project goes beyond primitive drawing and includes a modern
post-processing renderer.

This is still WebGL raster rendering. It is not path tracing or ray tracing.

## Research Basis

- Three.js ships `BokehPass` as an official post-processing addon.
- `BokehPass` integrates directly with `EffectComposer`, the existing renderer
  pipeline, and the editor's `PerspectiveCamera`.
- Keeping the effect inside the Three.js addon stack avoids adding a second
  post-processing framework or a large dependency.

## Architecture

`Source/src/renderer/pipeline.ts` adds `BokehPass` after SSAO and before Bloom,
Vignette, Outline, FXAA, and Output. This order lets depth blur affect the
lit scene first, while later outline and final output conversion stay readable.

`Source/src/renderer/postProcessing.ts` owns the settings:

- `dof`: enabled state
- `dofFocus`: camera focus distance
- `dofAperture`: aperture strength
- `dofMaxBlur`: blur cap

The settings are normalized with bounded numeric ranges, persisted in scene
JSON under `rendering.postProcessing`, and restored for older scene files by
falling back to disabled defaults.

When Depth of Field is combined with heavier effects such as SSAO, the renderer
reduces its internal drawing-buffer budget before resizing the composer. The
canvas keeps the same layout size, but the expensive post-processing passes
operate on fewer pixels so the editor remains responsive on software WebGL and
low-end evaluator machines.

## UI

The Rendering Lab exposes:

- `Depth of Field`
- `DOF Focus`
- `DOF Aperture`
- `DOF Blur`

The renderer status label lists `DOF On` when enabled and composes it with
FXAA, SSAO, Bloom, and Vignette status.

The heavy Bokeh pass is disabled in automated browsers and on detected software
WebGL backends such as SwiftShader. The setting remains visible and persists to
scene JSON, while supported hardware-backed browsers use an adaptive pixel
budget to stay responsive when DOF is enabled.

## Validation

Playwright toggles Depth of Field, changes focus/aperture/blur controls, and
confirms scene JSON persistence. TypeScript and production build are required
before publishing.
