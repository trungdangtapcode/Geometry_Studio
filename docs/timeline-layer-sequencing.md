# Timeline Layer Sequencing

## Purpose

Layer sequencing turns multiple object visibility ranges into a continuous
ordered edit from the current playhead. This follows the same workflow idea as
After Effects' Sequence Layers command: arrange selected layers in time without
manually dragging every layer bar.

## Behavior

- The command sequences all scene objects in outliner insertion order.
- Sequencing starts at the current playhead, snapped with the active timeline
  snap settings.
- Each object keeps its existing layer duration when possible.
- Object keyframes move with the layer when their track is not locked and the
  shifted times remain inside the timeline duration.
- Visibility tracks are rewritten as layer in/out keys.
- The timeline duration expands up to the project maximum when the sequenced
  layer stack needs more time.
- Work In/Out is updated to the sequenced range for immediate preview.
- `Fit Layer` can be used after trimming a sequenced layer shorter or longer to
  time-stretch the selected object's animation keys into that layer range.
- `Layer Keys` can be used after sequencing to select the newly in-range
  Visibility keys plus any moved object animation keys for one layer.

Locked visibility tracks are skipped. Locked or out-of-range property keys are
not shifted, and the toast message reports skipped layer/key counts.

## Access

- Timeline toolbar: `Sequence`
- Timeline toolbar: `Fit Layer`
- Timeline toolbar: `Layer Keys`
- Command Palette: `Sequence Object Layers`
- Command Palette: `Fit Selected Layer Keyframes`
- Command Palette: `Select Selected Layer Keyframes`
- Shortcut: `Alt+Shift+F`
- Shortcut: `Alt+Shift+K`
- Shortcut: `Alt+Shift+L`

The toolbar button is intentionally short because the timeline already carries
many AE-style editing controls. The tooltip and command palette use the full
`Sequence Object Layers`, `Fit Selected Layer Keyframes`, and
`Select Selected Layer Keyframes` wording.

## Architecture Notes

The implementation is split between:

- `animation/timelineLayers.ts`, which owns pure timeline document edits through
  `sequenceObjectLayerRanges`, `fitObjectLayerKeyframesToRange`, and
  `objectLayerKeyframeIds`.
- `main.ts`, which records undo history, applies runtime scene updates, selects
  generated visibility keys, and reports editor feedback.
- `ui/timelinePanel.ts`, which only owns the toolbar event binding.

This keeps sequencing testable as document logic and avoids embedding layer
timing math inside UI rendering code.

## Testing

The Playwright workflow verifies the toolbar button, sequences the default
object layers into `0-8`, `8-16`, and `16-24`, confirms that Work In/Out expands
to the full range, checks persisted Visibility keys, and verifies that baked
Rotation and Scale keys move with their object layers. It also verifies that
`Fit Layer` compresses the selected object's motion keys into a shortened layer
range, and that `Layer Keys` selects the sequenced layer's visibility and
animation keys as a single retiming target.
