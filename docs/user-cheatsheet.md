# Geometry Studio User Cheatsheet

This is the practical map of the app: which buttons matter, which shortcuts are
worth remembering, and which workflow to use when the interface feels dense.

## First Rule

Use the command palette when you cannot remember a button.

- Button: `Commands` in the bottom viewport bar.
- Shortcut: `Ctrl+K` or `F3`.
- Search examples: `frame`, `set trs`, `ease`, `render`, `timeline`, `camera`,
  `clear track`, `preview`, `record`.
- Star a command to pin it above recents. `Shift+Enter` toggles the active
  command pin from the keyboard.
- Recently used commands are promoted to the top when the search box is empty.

Use in-app Quick Help when you need a compact control map without leaving the
editor.

- Button: `Help` in the bottom viewport bar.
- Shortcut: `?`.
- Command palette: search `Quick Help`.

## Viewport And Camera

| Action | Button / Control | Shortcut / Mouse |
| --- | --- | --- |
| Open quick help | Bottom `Help` button | `?` |
| Orbit camera | Drag in viewport | Left drag or middle mouse drag |
| Pan camera | Viewport | `Shift` + middle mouse drag or right drag |
| Zoom camera | Viewport | Mouse wheel or `Ctrl` + middle mouse drag |
| Select object | Viewport / Outliner | Left click without dragging |
| Frame selected | Camera panel `Frame Sel` | `F` or `Numpad .` |
| Frame scene | Camera panel `Frame All` | Command palette: `Frame All` |
| Preset views | Camera panel `Front`, `Top`, `Iso`, `Reset` | Command palette search `view` |
| Edit projection | Camera panel numeric fields | FOV, Near, Far inputs |
| Show camera frustum | Camera panel checkbox | `Camera frustum helper` |

If the camera feels lost, select an object and press `F`. If the whole scene is
lost, use `Frame All`.

## Left Tool Rail

The left icon rail creates geometry or imports assets.

| Icon / Title | Meaning |
| --- | --- |
| Cube | Add cube |
| Sphere | Add sphere |
| Cone | Add cone |
| Cylinder | Add cylinder |
| Wheel / Torus | Add torus |
| Teapot | Add teapot primitive |
| Torus Knot | Add torus knot |
| Tube Curve | Add curved tube |
| Tetrahedron, Octahedron, Dodecahedron, Icosahedron | Add platonic solids |
| Parametric Surface | Add generated surface |
| Extruded Shape | Add extruded custom shape |
| Built-in sample model | Add the robot/drone sample model |
| Import | Import `.glb`, `.gltf`, `.obj`, `.mtl`, `.stl`, and texture files |

Drag-and-drop model or texture files onto the viewport also works.

## Inspector Sections

| Section | Use It For |
| --- | --- |
| Document | Undo, redo, save/load scene JSON |
| Outliner | Select, rename, duplicate, or delete objects |
| Transform | Move, rotate, scale, world/local space, reset transform |
| Geometry / Render Mode | Change primitive type or switch Solid, Lines, Points |
| Material | Color, material mode, PBR presets, opacity, roughness, metalness |
| Textures | Built-in texture presets, uploaded bitmap texture, repeat/offset/rotation |
| Camera | Projection controls, view presets, frame selected/all, frustum helper |
| Lighting | Sun, point, spot, ambient, shadows, helpers, lighting presets |
| Display | Grid, axes, FPS/telemetry, motion paths, UI density |
| Rendering Lab | Tone mapping, exposure, shadow quality, SSAO, bloom, vignette, FXAA, depth of field, path-traced preview |

Use `Blender` UI density when the inspector feels too large.

## Transform Tools

| Action | Button / Control | Shortcut |
| --- | --- | --- |
| Move object | Transform `Move` | `T` |
| Rotate object | Transform `Rotate` | `R` |
| Scale object | Transform `Scale` | `S` |
| World/local axes | `World Space` toggle | Command palette search `space` |
| Reset transform | Transform `Reset` | Command palette search `reset transform` |
| Copy pose | Timeline / command palette | `Alt+C` in keyframe context is property reveal; use command palette for pose |
| Paste pose | Timeline / command palette | Command palette search `paste pose` |

For animation authoring, prefer `Set TRS` when you want Position, Rotation, and
Scale recorded together.

## Timeline Basics

