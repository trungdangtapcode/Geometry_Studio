# Timeline Loop Assistant Buttons

## Purpose

Cycle, Ping-Pong, Offset Loop, and Freeze are core keyframe-assistant actions.
They should be visible in the timeline toolbar instead of requiring users to
discover every workflow through the Command Palette.

## Behavior

- `Cycle` repeats the selected timing block forward until Work Out.
- `Ping-Pong` repeats the block while alternating reversed copies.
- `Offset` repeats the block while accumulating the end-minus-start value delta.
- `Freeze` holds the latest selected key value through Work Out.

All four buttons call the same command handlers used by shortcuts and the
Command Palette. The buttons do not own timeline mutation logic.

## Architecture

- `Source/src/ui/template.ts` owns button markup.
- `Source/src/ui/timelinePanel.ts` translates button clicks into callbacks.
- `Source/src/main.ts` maps those callbacks to the existing keyframe-assistant
  handlers and shortcut tooltip metadata.
- `Source/src/animation/timelineEditing.ts` remains the only layer that mutates
  timeline document data for these assistants.

## Validation

- `tests/timeline-ping-pong.spec.ts` uses the visible `Ping-Pong` button and
  verifies generated JSON timing.
- `tests/timeline-offset-loop.spec.ts` uses the visible `Offset` button and
  verifies accumulated values.
- `tests/timeline-hold-work-out.spec.ts` uses the visible `Freeze` button and
  verifies Hold interpolation at Work Out.
