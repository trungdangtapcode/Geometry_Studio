# Geometry Studio Beginner Tutorial And Cheat Sheet

This guide is for using Geometry Studio like a compact Blender plus After
Effects workspace. It explains what to click, what shortcuts matter, and how to
produce report-ready evidence.

## 1. Start The App

Source development:

```bash
cd Source
npm install
npm run dev
```

Release build:

```bash
cd Release
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`.

Use the release through a local server. Do not rely on double-clicking
`index.html`, because model and texture loading is more reliable through HTTP.

## 2. Main Screen Map

| Area | Purpose |
| --- | --- |
| Left rail | Add primitives, open Asset Browser, import models |
| Center viewport | Select, orbit, pan, zoom, transform, screenshot |
| Right inspector | Edit object, material, camera, lighting, rendering, display |
| Bottom buttons | Play, demo scenes, commands, help, screenshot, WebM recording |
| Bottom timeline | Add, select, retime, ease, and preview keyframes |

When lost, use `Ctrl+K` or `F3` to open Commands. Search the action name.
Use `?` or the `Help` button for the in-app quick help.

Hovering most controls shows a tiny shortcut chip. It is intentionally small:
label plus key only.

## 3. Essential Shortcuts

| Action | Shortcut |
| --- | --- |
| Open Commands | `Ctrl+K` or `F3` |
| Open Help | `?` |
| Play / Stop | `Space` |
| Stop playback | `K` |
| Play backward / forward | `J` / `L` |
| Move / Rotate / Scale tool | `T` / `R` / `S` |
| Frame selected | `F` or `Numpad .` |
| Clean View | `Alt+G` |
| Set full transform pose key | `Shift+K` |
| Reveal Position / Rotation / Scale rows | `Alt+P` / `Alt+R` / `Alt+S` |
| Show selected keyed rows | `Shift+U` |
| Selection / Pan timeline tool | `V` / `H` |
| Fit timeline / fit selected keys | `0` / `Shift+0` |
| Copy / cut / paste timeline keys | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` |
| Delete selected keys | `Delete` |
| Easy Ease / Linear / Hold | `F9` / `Shift+F9` / `Alt+F9` |
| Work In / Work Out | `B` or `I` / `N` or `O` |

## 4. Hide Grid, Axis, And Visual Helpers

Use this when the grid or axes make screenshots look messy.

| Need | Use |
| --- | --- |
| Hide only grid | `Scene Controls > Display > Grid` checkbox |
| Hide only axes | `Scene Controls > Display > Axes` checkbox |
| Hide grid, axes, transform gizmo, helpers, overlays, and blur effects | `Scene Controls > Display > Clean View` |
| Toggle Clean View by keyboard | `Alt+G` |

Clean View disables the grid, axes, transform gizmo, FPS/telemetry, camera
frustum helper, light helpers, motion path, onion skin, and blur-heavy post
effects such as DOF, SSAO, bloom, vignette, and halftone. Press `Alt+G` again
or click `Restore View` to bring the previous editor guides and post effects
back.

## 5. Navigate The Camera

| Camera Move | Mouse / Shortcut |
| --- | --- |
| Orbit around target | Left drag or middle mouse drag |
| Pan target | `Shift` + middle mouse drag or right drag |
| Zoom / dolly | Mouse wheel |
| Frame selected object | `F` |
| Frame all visible objects | Camera panel `Frame All` |

If the camera feels lost, click an object and press `F`. If everything is lost,
use `Camera > Frame All` or `Camera > Reset`.

## 6. Add And Select Objects

1. Click a primitive icon on the left rail: Cube, Sphere, Cone, Cylinder, Torus,
   Teapot, Torus Knot, Tube Curve, Platonic solids, Parametric Surface, or
   Extruded Shape.
2. Select the object in the viewport or Outliner.
3. Rename, duplicate, or delete it from the Outliner.
4. Use `T`, `R`, or `S` for transform tools.
5. Use the numeric Transform inspector for exact Position, Rotation, and Scale.

## 7. Materials, Textures, And Render Modes

| Feature | Where |
| --- | --- |
| Solid / Points / Lines | `Geometry / Render Mode` |
| PBR material presets | `Material` section |
| Anime / toon look | `Material > Anime Toon` |
| Color, opacity, roughness, metalness | `Material` section |
| Checker, UV, Grid, Bricks, Wood, Carbon, Blueprint, Dots | `Textures` section |
| Bitmap texture upload | `Textures > Upload` |
| Shadow and light readability | `Lighting` and `Rendering Lab` |

For dark or hard-to-read imported objects, try `Clay`, `Anime Toon`, stronger
lighting, shadows, and a clean camera angle.

## 8. Import Models

Supported formats:

| Format | Notes |
| --- | --- |
| `.glb` | Best option. One file can include geometry, materials, textures |
| `.gltf` | Usually needs external `.bin` and texture files |
| `.obj` | Geometry; select `.obj`, `.mtl`, and textures together for materials |
| `.stl` | Geometry only, usually no material |

Ways to import:

1. Click the left rail import button.
2. Drag model files onto the viewport.
3. Use the Asset Browser for built-in, campus, or online sample assets.

Imported models are centered, normalized, added to the Outliner, and can be
transformed and keyframed like primitives.

## 9. Load The Campus Scene

For the complete E Hall campus landscape:

1. Open the Asset Browser from the left rail package icon.
2. Go to the `Campus` tab.
3. Click `Load Campus`.
4. Wait for progress to finish.
5. Use `Clean View` or `Alt+G` if the grid/axes distract from the campus.

The campus scene is copied into this project as local release assets. It is not
loaded by hardcoded external paths.

## 10. Save And Load Existing Work

| Action | Button |
| --- | --- |
| Save project scene | `Document > Save JSON` |
| Load saved project scene | `Document > Load JSON` |

Scene JSON stores objects, materials, camera, lights, rendering settings,
display settings, and timeline keyframes. Use it for project persistence.

## 11. Basic Transform Animation

Use this when you want object A at pose `A_t0`, then pose `A_t1`, and the app
interpolates motion between them.

1. Select object A.
2. Set timeline `Time` to `0`.
3. Move, rotate, and scale object A to the starting pose.
4. Click `Set Pose` in the timeline or `Set Pose Key` in the Transform panel.
5. Set timeline `Time` to `2`.
6. Move, rotate, and scale object A to the ending pose.
7. Click `Set Pose` / `Set Pose Key` again.
8. Scrub between `0` and `2`, or press `Play`.

`Set Pose` records Position, Rotation, and Scale together. This is the safest
workflow for full object motion.

## 12. Animate Only One Transform Channel

Use row diamonds when you want only Position, only Rotation, or only Scale.

1. Select the object.
2. Reveal rows with `Alt+P`, `Alt+R`, or `Alt+S`.
3. Set the playhead to the first time.
4. Change the object value.
5. Click the diamond on that specific Position, Rotation, or Scale row.
6. Move the playhead to the second time.
7. Change the value again.
8. Click the same row diamond again.
9. Scrub or play.

If there is already a key at the playhead, the diamond updates it. If there is
no key at the playhead, the diamond adds one.

## 13. Auto-Key And Stopwatch-Style Keying

| Mode | Behavior |
| --- | --- |
| Manual keying | You click `Set Pose`, `Set Key`, or a row diamond |
| Auto-Key | Changes create keys automatically after initial keys exist |
| Pose Keys | Auto-Key records Position, Rotation, and Scale together |
| Stopwatch-style transform keying | Existing transform tracks can receive new keys when edited at another time |

Recommended beginner workflow:

1. Create the first key manually.
2. Enable Auto-Key only after that first key exists.
3. Enable Pose Keys if you want full transform poses.
4. Turn Auto-Key off when finished.

## 14. Timeline Rows And Filters

| Control | Meaning |
| --- | --- |
| Focus Rows | Show the currently relevant rows |
| Selected Layer | Show rows for the selected object |
| Selected Keyed | Show keyed rows for selected object |
| Keyed | Show every keyed row |
| Pinned | Show only pinned rows |
| All | Show all available rows |

Use `Shy` when an object layer is not relevant to the current animation edit but
should remain in the scene. Mark the selected object as shy, then click
`Hide Shy`. This cleans the timeline without muting tracks or hiding objects in
the viewport.

Use the enable switch on an object group row when you want to mute that layer's
keyed animation temporarily. The keyframes stay saved and editable, but disabled
tracks do not drive playback until you enable the layer again.

Use the solo switch on an object group row when you want to review only that
layer's keyed animation. Solo does not lock keys or hide objects; it only tells
the playback runtime to evaluate the soloed keyed tracks until solo is cleared.

Use the lock switch on an object group row when you want to protect every keyed
track on that layer from accidental edits. It is different from hiding or shy:
the animation still plays, but key editing is blocked until you unlock it.

Click the colored dot on an object group row to cycle that layer's label color.
These labels are timeline organization colors, not material colors, so they are
safe to use for presenter notes such as hero object, background object, camera
helper, or imported asset.

Use `Set Selected Layer Comment` from the Command Palette when you need a
longer note on a layer. Comments appear beside the object group metadata and can
be found with the timeline row search field.

Use `Move Selected Layer Up`, `Move Selected Layer Down`, `Move Selected Layer
To Top`, and `Move Selected Layer To Bottom` when a scene becomes crowded. These
commands reorder the outliner and timeline stack without changing object
position, keyframes, or parent links.

Use `Alt+ArrowUp`, `Alt+ArrowDown`, `Alt+Home`, and `Alt+End` to select the
previous, next, first, or last object layer in the current stack. This is useful
during demos because the outliner, timeline active row, viewport transform
gizmo, and inspector all follow the same selected layer.

Use `Layer Dup` when you want a second copy of the selected object with the same
animation. This is different from duplicating selected keyframes: the whole
object layer is cloned, selected, offset in the scene, and given copied timeline
tracks with fresh IDs.

Use `Duplicate Selected Layer At Playhead` from the Command Palette, or press
`Ctrl+Alt+Shift+D`, when you want the copied layer to begin at the current
playhead. Example: animate Cube from `0s` to `1s`, move the playhead to `3s`,
then run this command to create a second Cube whose copied animation starts at
`3s`.

Useful row shortcuts:

| Action | Shortcut |
| --- | --- |
| Cycle row filter | `U` |
| Show selected keyed rows | `Shift+U` |
| Pin active row | `Shift+P` |
| Reveal Position | `Alt+P` |
| Reveal Rotation | `Alt+R` |
| Reveal Scale | `Alt+S` |
| Reveal Color | `Alt+C` |
| Reveal Opacity | `Alt+T` |
| Reveal Material | `Alt+M` |
| Reveal Texture | `Alt+U` |

If you cannot see your keys, switch the row filter to `Keyed`, `Selected Keyed`,
or `All`.

## 15. Edit Keyframes

| Task | Control / Shortcut |
| --- | --- |
| Select a key | Click diamond |
| Move a key in time | Drag it |
| Delete selected keys | `Delete` |
| Copy / cut / paste | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` |
| Paste copied keys backward | `Paste Rev` button or Command Palette: `Paste Reversed Keyframes` |
| Paste copied keys backward and preserve later keys | `Rev Insert` button or Command Palette: `Paste Reversed Insert Keyframes` |
| Duplicate selected keys | `Ctrl+D` |
| Copy one key's value only | Command Palette: `Copy Keyframe Value` |
| Paste that value onto matching keys | Command Palette: `Paste Keyframe Value` |
| Copy complete pose keys | Command Palette: `Copy Pose Keys At Playhead` |
| Paste complete pose keys | Command Palette: `Paste Pose Keys At Playhead` |
| Move selected keys to playhead | `Shift+Enter` |
| Retime graph keys | Focus a graph key, then press `Left` / `Right` |
| Nudge graph values or speed ease | Focus a graph key, then press `Up` / `Down` |
| Center selected keys on playhead | `Shift+C` |
| Set Work In/Out to selected keys | `Work Sel` button or `Shift+B` |
| Move selected keys to marker beats | Command Palette: `Move Keyframes To Previous/Nearest/Next Marker` |
| Reverse timing | `Shift+R` |
| Snap to frame | `Shift+S` |
| Distribute across Work In/Out | `Shift+D` |
| Fit into Work In/Out | `Shift+F` |
| Fit selected keys to the playhead | `Fit CTI` button or Command Palette: `Fit Keyframes To Playhead` |
| Bake active track to frame keys | `Bake` button or Command Palette: `Bake Active Track To Frame Keys` |
| Compress or stretch around first selected key | `50%` / `200%` buttons |
| Convert Scale keys to smooth zoom keys | `Expo Scale` button or Command Palette: `Apply Exponential Scale` |
| Stagger from playhead | `Shift+G` |
| Cascade target keys | `Alt+Shift+G` |
| Repeat key block | `Shift+Y` |
| Ping-pong repeat key block | `Ping-Pong` button or Command Palette: `Ping-Pong Selected Keyframes To Work Out` |
| Offset-loop key block | `Offset` button or Command Palette: `Offset Loop Selected Keyframes To Work Out` |
| Freeze selected values to Work Out | `Freeze` button or Command Palette: `Hold Selected Keyframes To Work Out` |

