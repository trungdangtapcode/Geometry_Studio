GEOMETRY STUDIO - SETUP AND USER GUIDE

1. Overview
Geometry Studio is an interactive 3D computer graphics project built with Three.js, TypeScript, and Vite. It lets the user create 3D geometry, switch between Solid / Points / Lines rendering, control perspective projection, apply affine transformations, edit lights and shadows, map textures, import models, save scenes, and run preset or keyframe animations.

2. Submission Structure
- Source/: TypeScript/Vite source code.
- Release/: static production build with HTML and assets for grading.
- Doc/Report.tex: English LaTeX project report.
- Doc/Report.pdf: PDF report compiled with pdflatex.
- Readme.txt: this setup and user guide.

3. Environment Requirements
- Node.js 20 or newer.
- npm 10 or newer.
- A modern WebGL2 browser: Chrome, Edge, or Firefox.
- Python 3 for serving the static Release build locally.
- pdflatex if the report needs to be rebuilt.

4. Run From Source
Open a terminal in:
Geometry_Studio/Source

Run:
npm install
npm run dev

Then open the Vite URL shown in the terminal, usually:
http://localhost:5173

5. Run The Release Build
Open a terminal in:
Geometry_Studio/Release

Run:
python3 -m http.server 8080

Then open:
http://localhost:8080

Using a local static server is recommended instead of double-clicking index.html because model and texture imports work more reliably through HTTP.

6. Main Features
- Geometry creation: Cube, Sphere, Cone, Cylinder, Wheel/Torus, Teapot, Torus Knot, Parametric Surface, Extruded Star, and additional Platonic solids.
- Rendering modes: Solid, Points, and Lines. The Lines mode uses WireframeGeometry + LineSegments so object edges render correctly.
- Perspective projection: editable camera position, FOV, Near, and Far values with Front, Top, Iso, and Reset presets.
- Affine transformations: Move, Rotate, and Scale with TransformControls, numeric X/Y/Z inputs, and World/Local space modes.
- Lighting: Ambient, Directional, Point, and Spot lights with color, intensity, position, helper, and shadow controls.
- Textures: Checker, UV, and Grid presets, bitmap image upload, and repeat controls.
- Model loading: GLB, GLTF, OBJ, and STL import with centering, normalization, shadows, outliner integration, and transform support.
- Animation: Spin, Orbit, Bounce, Pulse, and Light Sweep presets bake visible timeline keyframes, then Play/Pause runs the authored timeline.
- Keyframe Timeline: resizable bottom timeline dock for object, camera, light, material, visibility, and texture tracks with X/Y/Z transform rows, Focus/Keyed/All row filtering, named timeline markers, clickable track rows, per-row diamond key buttons, Set TRS grouped transform keying, per-keyframe Linear/Easy Ease/Hold controls with curve preview, active-track value graph preview with draggable value key points, playhead scrubbing, set/update/delete/copy/paste/nudge keyframes, numeric keyframe time/value editing, full-turn Euler rotation playback, active-track enable/disable, dragging, snap, loop, duration, FPS, Undo/Redo, selected-object motion path preview, and JSON save/load.
- Display helpers: Blender-style UI Density, Grid, Axes, FPS, selected-object outline, position motion paths, progress UI, and toast messages.
- Scene persistence: Save JSON and Load JSON for objects, camera, lights, display settings, materials, baked preset motion, and keyframe timelines.
- Undo/Redo: restore changes after adding, deleting, editing, transforming, or changing render modes.
- Duplicate/Rename: duplicate or rename the selected object from the Outliner.
- Drag and Drop: drop model files or texture images directly on the viewport.
- Evaluation Tour: automatically builds a scene that demonstrates all grading requirements.
- Cinematic Demo: creates a polished animated showcase scene.
- Screenshot Export: saves the current viewport as a PNG image.
- Telemetry: displays FPS, draw calls, triangles, lines, points, geometry count, texture count, and object count.
- UI Density: choose Blender, Compact, or Comfortable sizing from the inspector header. Blender density is the default for a smaller professional editing layout.