| Control | Meaning |
| --- | --- |
| Time | Current playhead time in seconds |
| Duration | Full timeline length |
| Work In / Work Out | Preview/export range |
| FPS | Frame grid for stepping and snapping |
| Speed | Playback rate |
| Snap | Snap keyframes/playhead to frame or marker landmarks |
| Loop | Repeat Work In/Out during playback |
| Auto-Key | Automatically records changed values when time is not at the first pose |
| Track dropdown | Chooses which property the main `Set Key` button records |
| Row filter | `Focus`, `Keyed`, `Pinned`, or `All` timeline rows; command palette can jump directly to any mode |
| Search rows | Filter dense object/camera/light/material rows |
| Pin visible rows | Pins every row currently visible after search/filtering |
| Clear pinned rows | Removes every pinned-row preference |

## Timeline Buttons

| Button | Use It For |
| --- | --- |
| Play | Play/pause timeline |
| Start / Out | Jump to Work In / Work Out |
| Previous/Next frame | Step one frame |
| Previous/Next key | Jump between keys on the active track |
| Previous/Next visible-row key | Jump between keys in visible rows |
| Set Key | Add or update one key on the selected track dropdown |
| Set TRS | Record Position, Rotation, and Scale together for the selected object |
| Set Visible | Record all currently visible timeline rows at the playhead |
| Set Pinned | Record every pinned timeline row at the playhead |
| Layer In / Layer Out | Trim selected object layer range |
| Split | Split selected object layer at the playhead |
| Layer Work | Set Work In/Out to selected layer range |
| Layer Keys | Select keys inside selected layer range |
| Fit Layer | Fit selected object keys into its layer range |
| Sequence | Sequence object layer ranges from the playhead |
| Linear / Ease In / Ease Out / Ease / Hold | Change selected key interpolation |
| Graph | Show/hide value graph for the active track |
| Marker | Add/update or delete timeline marker |
| Delete | Delete selected keyframes |
| Ripple Del | Delete selected keyframes and close the timing gap |
| Copy / Cut / Paste | Clipboard for selected keyframes |
| Paste Insert | Paste and push later keys forward |
| Select Work | Select active-track keys inside Work In/Out |
| Select Visible | Select keys on visible rows |
| Select Pinned | Select keys on pinned rows |
| Select Time | Select keys at current playhead time |
| Pinned Time Commands | Command Palette actions for select/copy/cut/duplicate/delete pinned-row keys at the playhead |
| Dup Time / Del Time | Duplicate or delete visible-row keys at the playhead |
| Insert Gap | Push later visible-row keys by Work In/Out length |
| Lift Work | Delete visible-row keys inside Work In/Out without closing gap |
| Extract Work | Delete visible-row keys inside Work In/Out and close gap |
| Preview Sel | Play only the selected keyframe range |
| To Playhead | Move selected key block so it begins at playhead |
| Center | Center selected key block around playhead |
| Rove | Redistribute interior selected keys between fixed endpoints |
| Reverse | Reverse selected key timing |
| Snap | Snap selected keys to frame boundaries |
| Distribute | Evenly distribute selected keys across Work In/Out |
| Fit Keys | Stretch selected keys into Work In/Out |
| Stagger | Offset selected timing columns by snap step |
| Cascade | Sequence selected object/camera/light target key blocks |
| Duplicate | Duplicate selected keyframes |
| Track On / Solo / Lock | Enable, isolate, or lock active track |
| Clear Track | Delete every key on active track |
| Arrow / Hand | Timeline selection tool or pan tool |
| Zoom buttons | Zoom out, fit, fit selected, follow playhead, zoom in |

