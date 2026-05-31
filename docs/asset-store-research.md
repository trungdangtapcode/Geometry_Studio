# Asset Browser Research And Design

## Research Summary

The asset workflow should feel like a small DCC asset browser, not another
crowded inspector section. The app remains a static Vite build, so the
implementation uses direct public `.glb` links for online models and keeps all
existing procedural/built-in assets available offline.

Useful references:

- [Poly Haven](https://polyhaven.com/license) is a strong future source for
  HDRIs, textures, and glTF models because its assets are CC0/public-domain
  equivalent. Its [API](https://polyhaven.com/our-api) exposes metadata,
  download URLs, file hashes, and dependencies, but API requests require a
  unique User-Agent and commercial API usage has separate terms. A browser-only
  Vite build cannot set the `User-Agent` header, so production integration
  should use a generated manifest or a small optional proxy instead of raw
  client-side API calls.
- [ambientCG](https://docs.ambientcg.com/license/) is a strong future source for
  PBR materials. Its downloadable assets and preview renders are CC0, including
  permission to include raw files in projects. Its
  [API](https://docs.ambientcg.com/api/) is useful for hobby/education tooling,
  but the maintainer explicitly warns that the service is not enterprise-grade.
- [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)
  is the first online provider. It provides a searchable browser, screenshots,
  metadata, per-model license notes, and direct `.glb` downloads that work from
  a browser via CORS.
- [OpenSource3DAssets / OS3A](https://github.com/ToxSam/open-source-3D-assets)
  is a strong static-provider model: GitHub-hosted JSON catalogs, direct model
  URLs, preview images, clear license metadata, and mostly CC0 Polygonal Mind
  GLB collections. This is a good bridge between a hand-curated catalog and a
  future provider-adapter search flow.
- [Sketchfab Download API](https://sketchfab.com/developers/download-api) is the
  largest long-term model source. It provides Creative Commons models in
  glTF/GLB/USDZ, but downloads require end-user Sketchfab authentication, so it
  needs an OAuth flow and cannot be a simple static no-login feature.
- [Smithsonian Open Access](https://www.si.edu/openaccess/faq) is excellent for
  high-impact educational assets. CC0 records can include glTF, GLB, and OBJ
  files, and the [3D API](https://3d-api.si.edu/api-docs/) can filter file
  search results by model/file type. The API is documented as alpha, so imported
  assets should be normalized and guarded by size/type checks.
- [NASA 3D Resources](https://www.nasa.gov/3d-resources/) is useful for curated
  spacecraft, rover, telescope, and texture assets. NASA says these resources
  are free to download and use, but also points users to NASA usage guidelines,
  so it is best handled as a curated source with visible attribution/source
  links.
- [Kenney](https://kenney.nl/support) provides public-domain/CC0 game assets,
  including many 3D kits. It is pack-oriented rather than API-oriented, making it
  better for optional offline asset packs than live search.
- [CGTrader API](https://www.cgtrader.com/developers) and
  [Fab](https://dev.epicgames.com/documentation/en-us/fab) are professional
  marketplace options, but they require marketplace accounts, API access, paid
  licensing, or launcher workflows. They should not be first-line integrations
  for a coursework static build.
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
Provider definitions live in `Source/src/scene/assetProviders.ts` so active
sources, planned public APIs, generated-manifest sources, and OAuth-only
marketplaces are tracked separately from individual asset cards.
The UI is a dedicated Asset Browser opened from the left rail.

The active local provider also includes copied campus GLB assets from
`/home/tcuong1000/graphic/CS105-Computer_Graphics/project/assets/3dModels/`.
Those files are copied into `Source/public/assets/campus/` so the release does
not depend on another checkout at runtime. The E Hall campus landscape is an
optimized copy so it stays below GitHub's normal 100 MiB file limit for Pages
deployment.

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

Copied local campus provider:

- Campus Landscape / E Hall one-click scene
- Campus E Hall
- Campus Main Gate
- Campus Tree
- Campus Drone

The intended campus workflow is the one-click `Load Campus` action in the
Asset Browser. It clears the current scene, loads the copied `E Hall` campus GLB
as a ready-to-view landscape, applies a sharp campus lighting/render preset, and
frames the camera automatically. Depth of Field, SSAO, and Bloom are disabled by
default for this preset because those effects intentionally reduce render-buffer
resolution or add blur, which makes a wide campus landscape hard to inspect.
The individual campus cards remain available only when the user wants to inspect
or reuse separate copied assets.

Second static provider:

- Park Bench
- Medieval Barrel
- Red Fair Balloon

These come from OpenSource3DAssets / Polygonal Mind CC0 collections and use the
same remote import pipeline, thumbnail preview UI, and scene-source metadata as
the Khronos assets.

Each card displays provider, size, license summary, and source link. The source
repository remains the authority for final license details.

Online model cards now also display preview thumbnails loaded from the Khronos
model screenshot folders. Imported remote models store their provider, asset id,
license summary, attribution, source URL, and preview URL in the scene JSON.
When an imported catalog model is selected, the inspector shows an Asset Source
section with preview, provider, license, credit, source link, and citation copy
button so screenshots and reports can trace where the model came from.

Remote asset cards now expose immediate import feedback directly on the clicked
card. The card shows a progress bar, status text, disabled busy button state,
and success/error state while the existing inspector progress bar continues to
show the global import status.

Sketchfab remains explicitly listed as an OAuth-only reference provider. The
project may use the official Sketchfab Download API in the future, but only with
end-user authentication and visible Creative Commons license/creator
attribution. The static release must not scrape Sketchfab pages, bypass login,
or embed unauthenticated download URLs.

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

## Provider Comparison

| Provider | Best Use | Integration Fit | Main Constraint | Recommendation |
| --- | --- | --- | --- | --- |
| Khronos glTF Sample Assets | Reference GLB models, PBR/transmission/testing samples | Excellent for current static app | Per-model license must be checked | Keep as first provider and add preview thumbnails |
| OS3A / Polygonal Mind | Lightweight CC0 props and environment assets | Excellent for static manifests and direct GLB imports | Registry quality varies by collection; keep curated shelf small | Add as a second online provider before live search |
| Poly Haven | HDRIs, textures, realistic props | Excellent with a build-time manifest or proxy | API requires unique User-Agent; commercial API terms | Add as Phase 2 via generated manifest, not raw browser API |
| ambientCG | PBR material library | Strong for material/texture browser | API reliability warning; mostly materials | Add material packs before full live API search |
| Smithsonian Open Access | Cultural heritage, fossils, spacecraft artifacts | Strong educational value | Alpha API; large/irregular assets | Add curated no-auth search/import with strict filters |
| NASA 3D Resources | Space/science wow assets | Good curated direct-link source | Usage guidelines and inconsistent formats | Add manually curated NASA shelf |
| Kenney | Low-poly game-ready kits | Best as offline packs | No proper live search API | Add optional downloaded/bundled packs |
| Quaternius | Low-poly characters/vehicles/animated packs | Best as offline packs | Pack/site oriented; verify each license | Add after Kenney if animation assets are needed |
| Sketchfab | Massive model catalog | Best long-term professional integration | OAuth required; licenses vary; API gives GLB/glTF/USDZ only | Add after provider architecture and login UI |
| BlenderKit | Blender-oriented assets/materials | Weak for direct browser import | Account/licensing/API-key workflow | Reference only unless building a Blender bridge |
| CGTrader/Fab | Commercial marketplace assets | Weak for coursework/static app | API/account/purchase/business licensing | Link out, do not direct-import first |

## Integration Architecture

Use a provider adapter instead of hard-coding every source into the UI:

```ts
interface AssetProvider {
  id: string;
  label: string;
  search(query: AssetSearchQuery): Promise<AssetSearchResult[]>;
  getDetails(assetId: string): Promise<AssetDetails>;
  download(assetId: string, variantId: string): Promise<DownloadedAsset>;
}
```

Common metadata should be normalized before the importer sees it:

- `id`, `provider`, `label`, `description`, `tags`
- `license`, `author`, `sourceUrl`, `requiredAttribution`
- `thumbnailUrl`, `previewUrl`, `fileType`, `fileSizeBytes`
- `downloadUrl` or provider-specific `variantId`
- `capabilities`: `hasPbr`, `hasAnimation`, `hasTextures`, `isHuge`,
  `requiresAuth`

The UI should never download a heavy model immediately. The professional flow
should be:

1. Search or browse provider.
2. Show preview image, license, format, estimated size, and source link.
3. User clicks Import.
4. Download with progress and cancel support.
5. Validate file extension, response size, and MIME when available.
6. Import through the existing GLB/OBJ/STL pipeline.
7. Normalize scale/center, add shadows, add object metadata, and store source
   license info in the scene document.

## Recommended Roadmap

### Phase 1: Finish The Current Asset Browser

- Add filters: Provider, Type, License, Size, PBR, Animated.
- Add download progress and cancel.

### Phase 2: Offline And Curated Packs

- Add a `Source/public/assets/catalogs/*.json` manifest format.
- Add a small Kenney/Quaternius-style low-poly pack only after verifying each
  file's license.
- Add one compact NASA or Smithsonian hero model for report screenshots.
- Save license text/source URL beside bundled files.

### Phase 3: Real Provider Adapters

- Add `providers/khronosProvider.ts` for the current curated list.
- Add `providers/smithsonianProvider.ts` with no-auth API search filtered to
  `glb`, `gltf`, and `obj` files below a configurable size limit.
- Add `providers/polyHavenManifestProvider.ts` based on a generated JSON manifest
  rather than direct browser API calls.
- Add `providers/ambientCgMaterialProvider.ts` for material packs.

### Phase 4: OAuth Marketplace Integration

- Add Sketchfab only after the asset provider layer is stable.
- Use OAuth PKCE or an optional backend token flow; do not place client secrets
  in the frontend bundle.
- Store attribution/license metadata in scene JSON and exports.
- Keep Fab/CGTrader as external links unless the project scope grows to include
  account and purchase management.

## Current Best Choice

For this project, the best near-term stack is:

1. **Khronos** for live GLB imports and renderer-reference previews.
2. **OS3A / Polygonal Mind** for lightweight CC0 prop/environment assets.
3. **Smithsonian/NASA curated shelf** for impressive educational/science models.
4. **Poly Haven + ambientCG** for material, HDRI, and PBR look improvements.
5. **Kenney/Quaternius offline packs** for lightweight low-poly props.
6. **Sketchfab OAuth** as the long-term "real asset store" feature.

This keeps the app legal, static-release friendly, and convincing for grading,
while leaving a credible path to a professional asset browser later.
