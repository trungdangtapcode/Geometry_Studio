# Timeline Work Area

## Status

Timeline Work In/Out controls were added in schema v8 and remain supported in
current schema v10. This adds an
After Effects and Premiere style work area around the existing timeline:

- `Work In` defines where playback starts.
- `Work Out` defines where playback loops or stops.
- The Start button jumps to `Work In`.
- The Out button jumps to `Work Out`.
- `B` sets Work In to the current playhead time.
- `N` sets Work Out to the current playhead time.
- `I` also sets Work In to the current playhead time.
- `O` also sets Work Out to the current playhead time.
- `Shift+B` fits Work In/Out to the currently selected timeline keyframes.
- `Select Work` selects active-track keyframes inside Work In/Out.
- `Preview Sel` fits Work In/Out to selected keyframes, jumps to the first
  selected key, and starts playback.
- `Shift+Space` runs the same selected-range preview.
- `Ctrl+Shift+A` / `Cmd+Shift+A` runs the same work-area selection command.
- Loop playback repeats over the work area instead of the full duration.
- The timeline header shows a draggable work-area band. Drag either edge to
  trim Work In/Out, or drag the body to move the range without changing its
  length.
- The timeline header has a dedicated range-strip toggle that hides only the
  overview navigator and object layer bars. The main keyframe rows stay visible,
  and a compact restore bar stays visible, which keeps the timeline usable on
  short screens without hiding the whole dock.

## Data Model

Timeline schema v8 added two scalar fields, still present in schema v11:

```ts
interface SceneTimelineDocument {
  version: 11;
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
- Pressing `B` / `I` or `N` / `O` updates the work area edge with timeline
  snapping applied.
- Dragging the visible work-area edge updates the same fields with timeline
  snapping applied.
- Dragging the visible work-area body moves `workStart` and `workEnd` together
  while preserving the range length.
- `Shift` clicking the timeline ruler scrub lane sets `workStart` at the
  clicked time.
- `Alt` clicking the timeline ruler scrub lane sets `workEnd` at the clicked
  time.
- Pressing `Shift+B` reads the selected keyframe times and sets the work area to
  the selected span. A one-key selection creates a minimum visible span using
  the snap step or one frame.
- Pressing `Preview Sel` or `Shift+Space` uses the same selected span, moves the
  playhead to its start, and starts forward playback at `1x`.
- Pressing `Ctrl+Shift+A` / `Cmd+Shift+A` selects keyframes on the active track
  whose times are inside the current Work In/Out range. This keeps range-based
  edit operations scoped to the same track model as `Ctrl+A`.
- Pressing Play outside the work area starts from `workStart`.
- Loop mode wraps from `workEnd` back to `workStart`.
- Non-loop mode stops playback at `workEnd`.
- Keyframes remain clamped to the full duration, not the work area.

## Testing

The Playwright timeline workflows verify that Work In/Out values are editable,
keyboard-settable with `B`/`N` and `I`/`O`, fit to selected keys with
`Shift+B`, selectable with `Select Work` and `Ctrl+Shift+A`, previewed with
`Preview Sel` and `Shift+Space`, directly draggable in the timeline header, and
round trip through exported scene JSON.

Recommended manual check:

1. Set Work In to `0.5`.
2. Set Work Out to `4.5`.
3. Press Start and confirm the playhead jumps to `0.5`.
4. Move the playhead, press `B` or `I`, and confirm Work In follows it.
5. Move the playhead, press `N` or `O`, and confirm Work Out follows it.
6. Drag the work-area band body and confirm Work In/Out move together.
7. Select several keyframes, press `Shift+B`, and confirm the work area wraps
   the selected key span.
8. Press `Ctrl+Shift+A` and confirm only active-track keys inside Work In/Out
   are selected.
9. Press `Preview Sel` and confirm playback starts from the selected span.
10. Press Play with Loop enabled and confirm playback wraps at `4.5`.
11. Use the range-strip toggle and confirm the overview/layer bars hide while
    the keyframe rows remain usable.
12. Save JSON and verify `timeline.version` is `10`.
