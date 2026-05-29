# Geometry Studio Improvement Roadmap

## Purpose

This document records the next improvement plan after the first keyframe
timeline implementation. The goal is to maximize grading clarity and portfolio
quality without destabilizing the current working release.

## Current Status

Implemented and tested:

- Modular Three.js / TypeScript application.
- Static `Release/` build.
- Primitive creation and imported model workflow.
- Solid, point, and line rendering modes.
- Perspective camera controls and frustum helper.
- TransformControls and numeric affine transforms.
- Lighting, helpers, shadows, textures, scene JSON, Undo/Redo, telemetry.
- Position / Rotation / Scale keyframe timeline with JSON persistence.
- Playwright smoke tests and Release-browser screenshots.
- Rendering Lab controls for tone mapping, exposure, shadow quality, telemetry,
  and scene JSON persistence.
- PBR material presets for Ceramic, Metal, Plastic, Glass, and Clay.

## Research Basis

Primary references checked:

- Three.js post-processing manual: `EffectComposer` chains passes and renders
  through `composer.render`, with `RenderPass` and `OutputPass` as common
  building blocks.
- Three.js `UnrealBloomPass`: configurable bloom pass with strength, radius, and
  threshold, intended for tone-mapped renderers.
- Three.js `PMREMGenerator`: prefilters environment maps for physically-based
  image-based lighting and roughness-dependent reflections.
- Three.js `MTLLoader`: companion loader for OBJ material files, used with
  `OBJLoader.setMaterials`.
- Three.js pathtracer example: references `three-gpu-pathtracer` for high
  fidelity path tracing, but this should be treated as a heavier stretch feature.

## Priority Recommendation

Do not make path tracing the next default feature. It is impressive, but it is
heavier, slower, and harder to explain during grading. The better next step is a
Rendering Lab that improves the existing real-time renderer while keeping the
app interactive.

Recommended order:

1. Rendering Lab panel. Implemented: tone mapping, exposure, and shadow quality.
2. PBR material and environment lighting upgrades. Material presets are
   implemented; environment lighting remains a later slice.
3. OBJ + MTL import workflow.
4. Post-processing toggles.
5. Timeline polish.
6. Optional path-traced still preview.

## Phase 1: Rendering Lab

Add a new inspector section named Rendering Lab.

Features:

- Renderer mode summary: WebGL rasterization, not ray tracing.
- Tone mapping selector: ACES, Linear, Reinhard.
- Exposure control.
- Shadow quality selector.
- PBR material presets: ceramic, metal, plastic, glass-like transparent,
  matte clay.
- Environment lighting toggle.
- Clear on-screen telemetry for draw calls, triangles, textures, and shadow
  state.

Acceptance:

- Existing scenes still render correctly.
- Controls are reachable on desktop and mobile.
- Build and Playwright smoke tests pass.

## Phase 2: HDR/PBR Environment Lighting

Use generated or bundled local environment assets, not external network URLs at
runtime.

Implementation direction:

- Add local equirectangular or scene-generated environment maps.
- Use `PMREMGenerator` so roughness and metalness look correct.
- Keep a toggle between plain studio lighting and environment lighting.
- Add material presets that visibly demonstrate roughness, metalness, and
  transparency differences.

Why this matters:

- It gives a realistic rendering improvement without abandoning real-time WebGL.
- It explains modern PBR concepts better than simply adding another primitive.

## Phase 3: OBJ + MTL Import

Current OBJ import handles geometry well, but many downloaded OBJ models rely on
companion `.mtl` files and texture images.

Implementation direction:

- Support multi-file drag/drop: `.obj`, `.mtl`, and image textures together.
- Parse `.mtl` through `MTLLoader`.
- Connect loaded materials to `OBJLoader.setMaterials`.
- Show a clear warning if the OBJ references missing material or texture files.
- Keep `.glb` as the recommended format for fully packaged models.

Acceptance:

- A teacup OBJ with MTL and texture files imports with materials.
- A plain OBJ still imports as geometry-only.
- Missing material files produce a toast, not a broken scene.

## Phase 4: Post-Processing Toggles

The renderer already uses `EffectComposer` and selected-object outline. Extend
that pipeline carefully.

Candidate effects:

- Bloom with `UnrealBloomPass`.
- SSAO-style ambient occlusion if performance remains acceptable.
- Vignette or simple color grading shader.
- Optional FXAA/SMAA anti-aliasing pass if visual quality improves.

Controls:

- Toggle each effect independently.
- Keep default settings conservative.
- Show pass state in the telemetry panel.

Acceptance:

- No startup console errors.
- Render remains responsive on typical laptop hardware.
- Mobile layout can disable heavier effects.

## Phase 5: Timeline Polish

After rendering improvements, refine the timeline:

- Auto-key toggle.
- Duplicate keyframes.
- Clear selected track.
- Fit timeline to duration.
- Camera tracks for cinematic demos.
- Light intensity and color tracks.
- Screenshot in report showing timeline save/load round trip.

## Phase 6: Optional Path-Traced Preview

Add only as a separate still-preview mode, not as the default viewport.

Implementation direction:

- Evaluate `three-gpu-pathtracer`.
- Limit supported objects and materials.
- Render progressively in a modal or side preview.
- Make clear in UI and report that the main editor is rasterized WebGL and the
  path tracer is an optional high-fidelity preview.

Risks:

- Larger bundle.
- More GPU variance.
- Harder testing.
- Possible unsupported materials/imported models.

## Next Commit Plan

Suggested commits:

1. `Document rendering improvement roadmap`
2. `Add rendering lab controls`
3. `Add PBR material presets`
4. `Add environment lighting presets`
5. `Add OBJ MTL import support`
6. `Add post processing toggles`

Keep each commit independently buildable.
