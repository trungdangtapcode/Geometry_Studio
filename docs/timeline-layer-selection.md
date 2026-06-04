# Timeline Layer Selection

Layer Selection commands provide AE-style keyboard navigation through the current
object layer stack. They complement layer ordering: after arranging layers, you
can step through them without using the mouse.

## User Workflow

1. Select any object layer.
2. Press `Alt+ArrowDown` to select the next layer below it.
3. Press `Alt+ArrowUp` to select the previous layer above it.
4. The same actions are available from the Command Palette:
   - `Select Previous Layer`
   - `Select Next Layer`

The viewport selection outline, outliner active row, inspector, and timeline
active layer update together.

## Behavior

- Uses the same layer order as the outliner, timeline, scene JSON, and layer
  sequencing commands.
- Does not record undo history because it is a selection change, not a scene
  edit.
- Stops at the first or last layer and reports a toast instead of wrapping.
- Works after layer reordering because it reads the current entry order.

## Implementation

- `editor/layerOrder.ts` exposes `adjacentLayerId()` so stack movement and stack
  selection use the same order semantics.
- `main.ts` exposes `timeline.select-previous-layer` and
  `timeline.select-next-layer`, plus `Alt+ArrowUp` and `Alt+ArrowDown`
  shortcuts.

## Validation

`Source/tests/timeline-layer-selection.spec.ts` verifies Command Palette
selection and keyboard selection through the default layer stack.
