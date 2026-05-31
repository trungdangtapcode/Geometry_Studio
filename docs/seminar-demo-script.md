# Seminar Demo Script

Use this script for a school seminar or final project presentation. It is
designed to show the project as a complete interactive 3D geometry and animation
studio, not just a list of isolated features.

## Recommended Demo Length

| Version | Use When | Duration |
| --- | --- | --- |
| Fast demo | Strict time limit | 6-8 minutes |
| Full demo | Normal seminar slot | 12-15 minutes |
| Backup demo | Live import/network fails | 5 minutes |

## Pre-Demo Setup

Do this before presenting:

1. Start the release server.

```bash
cd Release
python3 -m http.server 8080
```

2. Open `http://127.0.0.1:8080`.
3. Set browser zoom to `100%`.
4. In the app header, set UI `Density` to `Blender`.
5. Set UI `Scale` to `75%` or `85%` if the projector resolution is low.
6. Open Commands with `Ctrl+K`, search `showcase`, and confirm commands work.
7. Keep these backup buttons ready:
   - `Showcase`
   - `Evaluation Tour`
   - `Cinematic Demo`
   - Asset Browser `Campus > Load Campus`
   - `Clean View` or `Alt+G`

## Opening Statement

Say:

> This project is Geometry Studio, a browser-based 3D scene editor built with
> Three.js and TypeScript. It combines computer graphics fundamentals with a
> production-style interface: primitives, projection, affine transforms,
> materials, texture mapping, lighting, model import, rendering effects, and an
> After Effects style keyframe timeline.

Then:

1. Point to the left rail.
2. Point to the viewport.
3. Point to the right inspector.
4. Point to the bottom timeline.

Say:

> The design goal is that every required graphics feature is visible and
> editable from the interface, while the timeline makes the scene demonstrable
> instead of static.

## Fast Demo Flow

Use this if you only have a few minutes.

| Time | Action | What To Say |
| --- | --- | --- |
| 0:00 | Click `Showcase` | "This builds a prepared scene with primitives, texture, shadows, and timeline-ready objects." |
| 0:45 | Press `Alt+G` | "Clean View hides grid, axes, transform gizmo, helpers, and blur effects for presentation screenshots. Press it again to restore the editor guides." |
| 1:15 | Select object, press `T`, `R`, `S` | "Affine transforms are editable by gizmo and numeric inspector fields." |
| 2:00 | Switch Solid / Lines / Points | "The renderer supports mesh, true wireframe line geometry, and point rendering." |
| 2:45 | Apply Anime Toon or Metal | "Materials demonstrate classic and PBR-style shading, plus stylized toon output." |
| 3:30 | Open Rendering Lab | "Post-processing includes SSAO, Bloom, FXAA, DOF, Halftone, and optional path-traced still preview." |
| 4:30 | Click `Set Pose`, move time, transform, click `Set Pose` | "The timeline records Position, Rotation, and Scale as keyframes." |
| 5:30 | Press `Play` | "Playback evaluates editable timeline tracks, not hidden procedural animation only." |
| 6:15 | Asset Browser `Campus > Load Campus` | "The app can load a complete local campus landscape asset." |
| 7:15 | `Save JSON`, `Screenshot` | "Scenes can be saved, restored, and exported for reports." |

## Full Demo Flow

### 1. Interface And Navigation

Action:

1. Start on the default scene.
2. Orbit with left drag or middle mouse.
3. Pan with `Shift` + middle mouse or right drag.
4. Zoom with the wheel.
5. Select an object and press `F`.

Say:

> Navigation follows familiar 3D editor behavior. I can orbit, pan, zoom, select
> objects, and frame the selected model. This makes it usable as an actual scene
> editor, not only a fixed demo.

### 2. Primitive Construction

Action:

1. Add Cube, Sphere, Cone, Cylinder, Torus, Teapot, Torus Knot.
2. Select objects from the Outliner.

Say:

> The left rail creates multiple primitive types, including standard course
> geometry and richer shapes for visual demonstration. Each object becomes a
> scene entry with transform, material, render mode, and animation data.

### 3. Affine Transform Controls

Action:

1. Select a cube.
2. Press `T`, move it.
3. Press `R`, rotate it.
4. Press `S`, scale it.
5. Edit numeric Position / Rotation / Scale fields.
6. Toggle World / Local space.

Say:

> This demonstrates affine transforms: translation, rotation, and scale. The
> same values are exposed numerically, so the transformation is not just a mouse
> interaction; it is visible as editable data.

### 4. Projection And Camera

Action:

1. Open the Camera section.
2. Change FOV.
3. Change Near / Far.
4. Enable Camera frustum helper.
5. Use Front, Top, Iso, Reset, Frame Selected, Frame All.

Say:

> The camera section exposes perspective projection controls: field of view,
> near plane, far plane, and view presets. The frustum helper makes the
> projection volume visible.

### 5. Render Modes

Action:

1. Select an object.
2. Switch `Solid`.
3. Switch `Lines`.
4. Switch `Points`.

Say:

> The same geometry can be displayed as a solid mesh, as true wireframe line
> segments, or as points. This is useful for explaining how surfaces are built
> from vertices and edges.

### 6. Materials And Texture Mapping

Action:

1. Apply Ceramic, Metal, Glass, Clay, Anime Toon.
2. Change color.
3. Apply Checker or UV texture.
4. Change texture repeat and rotation.
5. Upload a bitmap texture if desired.

Say:

> The material panel demonstrates both classic material behavior and PBR-style
> properties such as roughness and metalness. The texture section demonstrates
> UV mapping, repeat, offset, and rotation.

### 7. Lighting And Shadows

Action:

1. Open Lighting.
2. Switch Sun, Point, Spot.
3. Adjust intensity and position.
4. Toggle shadows and helpers.
5. Apply Product or Dramatic preset.

Say:

> Lighting is editable at runtime. The scene uses shadow-casting lights and a
> ground receiver, so object placement and shape are easier to read.

### 8. Rendering Lab

Action:

1. Open Rendering Lab.
2. Toggle SSAO.
3. Toggle Bloom.
4. Toggle FXAA.
5. Toggle Comic Halftone.
6. Mention Path Traced Still Preview.

Say:

> This is still real-time WebGL rendering, but the post-processing pipeline
> adds presentation-quality options. SSAO improves contact shadows, FXAA reduces
> jagged edges, Bloom adds highlights, and Halftone gives a comic-style effect.
> The optional path-traced still preview is for higher-quality screenshots.

### 9. Model Import And Asset Browser

Action:

1. Open Asset Browser.
2. Show Online Models.
3. Show Campus tab.
4. Click `Load Campus`.
5. Wait until progress says ready.
6. Press `Alt+G` if the grid/axes are distracting.

Say:

> The app supports imported GLB, GLTF, OBJ, OBJ plus MTL, and STL files. For the
> seminar, I also included a complete local campus landscape, so the project can
> show a larger composed scene instead of only disconnected assets.

If the campus scene takes time:

> This model is larger than the primitive demo because it is a complete campus
> asset. The progress UI shows that the app is loading instead of freezing.

### 10. Timeline Keyframing

Action:

1. Return to a simple object if campus is heavy.
2. Select an object.
3. Set `Time` to `0`.
4. Move/rotate/scale the object.
5. Click `Set Pose`.
6. Set `Time` to `2`.
7. Move/rotate/scale again.
8. Click `Set Pose`.
9. Press `Alt+P`, `Alt+R`, `Alt+S` to show transform rows.
10. Press `Play`.

Say:

> The keyframe timeline is the main advanced feature. A pose key records
> Position, Rotation, and Scale together. The timeline then interpolates the
> motion between poses, similar to After Effects.

### 11. Timeline Editing

Action:

1. Select keyframes.
2. Apply `Ease` or press `F9`.
3. Drag a keyframe.
4. Use `Fit Keys` or `Reverse`.
5. Open Graph.

Say:

> The animation is editable after creation. I can retime keys, change
> interpolation, inspect the value graph, and use motion design tools like fit,
> reverse, distribute, and cycle.

### 12. Camera Or Light Animation

Action:

1. Choose `Camera Position`.
2. Set a key.
3. Move the camera.
4. Set another key.
5. Press `Play`.

Say:

> The timeline is not limited to objects. It also supports camera, light,
> material, visibility, and texture tracks, so the scene can be directed like a
> small animation project.

### 13. Persistence And Export

Action:

1. Click `Save JSON`.
2. Mention `Load JSON`.
3. Click `Screenshot`.
4. Mention `Record WebM`.

Say:

> The project is persistent. Scene JSON stores objects, materials, camera,
> lighting, rendering settings, display settings, and timeline keyframes.
> Screenshots and WebM export are used for report evidence.

### 14. Closing

Say:

> In summary, the project demonstrates core computer graphics topics through an
> interactive editor: geometry, projection, transforms, shading, textures,
> lighting, model loading, animation, and rendering effects. The final result is
> not just a static scene; it is a reusable studio for building and presenting
> 3D graphics scenes.

## Backup Demo If Something Fails

If model loading or network import is slow:

1. Click `Showcase`.
2. Press `Alt+G`.
3. Show render modes.
4. Apply Anime Toon.
5. Use `Set Pose` at `0` and `2`.
6. Press `Play`.
7. Click `Screenshot`.

Say:

> I will use the built-in showcase scene for stability. It exercises the same
> rendering, material, transform, and timeline systems without depending on a
> large external model during the live presentation.

If the camera gets lost:

1. Select an object in the Outliner.
2. Press `F`.
3. Or click `Camera > Frame All`.

If the screen looks cluttered:

1. Press `Alt+G`.
2. Or use `Scene Controls > Display > Grid` and `Axes`.

If playback keeps running:

1. Press `K`.
2. Or press `Space`.

## One-Slide Feature Checklist

Use this as the final slide or spoken recap:

- Primitive geometry: cube, sphere, cone, cylinder, torus, teapot, advanced shapes.
- Projection: perspective camera, FOV, near/far, frustum helper.
- Affine transforms: move, rotate, scale, world/local, numeric inspector.
- Render modes: solid, lines, points.
- Materials: color, opacity, roughness, metalness, toon/PBR presets.
- Textures: built-in maps, upload, repeat, offset, rotation.
- Lighting: ambient, sun, point, spot, helpers, shadows.
- Import: GLB, GLTF, OBJ, OBJ+MTL, STL, campus scene.
- Animation: keyframe timeline, Set Pose, interpolation, graph, work area.
- Rendering: SSAO, Bloom, FXAA, DOF, Halftone, optional path-traced still.
- Persistence: Save JSON, Load JSON.
- Export: Screenshot and WebM.

## Suggested Live Order For Maximum Grade

1. `Showcase` first for immediate visual quality.
2. `Clean View` / `Alt+G` to remove grid, axes, and transform gizmo when presenting.
3. Add one primitive live to prove interactivity.
4. Transform it with `T`, `R`, `S`.
5. Switch Solid / Lines / Points.
6. Apply material and texture.
7. Show camera FOV/Near/Far.
8. Show lighting/shadow controls.
9. Create two transform pose keys live.
10. Press `Play`.
11. Load Campus scene.
12. Save JSON and export screenshot.
