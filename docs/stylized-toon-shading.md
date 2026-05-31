# Stylized Toon, Anime, And Comic Shading

## Research Basis

- Three.js `MeshToonMaterial` is the lowest-risk cel-shading base because it is
  a built-in lit material and supports a nearest-filtered `gradientMap` for
  stepped shading bands:
  https://threejs.org/docs/pages/MeshToonMaterial.html
- Three.js `OutlineEffect` is built specifically as an outline effect for toon
  shaders:
  https://threejs.org/docs/pages/OutlineEffect.html
- Three.js `HalftoneShader` and `HalftonePass` provide a built-in RGB halftone
  screen-print effect suitable for comic rendering:
  https://threejs.org/docs/pages/module-HalftoneShader.html
- `pmndrs/postprocessing` is a larger production post-processing library with a
  mature outline effect and many image-processing effects:
  https://github.com/pmndrs/postprocessing
- `@pixiv/three-vrm` includes an MToon material implementation with anime
  features such as shade color, rim lighting, outline width, and outline color:
  https://pixiv.github.io/three-vrm/docs/classes/three-vrm-materials-mtoon.MToonMaterial.html
- `ZaneAtega/Three-js-Anime-Shader` is a reference implementation for custom
  GLSL anime-style shading in Three.js:
  https://github.com/ZaneAtega/Three-js-Anime-Shader

## Selected Approach

The current implementation intentionally starts with Three.js built-ins and one
small local shader helper:

- Add an `Anime Toon` material mode backed by `MeshToonMaterial`.
- Use a generated four-step gradient texture with nearest filtering for clean
  cel bands.
- Add an inverted-hull ink outline mesh for objects using the toon material.
- Preserve imported model source texture maps when possible while converting the
  final visible material to toon.
- Convert unlit imported source materials such as `MeshBasicMaterial` to
  readable `MeshStandardMaterial` clones so robot/drone models respond to lights
  and shadows.
- Add `Comic Halftone` as an optional post-processing pass in the existing
  Three.js `EffectComposer` chain.

This avoids adding a large shader framework before the workflow is proven in the
editor UI. It also keeps `Release` static-server friendly.

## Deferred Options

- Integrate `@pixiv/three-vrm` if the project later adds VRM character import
  and wants proper MToon parameter support.
- Replace the local inverted-hull outline with Three.js `OutlineEffect` only if
  the project needs a renderer-level toon outline pass separate from the current
  `EffectComposer` chain.
- Consider `pmndrs/postprocessing` only if multiple advanced post effects become
  necessary. It is powerful, but the project already uses Three.js addons for
  SSAO, Bloom, DOF, FXAA, selected-object outlines, and Halftone.

## Current UI

- Inspector -> Render Mode -> Material -> `Anime Toon`.
- Inspector -> Render Mode -> material preset `Anime Toon`.
- Inspector -> Rendering Lab -> `Comic Halftone`, `Halftone Size`, and
  `Halftone Scatter`.

## Testing

Automated coverage should verify:

- `Anime Toon` appears as a material mode and preset.
- `Comic Halftone` can be enabled and reflected in the renderer status.
- Scene JSON preserves halftone render settings.
- Imported models with unlit source materials remain visible under scene lights.

Manual visual checks should use at least one robot/drone GLB or OBJ, because
hard-surface models make outline thickness, cel bands, and source-material
conversion problems obvious.
