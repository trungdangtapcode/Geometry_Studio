# OBJ + MTL Import

## Purpose

Many downloadable OBJ assets, including teacups and product models, are split
across `.obj`, `.mtl`, and image texture files. Geometry Studio now supports
that workflow without requiring a backend or runtime network access.

## Research Basis

- Three.js `MTLLoader` is the companion loader for OBJ materials.
- The documented pattern is to load or parse MTL materials, call
  `materials.preload()`, then pass them into `OBJLoader.setMaterials()`.
- `LoadingManager.setURLModifier()` lets locally selected companion files
  resolve references such as `map_Kd cup_diffuse.jpg`.

## Architecture

The import path is centered in `Source/src/scene/importers.ts`:

- `loadModelFromFiles()` accepts the full file set from the file picker or
  drag/drop.
- It chooses the first model file as the primary asset.
- For OBJ files, it detects referenced `mtllib` files and matches them against
  the selected local files.
- A `LoadingManager` maps referenced filenames to local object URLs.
- Object URLs are revoked after a delay so texture image fetches have time to
  complete.

Imported source materials are preserved through `SceneEntry.useSourceMaterials`.
`Source/src/scene/materials.ts` clones model materials and texture slots for the
runtime visual, so switching render modes or rebuilding visuals does not mutate
the original imported source object.

## User Workflow

1. Click the import button.
2. Select the `.obj` file plus its `.mtl` file and any referenced image files.
3. The model appears in the outliner with its imported materials.
4. Applying a Geometry Studio material preset intentionally switches the object
   to editor-controlled materials.

Plain OBJ files still import as geometry-only models. If the OBJ references an
MTL file that was not selected, the studio shows a warning toast but still
imports the geometry.

## Validation

Playwright includes a synthetic OBJ + MTL import test. The test loads a minimal
triangle model with a companion MTL file and verifies that the imported object
appears in the outliner.