Interpolation options:

| Option | Use |
| --- | --- |
| Linear | Constant speed |
| Ease In | Slow start |
| Ease Out | Slow end |
| Easy Ease | Smooth start and end |
| Back In / Back Out | Overshoot style |
| Hold | No interpolation; value jumps |

`Ease %` controls both sides of the selected keyframe's interpolation: `0` makes
the timing behave like Linear, `100` is the normal curve, and `200` exaggerates
the curve. `In %` affects the segment ending at the keyframe. `Out %` affects
the segment starting at the keyframe. Use Command Palette commands `Copy
Keyframe Ease` and `Paste Keyframe Ease` when you want the same timing feel on
another selected key or track.

Use `Copy Keyframe Value` and `Paste Keyframe Value` when you want an exact
pose/property value duplicated without moving the target keyframes or changing
their interpolation. The paste command only affects matching track types, so a
copied Position value will not overwrite Rotation, Scale, opacity, camera, or
light keys by mistake.

Use `Copy Pose Keys At Playhead` and `Paste Pose Keys At Playhead` when you want
to reuse a complete Position/Rotation/Scale pose from timeline keys. Copy
requires all three transform keys at the current playhead time. Paste writes all
three keys together at the target time or onto another selected object.

Use `Paste Reversed Keyframes` when you want the same copied motion to play
backward from the playhead. Example: copy keys at `0s` and `2s`, move the
playhead to `5s`, run reverse paste, and the copied `2s` pose lands at `5s`
while the copied `0s` pose lands at `7s`.

