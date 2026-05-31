# Timeline Layer Ranges And Overview

## Purpose

Layer timing is a core After Effects workflow. Geometry Studio does not need a
separate layer-stack schema yet because object visibility is already a timeline
track. The current implementation maps layer timing commands onto
`objectVisibility` hold keyframes.

## Commands

- `Layer In` trims the selected object in at the playhead.
- `Layer Out` trims the selected object out at the playhead.
- `Split` duplicates the selected object at the playhead and assigns visibility
  ranges so the original is visible before the split and the new copy is
  visible after the split.
- `Layer Work` sets the Work In/Out range to the selected object's visible
  layer range.
- `Layer Keys` selects every keyframe on the selected object whose time falls
  inside the selected visible layer range.
- `Fit Layer` retimes all unlocked non-Visibility keyframes on the selected
  object so their first and last authored times fit the selected layer range.
- The layer overview strip renders each object as a clickable duration bar
  above the keyframe rows. The bar reads the same Visibility range, so Layer In,
  Layer Out, Split, save/load, and playback stay consistent.
- Drag the middle of a layer bar to move the whole visible range and all
  unlocked non-Visibility object keyframes in time.
- Drag the left or right edge handles to trim the layer in or out directly.
- Alt-drag the left or right edge handle to time-stretch unlocked
  non-Visibility keyframes inside the original layer range into the new range.
  This mirrors the AE habit of changing layer duration while preserving the
  relative timing of the keyed content.
- Keyboard shortcuts:
  - `Alt+[` trims the selected layer in.
  - `Alt+]` trims the selected layer out.
  - `Ctrl/Cmd+Shift+D` splits the selected layer.
  - `Alt+I` jumps to the selected layer in point.
  - `Alt+O` jumps to the selected layer out point.
  - `Alt+Shift+B` sets the work area to the selected layer range.
  - `Alt+Shift+F` fits the selected object's animation keys into the selected
    layer range.
  - `Alt+Shift+K` selects the selected layer's in-range keyframes.

## Data Model

The commands replace the selected object's `objectVisibility` track with hold
keys:

- Layer In at `t`: hidden at `0`, visible at `t`.
- Layer Out at `t`: visible at `0`, hidden at `t`.
- Split at `t`: original visible at `0` then hidden at `t`; duplicate hidden at
  `0` then visible at `t`.

The visibility track remains a normal vector keyframe track using `[1, 0, 0]`
for visible and `[0, 0, 0]` for hidden. Reusing the existing track keeps JSON
persistence, Undo/Redo, row search, graph display, and playback evaluation
consistent with the rest of the timeline system.

Layer range commands read the active visible interval from the selected
object's Visibility track. If the playhead is inside a visible interval, that
interval is used; otherwise the first visible interval is used. Objects without
a Visibility track use the full timeline duration as their layer range.

`Layer Keys` uses the same active visible interval, then selects matching
keyframes from all tracks belonging to the selected object. Boundary keys are
included so layer in/out Visibility keys remain editable with the animation
block. This gives the retiming tools a direct AE-style layer selection target
after sequencing, trimming, or dragging layer bars.

`Fit Layer` uses the selected object's active visible interval as the target
range, then scales every unlocked non-Visibility object keyframe from the
object's first authored key time to its last authored key time. Visibility keys
are not retimed by this command because they define the layer boundaries. This
mirrors a time-stretch workflow: after trimming a layer shorter or longer, the
object's motion, material, and texture keys can be compressed or expanded to fit
the new layer duration.

The overview strip is intentionally a DOM layer above `animation-timeline-js`,
not a custom fork of the library. `animation-timeline-js` remains responsible
for keyed track rows, drag selection, snapping, and playhead rendering. The DOM
strip adds AE-style object timing affordances while keeping the existing
timeline engine intact.

Layer bar trim edits route back through the same `setObjectVisibilityRange()`
helper as the toolbar commands. Layer bar move edits also call
`shiftObjectLayerKeyframes()` before the visibility range is rewritten, so
moving a layer preserves the timing of object animation keys relative to the
layer. Locked tracks and keys that would move outside the timeline are skipped.
This keeps Undo/Redo, locked-track checks, JSON persistence, selected keyframes,
and playback evaluation consistent whether the user edits through buttons,
shortcuts, or direct manipulation.

Alt-drag layer-edge edits call `stretchObjectLayerKeyframesToRange()` before
the Visibility range is rewritten. The stretch maps each unlocked
non-Visibility keyframe inside the original visible range from:

```text
(keyTime - oldIn) / (oldOut - oldIn)
```

to the same normalized position inside the new range. Keys outside the original
range are left untouched. Keys on locked tracks, keys that would collide with
non-stretched keys on the same track, and keys that would move outside the
timeline duration are skipped.

## Constraints

- The selected object must exist.
- Split requires the playhead to be inside the timeline, not at the exact start
  or end.
- A locked Visibility track blocks trim and split commands.
- Existing Visibility keys are replaced because these commands define layer
  in/out ranges rather than adding arbitrary visibility animation.

## Testing

The Playwright workflow verifies the overview strip, trims a layer in and out,
checks that the bar updates to the matching range, drags the right edge to trim
out, drags the bar body to move the visible range, verifies that Position keys
shift with the layer body move, sets the work area to the layer range, jumps to
layer in/out points, trims a sequenced layer shorter, fits its motion keys into
the shorter layer range, selects in-range layer keyframes, exports scene JSON,
verifies hold visibility keys, reloads, splits the layer, verifies both original
and duplicate visibility ranges, clicks the original layer bar, and confirms
object selection changes. The focused layer-stretch workflow verifies
Alt-dragging a layer edge from 4s to 8s maps Position keys at 1s and 3s to 2s
and 6s.
