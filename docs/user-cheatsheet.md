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
- Filter chips: `Shortcuts`, `Viewport`, `Timeline`, and `Rendering` narrow the
  help overlay when you only need one part of the editor.
- Direct command searches: `Shortcut Help`, `Timeline Help`, `Viewport Help`, or
  `Rendering Help`.

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
| Asset browser | Open online GLB models and built-in asset presets |
| Import | Import `.glb`, `.gltf`, `.obj`, `.mtl`, `.stl`, and texture files |

Drag-and-drop model or texture files onto the viewport also works.

## Asset Browser

Open `Asset browser` from the left tool rail.

| Tab | Use It For |
| --- | --- |
| Online Models | Import curated `.glb` models from Khronos glTF Sample Assets |
| Campus | Import copied GLB assets from the existing school campus project |
| Built-in | Apply local looks, textures, materials, primitives, and the Sample Drone |
| Materials | Filter built-in looks, procedural textures, and material presets |
| Models | Filter built-in geometry/model cards |

The browser has search, `Import` / `Apply` buttons, source links for online
models, a close button, and a minimize button. Imported online models are added
to the outliner like normal GLB imports, then can be transformed, shaded,
animated, saved, or exported.

To load the complete campus example: open `Asset browser` and click
`Load Campus`. This clears the current scene, loads the copied `E Hall` campus
GLB as a ready-to-view landscape, applies sharp campus lighting/render settings
with heavy blur-prone effects disabled, and frames the camera automatically. The
individual campus GLB files remain in the `Campus` tab for manual inspection,
but `Load Campus` is the intended one-click workflow.

## Inspector Sections

| Section | Use It For |
| --- | --- |
| Document | Undo, redo, save/load scene JSON |
| Outliner | Select, rename, duplicate, or delete objects |
| Transform | Move, rotate, scale, world/local space, reset transform |
| Parent & Link | Parent selected objects to another layer or create a Null Controller |
| Geometry / Render Mode | Change primitive type or switch Solid, Lines, Points |
| Material | Color, material mode, PBR presets, opacity, roughness, metalness |
| Textures | Built-in texture presets, uploaded bitmap texture, repeat/offset/rotation |
| Camera | Projection controls, view presets, frame selected/all, frustum helper |
| Lighting | Sun, point, spot, ambient, shadows, helpers, lighting presets |
| Display | Clean View, grid, axes, FPS/telemetry, motion paths, UI density, UI scale |
| Rendering Lab | Tone mapping, exposure, shadow quality, SSAO, bloom, vignette, FXAA, depth of field, path-traced preview |

Use `Blender` UI density when the inspector feels too large. Use `Scale` at
`75%` when you want the whole editor to look like Chrome zoom 0.75 while keeping
the setting inside the app.

Use `Scene Controls > Display > Clean View` or `Alt+G` before screenshots when
the grid, axes, transform gizmo, helpers, motion overlays, or blur-style post
effects make the scene look too busy. Press `Alt+G` again or click `Restore
View` to restore the previous editor guides. Use the individual `Grid` and
`Axes` toggles when you only want to hide those two guides.

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
| Parent to null | Parent & Link panel / command palette | Command palette search `parent null` |
| Clear parent | Parent & Link panel / command palette | Command palette search `clear parent` |

For animation authoring, prefer `Set Pose` or `Set Pose Key` when you want
Position, Rotation, and Scale recorded together.

## Timeline Basics

