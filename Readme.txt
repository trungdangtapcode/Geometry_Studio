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
- Perspective projection: editable camera position, FOV, Near, and Far values with Front, Top, Iso, Reset, Frame Selected, and Frame All viewport controls.
- Affine transformations: Move, Rotate, and Scale with TransformControls, numeric X/Y/Z inputs, and World/Local space modes.
- Lighting: Ambient, Directional, Point, and Spot lights with color, intensity, position, helper, and shadow controls.
- Rendering Lab: Tone mapping, exposure, shadow quality, PBR/Anime Toon material presets, generated environment lighting, SSAO, Bloom, Vignette, Comic Halftone, optional path-traced still preview, and renderer telemetry controls.
- Asset Store: one-click built-in looks, procedural textures, materials, Teapot/Torus Knot geometry, and the Sample Drone model for polished screenshots without runtime network assets.
- Textures: Checker, UV, Grid, Bricks, Wood, Carbon Fiber, Blueprint, and Comic Dots presets, bitmap image upload, and repeat controls.
- Model loading: GLB, GLTF, OBJ, OBJ+MTL, and STL import with centering, normalization, source-material preservation, shadows, outliner integration, and transform support.
- Animation: Spin, Orbit, Bounce, Pulse, and Light Sweep presets bake visible timeline keyframes, then Play/Stop runs the authored timeline.
- Keyframe Timeline: resizable bottom timeline dock and label column for object, camera, light, material, visibility, and texture tracks with AE-style selectable and renamable object/camera/light layer groups, object group pose-key buttons, transform pose copy/paste, disclosure collapse/expand, Alt-click bulk collapse/expand, X/Y/Z transform rows, inspector Position/Rotation/Scale key diamonds, Auto-Key initial-pose seeding, Auto-Key Pose Keys for grouped Position/Rotation/Scale transform edits, Focus/Selected Layer/Selected Keyed/Keyed/Pinned/All row filtering with pinned-row count, selected-key range/span readout, Escape deselect for selected keyframes, bulk visible-row pinning and clearing, pinned-row keying sets, Ctrl+F row search, Shift+U selected-layer keyed-row reveal, Alt+P/R/S/C/T/M/U property reveal shortcuts, named timeline markers, minimizable overview/layer range strip, clickable track rows, per-row pin/eye/solo/lock/diamond switches, Set Pose grouped Position/Rotation/Scale keying from the timeline or Transform inspector, Time/Duration/Work fields that accept seconds, frames, timecode, and relative offsets, Timecode/Frames/Seconds display modes, layer In/Out bars with move, trim, split, sequencing, and Alt-drag key time-stretch, per-keyframe Linear/Ease In/Ease Out/Easy Ease/Back In/Back Out/Hold controls with curve preview, active-track value graph preview with draggable value key points, cursor-anchored wheel zoom, horizontal wheel/trackpad panning, playhead scrubbing, visible-row before/after playhead tail selection, set/update/delete/copy/paste/nudge/center/rove/distribute/fit/cycle keyframes, numeric single-key time/value editing, relative key value offsets, numeric multi-key anchor-time retiming, end-time stretching, and span stretching with seconds/frame/timecode/relative input, full-turn Euler rotation playback, active-track enable/disable, solo, and lock/unlock, dragging, snap, loop, duration, FPS, Undo/Redo, selected-object motion path preview with key time labels and pose ghosts, selected-object onion-skin before/after pose ghosts, active Camera Position path preview with frustum ghosts, and JSON save/load.
- Motion Presets: Command Palette can bake Turntable, Float Loop, Pop Intro, and Product Reveal into editable Position/Rotation/Scale/Opacity timeline keys, and Auto-Orient Along Path can generate Rotation keys from Position path direction.
- Display helpers: Blender-style UI Density, Grid, Axes, FPS, selected-object outline, object and camera motion paths, onion-skin pose ghosts, progress UI, and toast messages.
- Scene persistence: Save JSON and Load JSON for objects, camera, lights, rendering settings, display settings, materials, baked preset motion, and keyframe timelines.
- Undo/Redo: restore changes after adding, deleting, editing, transforming, or changing render modes.
- Duplicate/Rename: duplicate or rename the selected object from the Outliner.
- Drag and Drop: drop model files or texture images directly on the viewport.
- Evaluation Tour: automatically builds a scene that demonstrates all grading requirements.
- Showcase Demo: builds a reference-style grid, wire/glass sphere, contact-shadow, and editable timeline presentation scene.
- Cinematic Demo: creates a polished animated showcase scene.
- Screenshot Export: saves the current viewport as a PNG image.
- Path-Traced Still Preview: Rendering Lab can progressively render a high-quality hardware WebGL2 path-traced still with three-gpu-pathtracer, then Screenshot exports the traced canvas before returning to raster editing.
- WebM Preview Export: records the active Work In/Out range with progress shown in the status line and record button.
- Telemetry: displays FPS, draw calls, triangles, lines, points, geometry count, texture count, and object count.
- UI Density And Scale: choose Blender, Compact, or Comfortable sizing from the inspector header, then scale the whole editor to 75%, 85%, 100%, 110%, or 125%. Blender density plus 75% scale matches the compact Chrome zoom look while persisting inside the app.
- In-App Quick Help: use the Help button, `?`, category filters, or command palette search to open searchable controls, shortcuts, timeline, viewport, and rendering guides.
- Command Palette Pins: star important commands so they stay above recents.
- Command Palette Recents: recently used commands are promoted when the palette opens, making repeated editing workflows faster.

