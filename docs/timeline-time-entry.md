# Timeline Time Entry

## Purpose

The timeline time fields now accept editor-style expressions instead of only
plain seconds. This keeps quick timing edits close to After Effects and Premiere
habits while preserving the existing seconds-based scene JSON schema.

## Supported Formats

- Plain seconds: `2`, `2.5`
- Seconds with suffix: `2s`, `2.5sec`
- Frames at the active FPS: `45f`, `120 frames`
- Timecode: `00:00:02:15` means 2 seconds and 15 frames.
- Short timecode: `1:02:15` means 1 minute, 2 seconds, and 15 frames.
- Minute/second entry: `1:30` means 1 minute and 30 seconds.
- Relative offsets: `+10f`, `-5f`, `+1s`

The parser uses the current timeline FPS field. Invalid entries restore the
last valid displayed value rather than writing `NaN` into the timeline.

## Implementation

`ui/timelineTimeInput.ts` owns parsing and help text. `ui/timelinePanel.ts`
uses it for Time, Duration, Work In, and Work Out. Parsed values still flow
through the existing timeline callbacks, so `main.ts` remains responsible for
clamping Duration to the project limits and Work In/Out to the valid preview
range.

This keeps the feature UI-focused and avoids changing saved scene data.

## Test Coverage

The Playwright timeline workflow verifies:

- `45f` at 30 FPS moves the playhead to `1.5` seconds.
- `+15f` moves relative to the current playhead.
- `00:00:01:15` sets Work In to `1.5`.
- `0:03` sets Work Out to `3`.
- `300f` sets Duration to `10`.
- Invalid text restores the previous valid time.