## Essential Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` or `F3` | Command palette |
| `T`, `R`, `S` | Move, rotate, scale tools |
| `F` or `Numpad .` | Frame selected object |
| `Space` | Play / pause |
| `Shift+Space` | Preview selected keyframe range |
| `J`, `K`, `L` | Play backward, pause, play forward |
| `Left`, `Right` | Step one frame |
| `Shift+Left`, `Shift+Right` | Previous / next keyframe on active track |
| `Ctrl+Alt+Left`, `Ctrl+Alt+Right` | Previous / next visible-row keyframe |
| `Home`, `End` | Work In / Work Out |
| `B`, `N` or `I`, `O` | Set Work In / Work Out to playhead |
| `U` | Cycle Focus, Keyed, Pinned, All Rows |
| `V`, `H` | Timeline selection tool, timeline pan tool |
| `Alt+P`, `Alt+R`, `Alt+S` | Reveal Position, Rotation, Scale rows |
| `Shift+P` | Pin or unpin the active timeline row |
| `Alt+C`, `Alt+T`, `Alt+M`, `Alt+U` | Reveal Color, Opacity, Material, Texture rows |
| `F9` | Easy Ease |
| `Shift+F9` | Linear |
| `Ctrl+F9` | Ease In |
| `Ctrl+Shift+F9` | Ease Out |
| `Alt+F9` | Hold |
| `Ctrl+A` | Select active-track keyframes |
| `Ctrl+Shift+A` | Select active-track keys inside Work In/Out |
| `Ctrl+Alt+A` | Select visible-row keyframes |
| `Ctrl+Alt+K` | Select visible-row keys at playhead |
| `Ctrl+C`, `Ctrl+X`, `Ctrl+V` | Copy, cut, paste keyframes |
| `Ctrl+D` | Duplicate selected keyframes |
| `Delete` / `Backspace` | Delete selected keys, otherwise selected object |
| `Shift+Delete` | Ripple delete selected keyframes |
| `Shift+Enter` | Move selected keys to playhead |
| `Shift+C` | Center selected keys around playhead |
| `Shift+V` | Rove selected interior keys |
| `Shift+R` | Reverse selected key timing |
| `Shift+S` | Snap selected keys to frames |
| `Shift+D` | Distribute selected keys across Work In/Out |
| `Shift+F` | Fit selected keys into Work In/Out |
| `Shift+G` | Stagger selected keys |
| `Alt+Shift+G` | Cascade selected target key blocks |
| `M` | Add/update marker |
| `Alt+M`, `Shift+M` | Previous / next marker |
| `Alt+Shift+M` | Delete marker at playhead |
| `-`, `=`, `0` | Timeline zoom out, zoom in, fit duration |
| `Shift+0` | Fit selected keyframes in timeline view |
| `Alt+Mouse Wheel` | Cursor-centered timeline zoom |
| `Shift+Mouse Wheel` | Horizontal timeline pan |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save scene JSON |
| `F2` on timeline object group | Rename object |

## Most Common Workflows

### Record Position, Rotation, And Scale Motion

1. Select the object.
2. Set `Time` to `0`.
3. Place the object at its first pose.
4. Click `Set TRS`.
5. Set `Time` to the next moment, for example `2`.
6. Move, rotate, and scale the object to the second pose.
7. Click `Set TRS` again.
8. Scrub the playhead or press `Play`.

### Record One Property Only

1. Select the object.
2. Pick a track from the timeline dropdown, for example `Rotation`.
3. Set the playhead time.
4. Change that property.
5. Click `Set Key` or the diamond on that property row.

If a key already exists at that time, `Set Key` updates it.

### Keep Important Tracks Visible

1. Use row search or `Alt+P` / `Alt+R` / `Alt+S` to reveal the rows you care
   about.
2. Click the toolbar pin button, or search `Pin Visible Timeline Rows` in the
   command palette.
3. For object transforms, search `Pin Selected Transform Rows` to pin Position,
   Rotation, and Scale in one step.
4. Switch the row filter to `Pinned Rows`, or search `Show Pinned Timeline Rows`.
5. Click `Set Pinned` when you want the pinned rows to act like a reusable
   keying set.
6. Click `Select Pinned` when you want to retime, copy, ease, or delete keys
   only on that pinned keying set.
7. Search `Select`, `Copy`, `Cut`, `Duplicate`, or `Delete Pinned Row Keys At
   Playhead` when you want to work with the pinned pose column at the current
   time.
8. Use the pin-off toolbar button or `Clear Pinned Timeline Rows` when the
   pinned set is no longer useful.

### Animate Camera

1. Use the camera controls or numeric Camera panel fields to set the first view.
2. Choose `Camera Position`, `Camera Target`, or `Camera Lens` from the timeline
   dropdown.
3. Click `Set Key`.
4. Move the playhead.
5. Change the camera view or lens values.
6. Click `Set Key` again.

For a complete camera move, key both `Camera Position` and `Camera Target`.

### Animate Lighting

1. Choose Sun, Point, or Spot in the Lighting section.
2. Set color, intensity, or position.
3. Pick the matching light track in the timeline dropdown.
4. Click `Set Key` at each time.

### Make Imported Models Readable

1. Import the model.
2. Select it in the outliner.
3. Try `Clay`, `Ceramic`, or `Anime Toon` material presets.
4. Enable SSAO or shadows in Rendering Lab for contact definition.
5. Use outlines or selected-object outline when the silhouette is hard to see.

## Report Screenshots

Good screenshots for the report:

- Default editor with primitives, grid, shadows, and timeline.
- Timeline with Position / Rotation / Scale rows expanded and keys visible.
- Graph editor with an eased curve.
- Rendering Lab showing SSAO, bloom, depth of field, or path-traced preview.
- Imported OBJ/GLB model selected in outliner.
- Evaluation Tour scene with requirement callouts.
- Screenshot export result from the viewport.