| Control | Meaning |
| --- | --- |
| Time | Current playhead time; accepts seconds, frames like `45f`, timecode like `00:00:02:15`, or relative offsets like `+10f` |
| Duration | Full timeline length; accepts the same seconds/frame/timecode formats |
| Work In / Work Out | Preview/export range; accepts the same seconds/frame/timecode formats |
| FPS | Frame grid for stepping and snapping |
| Display | Switch the timeline readout and ruler between Timecode, Frames, and Seconds |
| Speed | Playback rate |
| Snap | Snap keyframes/playhead to frame or marker landmarks |
| Loop | Repeat Work In/Out during playback |
| Stopwatch keying | After Position, Rotation, or Scale has keys, editing that transform at another time updates/creates the playhead key even when global Auto-Key is off |
| Alt-click keyed diamond / Set Pose | Clear all keys from that transform, timeline-row property, or full Position/Rotation/Scale pose track group |
| Auto-Key | Automatically records changed values even before a track exists |
| Pose Keys | With Auto-Key on, transform edits record Position, Rotation, and Scale together |
| Track dropdown | Chooses the active row; for Position/Rotation/Scale the main key button records a full pose |
| Row filter | `Focus`, `Selected Layer`, `Selected Keyed`, `Keyed`, `Pinned`, or `All` timeline rows; command palette can jump directly to any mode |
| Search rows | Filter dense object/camera/light/material rows |
| Pin visible rows | Pins every row currently visible after search/filtering |
| Clear pinned rows | Removes every pinned-row preference |

## Timeline Buttons

