# Timeline Layer Order

Layer Order is an AE-style stack control for arranging object layers in the
outliner and timeline. It is editor structure, not a transform: moving a layer
up or down does not move the 3D object, change keyframes, or alter parenting.

## User Workflow

1. Select an object layer in the viewport, outliner, or timeline.
2. Run one of these Command Palette actions:
   - `Move Selected Layer Up`
   - `Move Selected Layer Down`
   - `Move Selected Layer To Top`
   - `Move Selected Layer To Bottom`
3. Use `Alt+PageUp` and `Alt+PageDown` for quick one-step stack movement.

The outliner and timeline update immediately. The selected object remains
selected.

## Behavior

- Reorders the shared scene entry list used by the outliner, timeline labels,
  layer sequencing, and scene JSON save order.
- Saves the new layer order automatically because scene objects are serialized
  in current entry order.
- Preserves selected object, parent links, layer labels, layer comments,
  timeline tracks, and keyframes.
- Records the move in undo history.
- Applies a matching `renderOrder` hint to object roots for deterministic
  transparent-object layering.

## Implementation

- `editor/layerOrder.ts` owns the pure reorder helper.
- `main.ts` exposes `timeline.move-layer-up`,
  `timeline.move-layer-down`, `timeline.move-layer-top`, and
  `timeline.move-layer-bottom`.
- Existing outliner/timeline rendering uses `entries.values()`, so the updated
  map order drives both views without duplicating order state.

## Validation

`Source/tests/timeline-layer-order.spec.ts` moves the selected layer up, to the
top, and down through the Command Palette, then saves scene JSON and verifies
that object order persisted.
