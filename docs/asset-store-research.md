# Asset Store Research And Design

## Research Summary

The asset-store feature should improve grading screenshots without turning the
release into a network-dependent marketplace. The app is still a static Vite
build, so the first version uses local procedural assets and built-in models.

Useful references:

- [Poly Haven](https://polyhaven.com/license) is a strong future source for
  HDRIs, textures, and glTF models because its assets are CC0/public-domain
  equivalent. Its public API has separate terms, so the first release should not
  hotlink it at runtime.
- [ambientCG](https://docs.ambientcg.com/license/) is a strong future source for
  PBR materials. Its downloadable assets and preview renders are CC0, including
  permission to include raw files in projects.
- [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)
  is the correct reference library for glTF demonstrations. It provides a
  searchable browser, screenshots, metadata, and per-model license notes, so
  every bundled model must be checked individually.
- [Threepipe](https://github.com/repalash/threepipe) confirms the editor
  pattern: asset import/export, material management, post-processing presets,
  serialization, undo/redo, and timeline animation should be treated as a
  pipeline rather than isolated buttons.

## Decision

Implement an offline "Asset Store" inspector panel now, then treat external
asset libraries as curated future packs.

Reasons:

- The project must run from `Release/` with no network dependency.
- CC0 sources are excellent, but model and HDR files can make the archive too
  large for coursework submission.
- Procedural textures are tiny, deterministic, and legally safe.
- Asset cards give the evaluator one-click access to polished looks, materials,
  textures, and built-in models.

## Implemented First Version

The new catalog lives in `Source/src/scene/assetStore.ts`.

Asset types:

- `look`: applies scene rendering presets such as Product Look and Anime Look.
- `texture`: applies procedural texture presets to the selected object.
- `material`: applies existing material presets to the selected object.
- `primitive`: creates polished built-in geometry such as Teapot and Torus Knot.
- `model`: creates the built-in Sample Drone model.

New procedural texture assets:

- Bricks
- Wood
- Carbon Fiber
- Blueprint Grid
- Comic Dots

These are generated with `CanvasTexture`, so they require no files in
`Release/assets`.

## Future Pack Plan

Recommended long-term structure:

```text
Source/src/scene/assetStore.ts        # catalog schema and built-in cards
Source/src/assets/packs/              # curated optional metadata
Source/public/assets/models/          # compressed GLB files, license checked
Source/public/assets/textures/        # compressed JPG/WebP material maps
Source/public/assets/licenses/        # source and license text per asset
```

Future external packs should include:

- `polyhaven-hdri-small`: one or two 1k HDR/EXR environments, converted and
  size-checked.
- `ambientcg-materials-small`: two or three low-resolution PBR material sets.
- `khronos-gltf-samples-small`: one compact `.glb` with a simple license.

Do not bundle Sketchfab or marketplace assets unless the exact asset license is
reviewed and saved next to the file.
