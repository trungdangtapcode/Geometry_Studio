# Timeline Keyframe Stagger

## Purpose

`Stagger` sequences selected keyframe timing columns from the playhead by the
current snap step. It is a compact motion-graphics timing assistant for creating
cascades, offsets, and stepped follow-through timing without dragging each key.

## Behavior

- The command works on selected keyframes.
- Keyframes at the same original time stay grouped as a timing column.
- The first timing column moves to the current playhead time.
- Each following timing column moves one snap step later.
- If snapping is disabled, the command uses one frame based on the current FPS.
- Locked tracks block the operation through the same safety path as other
  selected-key timing commands.
- Selected keys remain selected after staggering.
- Toolbar command: `Stagger`.
- Keyboard shortcut: `Shift+G`.

## Workflow

1. Select keyframes or use `Select Visible` / `Select Time` to create a timing
   selection.
2. Park the playhead at the first desired stagger time.
3. Click `Stagger` or press `Shift+G`.
4. Adjust the timeline snap step or FPS to change the stagger spacing.

This complements Distribute, Fit, and Cascade: Distribute spreads keys across
Work In/Out, Fit proportionally scales existing timing, Stagger creates a tight
ordered sequence of timing columns, and Cascade sequences target blocks.

## Testing

The Playwright stagger workflow creates uneven Position keys, selects them,
parks the playhead at 2 seconds, staggers through the toolbar and `Shift+G`,
and verifies the resulting timing columns are `2`, `2.033`, and `2.067`.