| Button | Use It For |
| --- | --- |
| Play | Play/stop timeline |
| Start / Out | Jump to Work In / Work Out |
| Previous/Next frame | Step one frame |
| Previous/Next key | Jump between keys on the active track |
| Previous/Next visible-row key | Jump between keys in visible rows |
| Previous/Next selected-layer key | Command Palette or `Alt+Shift+Left/Right`; also selects that layer's keys at the destination time |
| Previous/Next pinned-row key | Command Palette or `Ctrl+Alt+Shift+Left/Right` |
| Fit Pinned Row Keyframes | Command Palette action to zoom around pinned-row key times |
| Set Work Area To Pinned Row Keyframes | Command Palette action to make Work In/Out match pinned-row key times |
| Preview Pinned Row Keyframe Range | Command Palette action to play only the pinned-row key range |
| Fit Selected Layer Keyframe Range | Command Palette action to zoom around the selected object's key times |
| Set Work Area To Selected Layer Keyframes | Command Palette action to make Work In/Out match the selected object's key times |
| Preview Selected Layer Keyframe Range | Command Palette action to play only the selected object's keyed range |
| Motion Presets | Command Palette actions that bake Turntable, Float Loop, Pop Intro, or Product Reveal into editable keys |
| Set Key | Add or update one key on the selected non-transform track dropdown |
| Set Pose / Set Pose Key | Record Position, Rotation, and Scale together for the selected object |
| Set Visible | Record all currently visible timeline rows at the playhead |
| Set Pinned | Record every pinned timeline row at the playhead |
| Showcase | Build the reference-style wire sphere, grid floor, shadow, and editable timeline demo |
| Layer In / Layer Out | Trim selected object layer range |
| Split | Split selected object layer at the playhead |
| Layer Work | Set Work In/Out to selected layer range |
| Layer Keys | Select keys inside selected layer range |
| Layer Time | Select only the selected object's keys at the current playhead time and reveal its keyed rows |
| Fit Layer | Fit selected object keys into its layer range |
| Sequence | Sequence object layer ranges from the playhead |
| Linear / Ease In / Ease Out / Ease / Back In / Back Out / Hold | Change selected key interpolation |
| Interpolation dropdown | Full interpolation list; choose a keyframe first before applying a mode |
| Ease % / In % / Out % | Strength for selected keyframe easing: `Ease %` sets both sides, `In %` affects the segment ending at the key, `Out %` affects the segment starting at the key |
| Graph | Show/hide graph editor for the active track |
| Value / Speed | Switch between editable value curves and velocity graph; Speed keys can retime and adjust `Ease %` |
| Both / In / Out | Speed graph ease-side selector; choose which side vertical speed-key drags and Up/Down nudges edit |
| Marker | Add/update or delete timeline marker |
| Delete | Delete selected keyframes |
| Ripple Del | Delete selected keyframes and close the timing gap |
| Copy / Cut / Paste | Clipboard for selected keyframes |
| Paste Insert | Paste and push later keys forward |
| Paste Reversed | Paste copied keyframes with their timing flipped inside the copied span |
| Select Work | Select active-track keys inside Work In/Out |
| Select Visible | Select keys on visible rows |
| Select Pinned | Select keys on pinned rows |
| Select Time | Select keys at current playhead time |
| Select Visible Before / After | Command Palette actions for visible-row tail edits around the playhead |
| Selected Layer Time Commands | Command Palette actions to copy, cut, duplicate, or delete only the selected object's keys at the playhead |
| Pinned Time Commands | Command Palette actions for select/copy/cut/duplicate/delete pinned-row keys at the playhead |
| Dup Time / Del Time | Duplicate or delete visible-row keys at the playhead |
| Insert Gap | Push later visible-row keys by Work In/Out length |
| Lift Work | Delete visible-row keys inside Work In/Out without closing gap |
| Extract Work | Delete visible-row keys inside Work In/Out and close gap |
| Layer Gap / Layer Lift / Layer Extract | Toolbar buttons and Command Palette actions to insert, lift, or extract only the selected object's Work In/Out keys |
| Selected Layer Work Clipboard | Command Palette actions to copy, cut, or duplicate only the selected object's Work In/Out keys |
| Preview Sel | Play only the selected keyframe range |
| To Playhead | Move selected key block so it begins at playhead |
| Center | Center selected key block around playhead |
| Marker Align | Command Palette actions move selected key blocks to previous, nearest, or next marker |
| Marker Fit | Command Palette action fits selected key blocks between the neighboring markers around the playhead |
| Rove | Redistribute interior selected keys between fixed endpoints |
| Reverse | Reverse selected key timing |
| Snap | Snap selected keys to frame boundaries |
| Distribute | Evenly distribute selected keys across Work In/Out |
| Fit Keys | Stretch selected keys into Work In/Out |
| Stagger | Offset selected timing columns by snap step |
| Cascade | Sequence selected object/camera/light target key blocks |
| Cycle | Repeat selected keyframe blocks forward until Work Out |
| Ping-Pong | Repeat selected keyframe blocks to Work Out while alternating reversed copies |
| Offset Loop | Repeat selected keyframe blocks to Work Out while accumulating the end-minus-start value delta |
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
| `Space` | Play / stop |
| `Shift+Space` | Preview selected keyframe range |
| `J`, `K`, `L` | Play backward, stop, play forward |
| Hold `K` + tap `J` / `L` | Step one frame backward / forward without starting playback |
| `Left`, `Right` | Step one frame |
| `Shift+Left`, `Shift+Right` | Previous / next keyframe on active track |
| `Ctrl+Alt+Left`, `Ctrl+Alt+Right` | Previous / next visible-row keyframe |
| `Alt+Shift+Left`, `Alt+Shift+Right` | Previous / next keyframe on the selected layer/object, selecting the destination key column |
| `Ctrl+Alt+Shift+Left`, `Ctrl+Alt+Shift+Right` | Previous / next pinned-row keyframe |
| `Home`, `End` | Work In / Work Out |
| `B`, `N` or `I`, `O` | Set Work In / Work Out to playhead |
| `Shift+U` | Show keyed rows for the selected layer/object and clear stale row search |
| `U` | Cycle Focus, Selected Layer, Selected Keyed, Keyed, Pinned, All Rows and clear stale row search |
| `V`, `H` | Timeline selection tool, timeline pan tool |
| `Alt+P`, `Alt+R`, `Alt+S` | Reveal Position, Rotation, Scale rows |
| `Shift+P` | Pin or unpin the active timeline row |
| `Shift+K` | Set Pose Key for Position, Rotation, and Scale |
| `Alt+Click` keyed transform/timeline diamond or Set Pose | Clear that animated property track, or clear Position/Rotation/Scale together from Set Pose |
| `Alt+C`, `Alt+T`, `Alt+M`, `Alt+U` | Reveal Color, Opacity, Material, Texture rows |
| `F9` | Easy Ease |
| `Shift+F9` | Linear |
| `Ctrl+F9` | Ease In |
| `Ctrl+Shift+F9` | Ease Out |
| `Alt+F9` | Hold |
| Command Palette: `back in`, `back out`, or `overshoot` | Apply anticipation or overshoot interpolation |
| Command Palette: `copy keyframe ease` / `paste keyframe ease` | Reuse interpolation and `Ease %` / `In %` / `Out %` on other selected keys |
| Command Palette: `copy keyframe value` / `paste keyframe value` | Reuse the selected key's exact property value on other keys of the same track type without changing their time or easing |
| Command Palette: `copy pose keys at playhead` / `paste pose keys at playhead` | Reuse a complete Position/Rotation/Scale keyframe pose at another time or on another object |
| `Ctrl+A` | Select active-track keyframes |
| `Ctrl+Shift+A` | Select active-track keys inside Work In/Out |
| `Ctrl+Alt+A` | Select visible-row keyframes |
| `Ctrl+Alt+K` | Select visible-row keys at playhead |
| Focus graph key, `Left` / `Right` | Retime selected graph keys by the snap step |
| Focus graph key, `Up` / `Down` | Nudge selected graph values, or Speed graph ease strength |
| Command Palette: `selected layer work area keyframes` | Select only the selected object's keys inside Work In/Out |
| Command Palette: `selected layer keys at playhead` | Select the selected object's keyframe column at the playhead |
| Command Palette: `selected layer keys before/after playhead` | Select only the selected object's earlier/later keyframes for tail edits |
| Command Palette: `copy/cut/duplicate/delete selected layer keys at playhead` | Edit only the selected object's keyframe column at the playhead |
| Command Palette: `select visible before` / `select visible after` | Select visible-row keys before or after playhead |
| `Escape` | Deselect selected timeline keyframes |
| `Ctrl+C`, `Ctrl+X`, `Ctrl+V` | Copy, cut, paste keyframes |
| Command Palette: `paste reversed keyframes` | Paste copied keys backward from the playhead |
| `Ctrl+D` | Duplicate selected keyframes |
| `Delete` / `Backspace` | Delete selected keys, otherwise selected object |
| `Shift+Delete` | Ripple delete selected keyframes |
| `Shift+Enter` | Move selected keys to playhead |
| `Shift+C` | Center selected keys around playhead |
| Command Palette: `move keyframes to nearest marker` | Align selected key block to the closest marker from the playhead |
| Command Palette: `fit keyframes between neighbor markers` | Stretch selected key block to the previous/next marker span around the playhead |
| `Shift+V` | Rove selected interior keys |
| `Shift+R` | Reverse selected key timing |
| `Shift+S` | Snap selected keys to frames |
| `Shift+D` | Distribute selected keys across Work In/Out |
| `Shift+F` | Fit selected keys into Work In/Out |
| `Shift+G` | Stagger selected keys |
| `Alt+Shift+G` | Cascade selected target key blocks |
| `Shift+Y` | Cycle selected keyframe blocks to Work Out |
| Command Palette: `ping-pong selected keyframes` | Alternate forward/reversed repeats to Work Out |
| Command Palette: `offset loop selected keyframes` | Repeat selected keys while accumulating motion/value deltas |
| `M` | Add/update marker |
| `Alt+M`, `Shift+M` | Previous / next marker |
| `Alt+Shift+M` | Delete marker at playhead |
| `-`, `=`, `0` | Timeline zoom out, zoom in, fit duration |
| `Shift+0` | Fit selected keyframes in timeline view |
| Focus graph key, `Up` / `Down` | Nudge selected graph key values |
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
4. Press `Shift+K`, click the main timeline `Set Pose` button, or click `Set Pose Key` in the Transform inspector.
   Explicit pose keying reveals `Selected Keyed Rows` and clears stale row search so Position, Rotation, and Scale are visible immediately.
