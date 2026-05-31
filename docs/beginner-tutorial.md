# Geometry Studio Beginner Tutorial

This tutorial is for using the project like a small Blender plus After Effects
studio. It avoids internal implementation details and focuses on what to click.

## 1. Start The App

From the project root:

```bash
cd Source
npm install
npm run dev
```

For the built release:

```bash
cd Release
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`.

## 2. Understand The Screen

- Left rail: add geometry or import models.
- Center viewport: orbit, select, transform, and inspect the 3D scene.
- Right inspector: edit selected object, camera, lighting, materials, rendering.
- Bottom bar: play, command palette, demo, screenshots, WebM export.
- Bottom timeline: record and edit keyframes.

When unsure, press `Ctrl+K` or click `Commands`, then search by action name.
Press `?` or click `Help` for the in-app cheatsheet.

## 3. Navigate Like A 3D Editor

1. Drag with the left mouse or middle mouse to orbit.
2. Hold `Shift` and drag middle mouse to pan.
3. Use the mouse wheel to zoom.
4. Click an object to select it.
5. Press `F` to frame the selected object.
6. Use `Frame All` in the Camera panel if the view gets lost.

## 4. Add And Edit Objects

1. Click a primitive icon on the left rail, for example Cube, Sphere, or Teapot.
2. Select the new object in the outliner or viewport.
3. Use `T`, `R`, or `S` for Move, Rotate, or Scale.
4. Use the right inspector numeric fields for exact values.
5. Switch between `World Space` and `Local Space` when needed.

Use `Duplicate` in the outliner to create a copy. Use `Delete` to remove the
selected object.

## 5. Change Materials And Render Mode

1. Select an object.
2. In Material, choose a preset such as Ceramic, Metal, Plastic, Clay, or Anime
   Toon.
3. Adjust color, opacity, roughness, and metalness.
4. In Geometry / Render Mode, switch between Solid, Lines, and Points.
5. In Textures, choose Checker, UV, Grid, or upload an image.

For hard-to-read models, use Clay or Anime Toon, turn on shadows, and try SSAO
in Rendering Lab.

## 6. Import A Model

1. Click the Import button on the left rail, or drag files onto the viewport.
2. For GLB or GLTF, select the model file.
3. For OBJ with materials, select the `.obj`, `.mtl`, and texture images
   together.
4. The model is centered, scaled, added to the outliner, and can be transformed
   like any primitive.

GLB is the easiest format because geometry, materials, and textures can be
packaged in one file.

## 7. Make A Simple Object Animation

This records Position, Rotation, and Scale together.

1. Select an object.
2. Set timeline `Time` to `0`.
3. Move the object to the starting pose.
4. Click `Set TRS`.
5. Set timeline `Time` to `2`.
6. Move, rotate, or scale the object to the ending pose.
7. Click `Set TRS` again.
8. Drag the playhead between `0` and `2`, or press `Play`.

If the object does not move, check that:

- The same object is selected.
- The timeline row filter is not hiding the keyed rows.
- Track On is enabled.
- The track is not locked.
- The playhead is between the two keyframes.

## 8. Animate Only Rotation

1. Select the object.
2. Set `Time` to `0`.
3. Rotate the object to the first angle.
4. Choose `Rotation` in the timeline track dropdown.
5. Click `Set Key`, or click the diamond on the Rotation row.
6. Set `Time` to `2`.
7. Rotate the object to the second angle.
8. Click `Set Key` again.
9. Scrub or play.

The same pattern works for Position, Scale, Color, Opacity, Roughness,
Metalness, Texture controls, Camera, and Lights.

## 9. Use Auto-Key

Auto-Key is useful after the first pose exists.

1. Set the first key manually with `Set TRS` or `Set Key`.
2. Enable `Auto-Key`.
3. Move the playhead to another time.
4. Change the object, camera, light, or material value.
5. The app records the changed value automatically.

Use Auto-Key carefully. It is faster, but it can create many keys if you forget
it is enabled.

## 10. Edit Keyframes

1. Click a keyframe diamond in the timeline.
2. Drag it left or right to retime it.
3. Use `Delete` to remove it.
4. Use `Copy`, `Paste`, and `Duplicate` for repetition.
5. Use `Linear`, `Ease In`, `Ease Out`, `Ease`, or `Hold` to change motion
   interpolation.
6. Enable `Graph` to inspect the selected value curve.

Useful retiming tools:

- `To Playhead`: move selected keys so the block starts at the playhead.
- `Center`: center selected key timing around the playhead.
- `Reverse`: reverse selected key timing.
- `Distribute`: evenly space keys across Work In/Out.
- `Fit Keys`: stretch selected key timing into Work In/Out.

## 11. Animate The Camera

1. Use viewport navigation to set the first camera view.
2. Choose `Camera Position` in the timeline dropdown.
3. Click `Set Key`.
4. Choose `Camera Target`.
5. Click `Set Key`.
6. Move the playhead to the next time.
7. Navigate to the second camera view.
8. Key `Camera Position` and `Camera Target` again.
9. Press `Play`.

Use `Camera Lens` when you also want FOV, Near, or Far to change over time.

## 12. Animate Lights

1. Select Sun, Point, or Spot in the Lighting section.
2. Set the first color, intensity, or position.
3. Select the matching timeline track, for example `Point Intensity`.
4. Click `Set Key`.
5. Move the playhead.
6. Change the light value.
7. Click `Set Key` again.

This is useful for showing shadows, highlights, and evaluation tour effects.

## 13. Use The Work Area

Work In and Work Out define the important preview/export range.

1. Move the playhead to the start.
2. Press `B` or `I`.
3. Move the playhead to the end.
4. Press `N` or `O`.
5. Press `Play`.
6. Enable `Loop` to repeat that range.

`Record WebM` records the active Work In/Out range.

## 14. Prepare Report Evidence

Recommended report sequence:

1. Run `Evaluation Tour`.
2. Take a screenshot showing primitives, grid, shadows, and timeline callouts.
3. Show Solid, Lines, and Points render modes.
4. Show transform keyframes in Position / Rotation / Scale rows.
5. Show camera FOV/Near/Far or frustum helper.
6. Show material/texture mapping.
7. Show imported OBJ/GLB model.
8. Show Rendering Lab effects or path-traced still preview.
9. Export a viewport screenshot.

## 15. Save And Load

1. Click `Save JSON` in Document.
2. Reload the page if desired.
3. Click `Load JSON`.
4. Choose the saved file.
5. Confirm objects, materials, camera, lights, and timeline keys return.

Use scene JSON for project persistence. Use screenshot/WebM for report media.