Use `Rev Insert` when the destination track already has later keyframes that
must stay intact. It reverse-pastes the copied block, then shifts later
destination keys forward by the copied block length, like an insert edit.

Use marker alignment when you have demo beats. Add markers with `M`, select a
key block, put the playhead near the target beat, then run `Move Keyframes To
Nearest Marker`. The first selected key moves to that marker and the rest of the
selected block keeps its spacing.

Use `Fit CTI` when you want to retime a selected motion block to end exactly at
the playhead/current time indicator. The first selected key stays fixed, the
last selected key moves to the playhead, and intermediate selected keys scale
proportionally.

Use `Bake` when an interpolated active track should become explicit frame
keys. Set Work In/Out around the section, select the track kind, then click
`Bake`. The app samples the track at the current FPS and replaces that track
with editable per-frame keys.

Use `Fit Keyframes Between Neighbor Markers` when the motion must fill a beat
span. Put the playhead between two markers, select at least two keys, and run
the command. The first selected key lands on the previous marker, the last
selected key lands on the next marker, and interior keys stretch proportionally.

Use `50%` and `200%` when the motion shape is correct but the timing is wrong.
Select a block of keys, click `50%` to make the block twice as fast, or click
`200%` to make it twice as slow. The first selected key stays anchored and the
remaining timing columns scale proportionally.

