# Timeline Layer Labels

Layer Labels are AE-style color tags for organizing dense timelines. They are
separate from object material color: changing a layer label only changes the
timeline group swatch, not the 3D object surface.

## User Workflow

1. Select an object layer in the viewport, outliner, or timeline.
2. Click the colored swatch beside the layer name in the timeline group row, or
   run `Cycle Selected Layer Label Color` from the Command Palette.
3. Repeat to cycle through Source, Red, Orange, Yellow, Green, Cyan, Blue,
   Purple, and Pink.

Use layer labels to mark shots, object roles, or animation responsibility while
keeping material colors free for the actual scene.

## Behavior

- Stores the label on each scene object as `layerLabel`.
- Saves and loads the label in scene JSON version 7.
- Defaults older scene files to `Source`, which uses the material color as the
  fallback swatch.
- Preserves layer labels when duplicating an object layer.
- Updates the timeline group swatch without changing render material.

## Implementation

- `editor/layerLabels.ts` owns the label preset list and normalization helpers.
- `editor/types.ts` adds the `LayerLabelId` type and `SceneEntry.layerLabel`.
- `editor/documents.ts` persists `layerLabel` in scene JSON.
- `ui/timelinePanel.ts` renders the label swatch and routes swatch clicks to a
  layer-label callback.
- `main.ts` implements `timeline.cycle-layer-label` and records the operation in
  undo history.

## Validation

`Source/tests/timeline-layer-labels.spec.ts` verifies swatch cycling, Command
Palette cycling, JSON persistence, and duplicate-layer preservation.