5. Set `Time` to the next moment, for example `2`.
6. Move, rotate, and scale the object to the second pose.
7. Existing Position, Rotation, and Scale tracks behave like AE stopwatches: changing those values updates/creates playhead keys. Press `Shift+K` or click `Set Pose` again when you want to force all three transform tracks at once.
8. Scrub the playhead or press `Play`.

### Reuse A Complete Timeline Pose

1. Select an object that already has Position, Rotation, and Scale keys at the
   playhead.
2. Open Commands and run `Copy Pose Keys At Playhead`.
3. Select the target object or move to the target time.
4. Run `Paste Pose Keys At Playhead`.
5. The app writes Position, Rotation, and Scale keys together and preserves the
   copied interpolation/ease settings.

### Auto-Key Full Transform Poses

1. Enable `Auto-Key`.
2. Enable `Pose Keys`.
3. Move the playhead to the target time.
4. Change Position, Rotation, or Scale in the inspector or viewport gizmo.
5. The app records Position, Rotation, and Scale tracks together, so the object
   keeps one coherent pose at that time.

### Record One Property Only

1. Select the object.
2. Pick a track from the timeline dropdown, for example `Rotation`.
3. Set the playhead time.
4. Change that property.
5. Click the diamond on that property row. For non-transform rows, `Set Key`
   also records the active property.