7. Keyboard Shortcuts
For a cleaner tutorial and full button map, open:
Geometry_Studio/docs/user-cheatsheet.md
Geometry_Studio/docs/beginner-tutorial.md

- T: Move / Translate.
- R: Rotate.
- S: Scale.
- ?: open Quick Help.
- Ctrl+K / F3: open command palette; pinned and recent commands appear first when search is empty.
- Shift+Enter in command palette: pin or unpin the active command.
- Space: Play or stop animation.
- Shift+Space: preview the currently selected keyframe range.
- J / K / L: play backward, stop, or play forward inside the work area. Press J or L repeatedly for 2x and 4x shuttle speed.
- Left / Right: step the timeline one frame.
- Shift+Left / Shift+Right: jump to the previous or next keyframe on the selected track.
- Shift+Home / Shift+End: jump to the first or last selected timeline keyframe.
- Ctrl+Alt+Shift+Left / Ctrl+Alt+Shift+Right: jump to the previous or next pinned-row keyframe.
- Command Palette: search Fit Pinned Row Keyframes, Set Work Area To Pinned Row Keyframes, or Preview Pinned Row Keyframe Range for focused pinned-row playback.
- Command Palette: search Select Visible Row Keys Before/After Playhead for timeline tail edits.
- Command Palette: search motion preset to apply editable Turntable, Float Loop, Pop Intro, or Product Reveal animation.
- Alt+Left / Alt+Right: nudge selected or playhead keyframes by one frame.
- Shift+Enter: move selected keyframes so the first selected key lands at the playhead.
- Shift+C: center selected keyframe timing around the playhead.
- Shift+V: rove selected interior keyframes between fixed selected endpoints.
- Shift+R: time-reverse selected keyframes.
- Shift+S: snap selected keyframes to frame boundaries.
- Shift+D: distribute selected keyframes evenly across Work In/Out.
- Shift+F: fit selected keyframe timing proportionally into Work In/Out.
- Shift+Y: cycle selected keyframe blocks forward until Work Out.
- F9: apply Easy Ease interpolation to selected or playhead keyframes.
- Shift+F9: apply Linear interpolation.
- Ctrl+F9: apply Ease In interpolation.
- Ctrl+Shift+F9: apply Ease Out interpolation.
- Alt+F9: apply Hold interpolation.
- Command Palette: search Back In, Back Out, or overshoot for motion-design interpolation.
- Home / End: jump to Work In or Work Out.
- B / N: set Work In or Work Out to the current playhead time.
- I / O: set Work In or Work Out to the current playhead time.
- Shift+B: fit Work In/Out to the selected timeline keyframes.
- Ctrl+Shift+A: select active-track keyframes inside Work In/Out.
- Shift+U: show keyed rows for the selected layer/object.
- U: cycle timeline row visibility through Focus, Selected Layer, Selected Keyed, Keyed, Pinned, and All Rows.
- Command Palette: search Show Focus/Selected Layer/Selected Keyed/Keyed/Pinned/All Timeline Rows to jump directly to a row filter.
- Shift+P: pin or unpin the active timeline row.
- Command Palette: search Pin Selected Transform Rows to pin Position, Rotation, and Scale for the selected object.
- Toolbar pin button: pin every currently visible timeline row.
- Toolbar pin-off button: clear all pinned timeline rows.
- Set Pinned: key every pinned row at the playhead.
- Select Pinned: select keyframes on pinned rows for retiming, easing, copy, or delete operations.
- Command Palette: search Select/Copy/Cut/Duplicate/Delete Pinned Row Keys At Playhead for pinned pose-column editing.
- Plus / Minus / 0: zoom the timeline in, zoom out, or fit the duration.
- Alt+Mouse Wheel or Ctrl/Cmd+Mouse Wheel over the timeline: zoom around the cursor.
- Shift+Mouse Wheel or horizontal trackpad wheel over the timeline: pan horizontally.
- M: add or update a timeline marker at the current playhead time.
- Shift+M / Alt+M: jump to the next or previous timeline marker.
- Shift+Alt+M: delete the timeline marker at the current playhead time.
- Ctrl+A: select all keyframes on the active timeline track when focus is outside form fields.
- Ctrl+C / Ctrl+X / Ctrl+V: copy, cut, or paste timeline keyframes when focus is outside form fields.
- Ctrl+D: duplicate selected timeline keyframes when focus is outside form fields.
- Delete or Backspace: delete selected timeline keyframes first; otherwise delete the selected object.
- Ctrl+Z: Undo.
- Ctrl+Y or Ctrl+Shift+Z: Redo.
- Ctrl+S: export the scene JSON.
- F2 on an object timeline group row: rename that object from the timeline.
- Left click an object: select it.
- Viewport navigation: left mouse drag orbits for normal web/trackpad use; middle mouse drag orbits like Blender with unrestricted vertical orbit; Shift + middle mouse pans; Ctrl + middle mouse or mouse wheel zooms toward the cursor; right drag also pans; left click without dragging selects objects; F / Numpad . frames the selected object.

