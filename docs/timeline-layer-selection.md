# Timeline Layer Selection

Layer Selection commands provide AE-style keyboard navigation through the current
object layer stack. They complement layer ordering: after arranging layers, you
can step through them without using the mouse.

## User Workflow

1. Select any object layer.
2. Press `Alt+ArrowDown` to select the next layer below it.
3. Press `Alt+ArrowUp` to select the previous layer above it.
4. Press `Alt+Home` to select the first/top layer.
5. Press `Alt+End` to select the last/bottom layer.
6. The same actions are available from the Command Palette:
   - `Select Previous Layer`
   - `Select Next Layer`
   - `Select First Layer`
   - `Select Last Layer`

The viewport selection outline, outliner active row, inspector, and timeline
active layer update together.

## Behavior

- Uses the same layer order as the outliner, timeline, scene JSON, and layer
  sequencing commands.
- Does not record undo history because it is a selection change, not a scene
  edit.
- Stops at the first or last layer and reports a toast instead of wrapping.
- Supports both one-step navigation and direct boundary jumps.
- Works after layer reordering because it reads the current entry order.

## Implementation

- `editor/layerOrder.ts` exposes `adjacentLayerId()` so stack movement and stack
  selection use the same order semantics.
- `main.ts` exposes `timeline.select-previous-layer`,
  `timeline.select-next-layer`, `timeline.select-first-layer`, and
  `timeline.select-last-layer`, plus `Alt+ArrowUp`, `Alt+ArrowDown`,
  `Alt+Home`, and `Alt+End` shortcuts.

## Validation

`Source/tests/timeline-layer-selection.spec.ts` verifies Command Palette
selection, keyboard one-step selection, and keyboard boundary selection through
the default layer stack.
