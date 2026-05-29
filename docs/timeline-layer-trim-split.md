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
- The layer overview strip renders each object as a clickable duration bar
  above the keyframe rows. The bar reads the same Visibility range, so Layer In,
  Layer Out, Split, save/load, and playback stay consistent.
- Keyboard shortcuts:
  - `Alt+[` trims the selected layer in.
  - `Alt+]` trims the selected layer out.
  - `Ctrl/Cmd+Shift+D` splits the selected layer.
  - `Alt+I` jumps to the selected layer in point.
  - `Alt+O` jumps to the selected layer out point.
  - `Alt+Shift+B` sets the work area to the selected layer range.

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

The overview strip is intentionally a DOM layer above `animation-timeline-js`,
not a custom fork of the library. `animation-timeline-js` remains responsible
for keyed track rows, drag selection, snapping, and playhead rendering. The DOM
strip adds AE-style object timing affordances while keeping the existing
timeline engine intact.

## Constraints

- The selected object must exist.
- Split requires the playhead to be inside the timeline, not at the exact start
  or end.
- A locked Visibility track blocks trim and split commands.
- Existing Visibility keys are replaced because these commands define layer
  in/out ranges rather than adding arbitrary visibility animation.

## Testing

The Playwright workflow verifies the overview strip, trims a layer in and out,
checks that the bar updates to the matching range, sets the work area to the
layer range, jumps to layer in/out points, exports scene JSON, verifies hold
visibility keys, reloads, splits the layer, verifies both original and
duplicate visibility ranges, clicks the original layer bar, and confirms object
selection changes.