7. Keyboard Shortcuts
- T: Move / Translate.
- R: Rotate.
- S: Scale.
- Space: Play or pause animation.
- Left / Right: step the timeline one frame.
- Shift+Left / Shift+Right: jump to the previous or next keyframe on the selected track.
- Alt+Left / Alt+Right: nudge selected or playhead keyframes by one frame.
- F9: apply Easy Ease interpolation to selected or playhead keyframes.
- Shift+F9: apply Linear interpolation.
- Alt+F9: apply Hold interpolation.
- Home / End: jump to Work In or Work Out.
- B / N: set Work In or Work Out to the current playhead time.
- Shift+B: fit Work In/Out to the selected timeline keyframes.
- U: cycle timeline row visibility through Focus, Keyed, and All Rows.
- Plus / Minus / 0: zoom the timeline in, zoom out, or fit the duration.
- Ctrl+A: select all keyframes on the active timeline track when focus is outside form fields.
- Ctrl+C / Ctrl+X / Ctrl+V: copy, cut, or paste timeline keyframes when focus is outside form fields.
- Delete or Backspace: delete selected timeline keyframes first; otherwise delete the selected object.
- Ctrl+Z: Undo.
- Ctrl+Y or Ctrl+Shift+Z: Redo.
- Ctrl+S: export the scene JSON.
- Left click an object: select it.
- Mouse drag, right drag, and scroll: orbit, pan, and zoom with OrbitControls.

8. Quick Grading Checklist
- Run Release with python3 -m http.server.
- Confirm the 3D canvas shows the default cube, torus, and sphere.
- Add Cube, Sphere, Cone, Cylinder, Torus, and Teapot objects.
- Switch objects between Solid, Points, and Lines.
- Adjust FOV, Near, Far, and camera presets.
- Use Move, Rotate, and Scale with the gizmo or T/R/S shortcuts.
- Toggle shadows and edit light color, intensity, and position.
- Upload a bitmap texture and adjust Repeat X/Y.
- Import a .glb, .gltf, .obj, or .stl model.
- Add Position / Rotation / Scale keyframes in the bottom timeline using Set Key / Update Key, Set TRS for grouped object poses, or a row diamond key button, copy/paste a keyframe, scrub the playhead, and verify motion plays.
- Confirm Position, Rotation, and Scale appear as X/Y/Z rows in the timeline for easier transform inspection.
- Apply Linear, Easy Ease, and Hold interpolation from the timeline toolbar and confirm the curve preview updates.
- Toggle Graph in the timeline and confirm a keyed Position / Rotation / Scale track draws value curves while scrubbing. Ctrl/Cmd-click graph keys to toggle selection, Shift-click to select a key range, drag one selected key to move selected keys together, Alt-drag one selected key to stretch selected-key timing, drag horizontally and vertically to retime or edit channel values, hold Shift while dragging to constrain direction, then Undo to restore it.
- Add two Position keys for the selected object and confirm the viewport draws a motion path between them.
- Nudge a keyframe left or right by one frame from the toolbar.
- Click timeline row labels to switch active object, camera, and light tracks.
- Run Cinematic Demo and Play/Pause the baked keyframe animation.
- Run Evaluation Tour to show every assignment requirement in one guided scene.
- Save JSON, then Load JSON to verify scene persistence.
- Use Undo/Redo after adding, deleting, or changing an object render mode.

9. Source Architecture
- editor/: shared types, scene document JSON, and command history.
- scene/: geometry primitives, material/render-mode handling, lights, stage setup, importers, and motion path helpers.
- renderer/: WebGLRenderer, EffectComposer, OutlinePass, and capped responsive resizing.
- animation/: timeline schema, keyframe editing helpers, shared interpolation evaluator, and keyframe playback runtime.
- ui/: editor DOM template, keyframe timeline panel adapter, and value graph editor.
- utils/: DOM helpers and ResourceTracker for disposing geometries, materials, textures, and object URLs.

10. Engineering Docs
Technical engineering plans are in:
Geometry_Studio/docs/README.md

The lowercase docs/ folder contains design notes for advanced features, including the keyframe timeline architecture and longer-term expansion plan. The Doc/ folder remains the formal LaTeX report folder.

11. Rebuild The Report
Open a terminal in:
Geometry_Studio/Doc

Run:
pdflatex Report.tex
pdflatex Report.tex

Running pdflatex twice refreshes the table of contents and references.

12. Package For Submission
Zip the whole Geometry_Studio folder as:
StudentID.zip

Replace StudentID with your actual student ID before submitting.

You can create the zip file with:
./make_submission.sh StudentID

The script excludes node_modules and test artifacts so the submitted file stays small.
