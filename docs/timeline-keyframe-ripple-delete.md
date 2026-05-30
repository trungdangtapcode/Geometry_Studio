# Timeline Keyframe Ripple Delete

## Purpose

Ripple Delete removes selected keyframes and closes the timing gap on the
affected tracks. It is the first implemented slice of clip-style ripple editing
from the timeline research plan, focused on keyframe timing instead of full
layer clips.

## User-Facing Behavior

- Toolbar command: `Ripple Del`.
- Keyboard command: `Shift+Delete` or `Shift+Backspace`.
- If keyframes are selected, the selected time span is deleted.
- If no keyframe is selected, the command uses the keyframe under the playhead
  on the active track.
- Later keyframes on the same affected tracks shift earlier by the deleted
  duration.
- A single selected key deletes one snap/frame interval, using the larger of
  timeline snap step and frame duration.
- Locked tracks block the operation through the shared keyframe lock check.
- The operation creates one undo history entry.

## Timing Rules

The command computes one global selected range:

```ts
start = min(selectedKeyTimes)
end = max(selectedKeyTimes)
gap = max(end - start, snapStep, 1 / fps)
```

Selected keyframes are removed only from tracks containing selected sources.
For each affected track, non-selected keys after `end` shift by `gap`. Keys at
or before `end` stay fixed. If a shifted key would collide with an unselected
key already occupying the target time, that shifted key is skipped and remains
at its original time.

This keeps ripple delete deterministic and track-scoped. It avoids modifying
unrelated object, camera, or light tracks.

## Workflow

1. Select an object, camera, or light timeline track.
2. Add at least three keyframes, for example at `0s`, `2s`, and `4s`.
3. Select the middle timing block or range in the graph/dope sheet.
4. Click `Ripple Del` or press `Shift+Delete`.
5. Scrub the timeline to verify later keys moved earlier and the gap closed.

## Implementation Notes

- `animation/timelineEditing.ts` owns the pure `rippleDeleteResolvedKeyframes`
  operation.
- `main.ts` handles history, preset-animation clearing, runtime rebuild, and UI
  refresh.
- `ui/timelinePanel.ts` exposes the toolbar callback but keeps the edit logic
  out of the UI layer.
- The result reports `deleted`, `shifted`, `skipped`, `currentTime`, and
  changed transform object IDs for the same runtime cleanup used by other
  timeline edit operations.

## Testing

Playwright verifies a multi-key Position workflow:

- Create Position X keys at `0s`, `2s`, `4s`, and `6s`.
- Select keys at `2s` and `4s`.
- Run Ripple Delete.
- Confirm the saved scene contains Position keys at `0s` and `4s`, with the
  former `6s` value shifted to `4s`.
- Confirm Undo restores the original timing.
