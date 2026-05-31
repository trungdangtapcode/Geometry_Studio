# Timeline Time Display

## Purpose

The timeline now supports a selectable time display mode so animation can be
authored in the same units the user is thinking in. This is useful when matching
course demos, frame-accurate animation beats, or second-based physical motion.

## Modes

- `Timecode`: readout and ruler use `MM:SS:FF`, with the absolute frame count
  still shown beside the playhead readout.
- `Frames`: readout and ruler prioritize absolute frame numbers such as
  `F0045`.
- `Seconds`: readout and ruler prioritize seconds such as `1.5s`.

The selected mode is stored in local storage as an editor preference. Scene JSON
still stores timeline values as seconds, so switching display modes does not
change saved animation data.

## Implementation

`ui/timelineTimeDisplay.ts` owns formatter functions for readouts, ruler ticks,
frames, and timecode. `ui/timelinePanel.ts` owns the persisted display mode and
feeds the formatter into `animation-timeline-js` through `_formatUnitsText`.

The same active FPS used by frame stepping and snapping is used by the timecode
and frame-number formatter.

## Test Coverage

Playwright verifies that:

- the default display is Timecode;
- `45f` at 30 FPS shows `00:01:15 | F0045`;
- Frames mode shows `F0045 | 1.5s`;
- Seconds mode shows `1.5s | F0045`;
- the selected display mode persists after reload.
