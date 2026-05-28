# Timeline Work Area

## Status

Timeline Work In/Out controls are implemented as schema v8. This adds an
After Effects and Premiere style work area around the existing timeline:

- `Work In` defines where playback starts.
- `Work Out` defines where playback loops or stops.
- The Start button jumps to `Work In`.
- Loop playback repeats over the work area instead of the full duration.

## Data Model

Timeline schema v8 adds two scalar fields:

```ts
interface SceneTimelineDocument {
  version: 8;
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
- Pressing Play outside the work area starts from `workStart`.
- Loop mode wraps from `workEnd` back to `workStart`.
- Non-loop mode stops playback at `workEnd`.
- Keyframes remain clamped to the full duration, not the work area.

## Testing

The Playwright timeline workflow verifies that Work In/Out values are editable
and round trip through exported scene JSON.

Recommended manual check:

1. Set Work In to `0.5`.
2. Set Work Out to `4.5`.
3. Press Start and confirm the playhead jumps to `0.5`.
4. Press Play with Loop enabled and confirm playback wraps at `4.5`.
5. Save JSON and verify `timeline.version` is `8`.
