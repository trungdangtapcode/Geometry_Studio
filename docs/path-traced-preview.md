# Path-Traced Still Preview

## Status

Geometry Studio now includes an optional path-traced still preview in the
Rendering Lab. The normal viewport remains a real-time Three.js WebGL raster
editor. The path-traced preview is started explicitly with `Trace Still` and is
intended for report screenshots and high-quality still comparison.

## Research Basis

- `three-gpu-pathtracer` is the selected integration because it is MIT licensed,
  built for Three.js, and provides a `WebGLPathTracer` that can consume an
  existing `THREE.Scene` and `THREE.Camera`.
- The project uses `three-gpu-pathtracer@0.0.24`, which declares compatibility
  with `three >=0.180.0`, matching the current `three@0.184.0` stack.
- The package is built on `three-mesh-bvh`, so it uses proven BVH acceleration
  instead of a project-owned ray/path tracer.
- `xatlas-web` is installed as a peer dependency required by the package.

Primary reference:

- https://github.com/gkjohnson/three-gpu-pathtracer

## User Workflow

1. Set up the scene in the normal raster viewport.
2. Choose a sample count in Rendering Lab: 16, 32, 64, or 128.
3. Click `Trace Still`.
4. The editor pauses playback, disables orbit controls, hides helper overlays,
   and progressively renders samples to the viewport canvas.
5. When the sample target is reached, click `Screenshot` to export the traced
   canvas, or click `Back to Raster` to resume editing.

## Architecture

The feature is intentionally isolated in
`Source/src/renderer/pathTracePreview.ts`.

Responsibilities:

- Lazy-load `three-gpu-pathtracer` only when the user starts a traced preview.
- Configure conservative path-tracing defaults: six bounces, four transmissive
  bounces, tiled rendering, 1024 texture packing, and reduced render scale.
- Hide editor-only overlays during tracing: grid, axes, motion path, frustum
  helper, and transform gizmo.
- Keep hidden-object state reversible so returning to raster restores the editor
  view.
- Report progress as sample count so the UI can stay responsive.

`main.ts` only owns interaction coordination:

- Start/cancel button.
- Sample-count select.
- Playback pause.
- Orbit-control disabling while the still preview is active.
- Screenshot export preserving the traced canvas instead of overwriting it with
  the raster composer.

## Limitations

- This is a still preview, not realtime path-traced editing.
- It requires WebGL2 on a hardware renderer. The control is disabled in
  automated browser tests and software WebGL renderers such as SwiftShader to
  avoid very slow or unstable path-tracer initialization.
- Helpers, wire overlays, and transform gizmos are hidden during tracing because
  the preview should show scene geometry and lighting.
- The path tracer works best with `MeshStandardMaterial` /
  `MeshPhysicalMaterial`. Imported or custom materials that fall outside that
  model may not visually match the raster viewport exactly.
- The default viewport remains rasterized because it supports immediate editing,
  post-processing, transform controls, and timeline playback.

## Testing

Automated coverage verifies that the Rendering Lab exposes the path-tracing
controls and that the production build compiles with the new optional
dependency.

Manual validation:

- Start `Release` from a static server.
- Click `Trace Still`.
- Confirm the status reaches the selected sample count.
- Export a screenshot while the traced preview is still active.
- Click `Back to Raster` and confirm grid, axes, motion path, camera controls,
  and the transform gizmo return.
