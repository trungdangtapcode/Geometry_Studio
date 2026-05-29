# Timeline Work Area

## Status

Timeline Work In/Out controls were added in schema v8 and remain supported in
current schema v9. This adds an
After Effects and Premiere style work area around the existing timeline:

- `Work In` defines where playback starts.
- `Work Out` defines where playback loops or stops.
- The Start button jumps to `Work In`.
- The Out button jumps to `Work Out`.
- `B` sets Work In to the current playhead time.
- `N` sets Work Out to the current playhead time.
- `Shift+B` fits Work In/Out to the currently selected timeline keyframes.
- Loop playback repeats over the work area instead of the full duration.

## Data Model

Timeline schema v8 added two scalar fields, still present in schema v9:

```ts
interface SceneTimelineDocument {
  version: 9;
  duration: number;
  workStart: number;
  workEnd: number;
}
```

Normalization clamps both values to the timeline duration. Invalid ranges fall
back to the full timeline.

## Runtime Rules

- Manual scrubbing can still visit the full timeline duration.
- Pressing Start moves the playhead to `workStart`.
- Pressing Out moves the playhead to `workEnd`.
- Pressing `B` or `N` updates the work area edge with timeline snapping
  applied.
- Pressing `Shift+B` reads the selected keyframe times and sets the work area to
  the selected span. A one-key selection creates a minimum visible span using
  the snap step or one frame.
- Pressing Play outside the work area starts from `workStart`.
- Loop mode wraps from `workEnd` back to `workStart`.
- Non-loop mode stops playback at `workEnd`.
- Keyframes remain clamped to the full duration, not the work area.

## Testing

The Playwright timeline workflows verify that Work In/Out values are editable,
keyboard-settable with `B` and `N`, fit to selected keys with `Shift+B`, and
round trip through exported scene JSON.

Recommended manual check:

1. Set Work In to `0.5`.
2. Set Work Out to `4.5`.
3. Press Start and confirm the playhead jumps to `0.5`.
4. Move the playhead, press `B`, and confirm Work In follows it.
5. Move the playhead, press `N`, and confirm Work Out follows it.
6. Select several keyframes, press `Shift+B`, and confirm the work area wraps
   the selected key span.
7. Press Play with Loop enabled and confirm playback wraps at `4.5`.
8. Save JSON and verify `timeline.version` is `9`.