Use `Expo Scale` when a Scale animation should feel like a smooth zoom rather
than a linear size change. Select the first and last Scale keyframes, then run
the assistant. It creates editable frame keys between them using multiplicative
scale steps.

Use `Ping-Pong Selected Keyframes To Work Out` when a motion should bounce back
and forth. Select the source keys, set Work Out after the block, and run the
command. The app repeats the block while alternating reversed copies, similar to
an AE ping-pong loop.

Use `Offset Loop Selected Keyframes To Work Out` when motion should keep moving
instead of restarting. The app repeats the selected block and adds the
end-minus-start value delta on every repeat, similar to AE `loopOut("offset")`.

Use `Hold Selected Keyframes To Work Out` when an object should stop on a pose.
Select the key that should become the still pose, move Work Out to the end of
the still section, and click `Freeze`. The app creates or updates a Work Out key
with the same value and changes the source key to `Hold`.

## 16. Work Area And Playback

Work In and Work Out define the preview/export range.

1. Move playhead to start.
2. Press `B` or `I`.
3. Move playhead to end.
4. Press `N` or `O`.
5. Press `Space` to play or stop.
6. Enable `Loop` to repeat.

`Record WebM` exports the active Work In/Out range.

## 17. Camera Animation

1. Navigate to the first camera view.
2. Choose `Camera Position` in the timeline dropdown.
3. Click `Set Key`.
4. Choose `Camera Target`.
5. Click `Set Key`.
6. Move to another time.
7. Navigate to the second view.
8. Key `Camera Position` and `Camera Target` again.
9. Press `Play`.

