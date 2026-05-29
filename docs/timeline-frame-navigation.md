# Timeline Frame Navigation

## Status

Frame navigation is implemented as an editing ergonomics upgrade on top of
schema v9. It does not change the saved timeline document because frame stepping
is derived from the existing `fps`, `currentTime`, `workStart`, and `workEnd`
fields.

## User-Facing Behavior

- `Start` jumps to Work In.
- `Out` jumps to Work Out.
- Previous Frame subtracts `1 / fps` seconds from the current playhead time.
- Next Frame adds `1 / fps` seconds to the current playhead time.
- Time is clamped to the full timeline duration.
- The timecode label shows both SMPTE-style time and absolute frame number:
  `MM:SS:FF | F0000`.
- Keyboard navigation is available when focus is outside text fields:
  Left/Right step one frame, Shift+Left/Right jump between keyframes, Home jumps
  to Work In, End jumps to Work Out, B sets Work In, N sets Work Out, and
  Shift+B fits Work In/Out to selected keyframes.

This mirrors the practical editing pattern used in video and motion graphics
tools: rough navigation by work area, precise navigation by frame, and keyframe
navigation for authored animation points.

## Implementation Notes

The UI lives in `ui/timelinePanel.ts` and delegates frame stepping to `main.ts`
through `onStepFrame(direction)`. Keeping the step calculation in `main.ts`
avoids duplicating ownership of the timeline document in the panel.

Keyboard shortcuts live in the global `handleKeyboard` path in `main.ts`. The
handler ignores `input` and `select` elements so editing numeric values,
duration, FPS, and track kind remains predictable.

The timecode formatter uses:

```ts
absoluteFrame = round(currentTime * fps)
frameStep = 1 / fps
```

The numeric time field still displays compact seconds for quick editing. The
timecode label is the frame-accurate readout.

## Testing

The Playwright smoke test verifies:

- The timecode starts at frame zero.
- Previous/next frame buttons are visible.
- Next Frame advances the timeline.
- Previous Frame returns the playhead to frame zero.

Manual check:

1. Set FPS to `24`, `30`, or `60`.
2. Press Next Frame several times.
3. Confirm the absolute frame counter increments by one.
4. Press Start and Out to jump between Work In and Work Out.
5. Use Left, Right, Home, and End from the keyboard and confirm they match the
   visible timeline controls.
