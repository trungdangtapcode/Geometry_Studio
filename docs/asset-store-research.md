# Asset Browser Research And Design

## Research Summary

The asset workflow should feel like a small DCC asset browser, not another
crowded inspector section. The app remains a static Vite build, so the
implementation uses direct public `.glb` links for online models and keeps all
existing procedural/built-in assets available offline.

Useful references:

- [Poly Haven](https://polyhaven.com/license) is a strong future source for
  HDRIs, textures, and glTF models because its assets are CC0/public-domain
  equivalent. Its public API has separate terms, so the first release should not
  hotlink it at runtime.
- [ambientCG](https://docs.ambientcg.com/license/) is a strong future source for
  PBR materials. Its downloadable assets and preview renders are CC0, including
  permission to include raw files in projects.
- [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)
  is the first online provider. It provides a searchable browser, screenshots,
  metadata, per-model license notes, and direct `.glb` downloads that work from
  a browser via CORS.
- [Threepipe](https://github.com/repalash/threepipe) confirms the editor
  pattern: asset import/export, material management, post-processing presets,
  serialization, undo/redo, and timeline animation should be treated as a
  pipeline rather than isolated buttons.

## Decision

Implement a dedicated left-rail Asset Browser dock with two first-class source
types:

- Online Models: curated Khronos `.glb` files imported through the existing
  GLB loader.
- Built-in Assets: local looks, procedural textures, material presets,
  primitives, and the Sample Drone.

Reasons:

- A real 3D asset store needs more space than the inspector can provide.
- Keeping asset browsing outside the inspector preserves the inspector for
  selected-object controls.
- Khronos direct `.glb` downloads provide useful, license-documented test
  models without adding large files to the coursework archive.
- Procedural textures are tiny, deterministic, and legally safe.
- The browser can be minimized or closed so it does not cover the editing
  workflow.

## Implemented First Version

The local catalog lives in `Source/src/scene/assetStore.ts`.
The online catalog lives in `Source/src/scene/remoteAssetStore.ts`.
The UI is a dedicated Asset Browser opened from the left rail.

Asset types:

- Online `model`: downloads a curated Khronos `.glb`, creates a `File`, then
  imports it through the existing `loadModelFromFiles()` pipeline.
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

Curated online first provider:

- Avocado
- Boom Box
- Diffuse Transmission Teacup
- Lantern

Each card displays provider, size, license summary, and source link. The source
repository remains the authority for final license details.

## Future Pack Plan

Recommended long-term structure:

```text
Source/src/scene/assetStore.ts        # built-in catalog schema/cards
Source/src/scene/remoteAssetStore.ts  # remote catalog/provider metadata
Source/src/assets/packs/              # curated optional metadata
Source/public/assets/models/          # compressed GLB files, license checked
Source/public/assets/textures/        # compressed JPG/WebP material maps
Source/public/assets/licenses/        # source and license text per asset
```

Future external packs should include:

- `polyhaven-hdri-small`: one or two 1k HDR/EXR environments, converted and
  size-checked.
- `ambientcg-materials-small`: two or three low-resolution PBR material sets.
- `khronos-gltf-samples-small`: cache one compact `.glb` with a simple license
  for fully offline grading.

Do not bundle Sketchfab or marketplace assets unless the exact asset license is
reviewed and saved next to the file.