8. Quick Grading Checklist
- Run Release with python3 -m http.server.
- Confirm the 3D canvas shows the default cube, torus, and sphere.
- Open Help, search for Set Pose, then open it again with ?.
- Add Cube, Sphere, Cone, Cylinder, Torus, and Teapot objects.
- Switch objects between Solid, Points, and Lines.
- Adjust FOV, Near, Far, camera presets, Frame Selected, and Frame All.
- Use Move, Rotate, and Scale with the gizmo or T/R/S shortcuts.
- Toggle shadows and edit light color, intensity, and position.
- Upload a bitmap texture and adjust Repeat X/Y.
- Import a .glb, .gltf, .obj, or .stl model.
- Add Position / Rotation / Scale keyframes in the bottom timeline using the main Set Pose / Update Pose button for grouped Position+Rotation+Scale object poses, Set Pose Key in the Transform inspector, an object group pose-key button, transform pose copy/paste with Auto-Key, or row diamond key buttons for single-row transform keying; use Set Key / Update Key for non-transform active properties, copy/paste a keyframe, press Escape to deselect selected keyframes, move selected keys to the playhead, center selected timing on the playhead, rove interior selected keys between fixed endpoints, reverse selected key timing, snap selected keys to frames, distribute selected keyframes across Work In/Out, fit selected key timing to Work In/Out, cycle selected key blocks to Work Out, scrub the playhead, and verify motion plays.
- Confirm Position, Rotation, and Scale appear as X/Y/Z rows in the timeline for easier transform inspection.
- Apply Linear, Ease In, Ease Out, Easy Ease, Back In, Back Out, and Hold interpolation from the timeline toolbar dropdown/direct buttons, including the direct Back In/Back Out buttons, and confirm the curve preview updates.
- Toggle Graph in the timeline and confirm a keyed Position / Rotation / Scale track draws value curves while scrubbing. Ctrl/Cmd-click graph keys to toggle selection, Shift-click to select a key range, drag a graph marquee to select multiple keys, drag one selected key to move selected keys together, Alt-drag one selected key to stretch selected-key timing, drag horizontally and vertically to retime or edit channel values, hold Shift while dragging to constrain direction, then Undo to restore it.
- Use Alt+Mouse Wheel over the timeline to zoom around the cursor, then Shift+Mouse Wheel or horizontal trackpad wheel to pan across dense keys.
- Drag the vertical handle between timeline labels and the dope sheet to resize the layer/property label column, reload, and confirm the width persists.
- Add two Position keys for the selected object and confirm the viewport draws a motion path between them.
- Nudge a keyframe left or right by one frame from the toolbar.
- Click timeline row labels to switch active object, camera, and light tracks.
- Select and rename objects from timeline layer group rows, collapse and expand groups from their disclosure controls, Alt-click a disclosure control to collapse or expand all groups, then use row search to reveal a hidden property row.
- Minimize the timeline overview/layer range strip and confirm only that section collapses; the keyframe rows and playhead remain usable.
- Alt-drag a layer range edge and confirm in-range object keyframes stretch proportionally into the new layer duration.
- Run Showcase Demo and confirm the wire/glass sphere, grid floor, contact shadow, and editable motion keys are visible.
- Run Cinematic Demo and Play/Stop the baked keyframe animation.
- Run Evaluation Tour to show every assignment requirement in one guided scene.
- Save JSON, then Load JSON to verify scene persistence.
- Use Undo/Redo after adding, deleting, or changing an object render mode.

9. Source Architecture
- editor/: shared types, scene document JSON, and command history.
- scene/: geometry primitives, material/render-mode handling, lights, stage setup, importers, and motion path helpers.
- renderer/: WebGLRenderer, EffectComposer, OutlinePass, and capped responsive resizing.
- animation/: timeline schema, keyframe editing helpers, shared interpolation evaluator, and keyframe playback runtime.
- ui/: editor DOM template, keyframe timeline panel adapter, and value graph editor.
- viewport/: OrbitControls navigation setup and camera framing helpers.
- utils/: DOM helpers and ResourceTracker for disposing geometries, materials, textures, and object URLs.

10. Engineering Docs
Technical engineering and user docs are in:
Geometry_Studio/docs/README.md

The lowercase docs/ folder contains the user cheatsheet, beginner tutorial, design notes for advanced features, the keyframe timeline architecture, and the longer-term expansion plan. The Doc/ folder remains the formal LaTeX report folder.

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
