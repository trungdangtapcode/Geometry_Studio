# Timeline Frame Navigation

## Status

Frame navigation is implemented as an editing ergonomics upgrade on top of
schema v8. It does not change the saved timeline document because frame stepping
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

This mirrors the practical editing pattern used in video and motion graphics
tools: rough navigation by work area, precise navigation by frame, and keyframe
navigation for authored animation points.

## Implementation Notes

The UI lives in `ui/timelinePanel.ts` and delegates frame stepping to `main.ts`
through `onStepFrame(direction)`. Keeping the step calculation in `main.ts`
avoids duplicating ownership of the timeline document in the panel.

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