If a key already exists at that time, the row diamond or `Set Key` updates it.

### Retime A Selected Key Block Numerically

1. Select multiple keyframes.
2. Edit `Key Time` in the keyframe editor.
3. The earliest selected key moves to that time, and the rest of the selected
   keys keep their relative spacing.
4. Edit `End` to stretch the selected block so the latest selected key lands at
   that time.
5. Edit `Span` to stretch or compress the selected block from the earliest key.
6. These fields accept seconds, frames like `90f`, timecode like
   `00:00:03:00`, and relative offsets like `+10f`.

### Offset Selected Key Values

1. Select one or more keyframes.
2. Edit `X`, `Y`, `Z`, or the active value field.
3. Type an absolute value such as `4` to set all selected keys to that value.
4. Type `+=1`, `-=0.5`, or `+2` to offset selected keys while preserving their
   relative value differences.

### Apply A Motion Preset

1. Select the object.
2. Set Work In / Work Out to the desired animation span.
3. Press `Ctrl+K` or `F3`.
4. Search `motion preset`.
5. Run `Apply Turntable Motion Preset`, `Apply Float Loop Motion Preset`,
   `Apply Pop Intro Motion Preset`, or `Apply Product Reveal Motion Preset`.
6. Edit the generated Position, Rotation, Scale, or Opacity keys normally.

These presets are keyframe generators. They do not create hidden procedural
animation.

### Keep Important Tracks Visible

1. Use row search or `Alt+P` / `Alt+R` / `Alt+S` to reveal the rows you care
   about.
2. Click the toolbar pin button, or search `Pin Visible Timeline Rows` in the
   command palette.
3. For object transforms, search `Pin Selected Transform Rows` to pin Position,
   Rotation, and Scale in one step. This switches to `Pinned Rows` and clears
   stale row search so the keying set is visible immediately.
4. Switch the row filter to `Pinned Rows`, or search `Show Pinned Timeline Rows`
   when you need to reveal an existing pinned set. Keyboard and command-palette
   row-filter reveals clear stale row search first.
5. Click `Set Pinned` when you want the pinned rows to act like a reusable
   keying set. Pinned-row key/select commands reveal `Pinned Rows` and clear
   stale row search so the result is visible immediately.
6. Click `Select Pinned` when you want to retime, copy, ease, or delete keys
   only on that pinned keying set.
7. Search `Select`, `Copy`, `Cut`, `Duplicate`, or `Delete Pinned Row Keys At
   Playhead` when you want to work with the pinned pose column at the current
   time.
8. Use the pin-off toolbar button or `Clear Pinned Timeline Rows` when the
   pinned set is no longer useful.

### Select A Timeline Tail

1. Search or filter the timeline to the rows you want to edit.
2. Move the playhead to the timing boundary.
3. Press `Ctrl+K` or `F3`.
4. Run `Select Visible Row Keys After Playhead` to select later keys, or
   `Select Visible Row Keys Before Playhead` to select earlier keys.
5. Move, nudge, ease, delete, copy, or fit the selected keys.

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