Use `Camera Lens` to animate FOV, Near, or Far values.

## 18. Light Animation

1. Choose Sun, Point, or Spot in Lighting.
2. Set the first intensity, color, or position.
3. Choose the matching timeline track.
4. Click `Set Key`.
5. Move the playhead.
6. Change the light value.
7. Click `Set Key` again.

This is useful for showing shadows, highlights, and light-sweep demos.

## 19. Demo And Report Workflow

Recommended report sequence:

1. Run `Evaluation Tour`.
2. Run `Showcase Demo` for a clean visual reference scene.
3. Load the Campus scene if you need the E Hall landscape.
4. Use `Clean View` / `Alt+G` for screenshots without grid/axis clutter.
5. Show Solid, Lines, and Points render modes.
6. Show Position, Rotation, and Scale keyframes in the timeline.
7. Show a camera/frustum or FOV/Near/Far panel.
8. Show material, texture, lighting, shadow, and rendering effects.
9. Show imported GLB/OBJ/STL support.
10. Export screenshots or WebM.

## 20. Troubleshooting

| Problem | Fix |
| --- | --- |
| Grid, axes, or transform arrows look weird | Use `Display > Grid`, `Display > Axes`, or `Alt+G` Clean View |
| Tooltip is distracting while typing | Focus the input/search box; shortcut hover tips are suppressed while typing |
| Cannot see keyframes | Change row filter to `Keyed`, `Selected Keyed`, or `All` |
| Rotation/scale does not animate | Use `Set Pose` for full transform, or key the Rotation/Scale row diamond twice |
| Playback will not stop | Press `K`; `Space` and the Play button also toggle stop |
| Model looks too dark | Try Clay/Anime Toon material, stronger light, shadows, or Clean View |
| Imported OBJ has no texture | Import `.obj`, `.mtl`, and texture images together |
| Scene is blurry after campus/effects | Turn off DOF/SSAO/Bloom or use Clean View |
| Camera is lost | Select object and press `F`, or use `Frame All` |

## 21. Minimum Feature Checklist

Before submission or demo, verify:

- App opens from `Release` through local HTTP.
- Canvas renders within a few seconds.
- Grid and axes can be hidden.
- At least three primitives are visible.
- Solid, Lines, and Points render modes work.
- Transform controls and numeric fields work.
- Position, Rotation, and Scale can be keyframed.
- Timeline play/stop works.
- Camera controls and FOV/Near/Far are visible.
- At least one texture is applied.
- At least one imported model or campus asset loads.
- Lighting and shadows are visible.
- Save JSON and Load JSON restore the scene.
- Screenshot export works.
