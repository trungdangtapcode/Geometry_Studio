# Timeline Visible Gap Editing

## Purpose

Visible gap editing adds Premiere/After Effects style timing operations to the
filtered dope sheet:

- `Insert Gap` creates timing room at the playhead.
- `Lift Work` removes the Work In/Out span without closing the timing gap.
- `Extract Work` removes the Work In/Out span and closes the timing gap.

Both commands operate only on currently visible timeline rows, so row search
and row filtering define the edit scope.

## User-Facing Behavior

### Insert Gap

- Toolbar command: `Insert Gap`.
- Uses the current Work In/Out duration as the gap length.
- Shifts visible-row keyframes at or after the playhead later by that duration.
- Skips keyframes that would move beyond the timeline duration.
- Locked visible tracks are skipped.
- Keyboard shortcut: `,`, following the common NLE Insert convention.

### Lift Work

- Toolbar command: `Lift Work`.
- Deletes visible-row keyframes inside Work In/Out.
- Later keyframes keep their original time.
- Locked visible tracks are skipped.
- Keyboard shortcut: `;`, matching the common NLE Lift convention.

### Extract Work

- Toolbar command: `Extract Work`.
- Deletes visible-row keyframes inside Work In/Out.
- Shifts visible-row keyframes after Work Out earlier by the Work In/Out
  duration.
- Skips shifted keyframes if moving them would collide with an earlier
  unselected key.
- Locked visible tracks are skipped.
- Keyboard shortcut: `'`, matching the common NLE Extract convention.

## Scope Rules

The commands use the same row-target pipeline as `Set Visible`, `Select
Visible`, and visible-time copy/cut/delete. Expanded X/Y/Z rows collapse back to
their shared vector track, so one Position X row does not desynchronize the
underlying Position vector keyframes.

Camera, light, object transform, object appearance, and texture tracks all use
the same gap-edit code path.

## Implementation Notes

- `animation/timelineEditing.ts` owns the pure helpers:
  - `insertTimelineGapOnTracks`
  - `liftTimelineRangeOnTracks`
  - `extractTimelineRangeOnTracks`
- `main.ts` resolves visible UI rows into editable timeline tracks, handles
  history, runtime rebuild, selection clearing, and preset-animation cleanup.
- `ui/timelinePanel.ts` only forwards visible row targets to editor callbacks.

The helper result reports affected track count, deleted keyframes, shifted
keyframes, skipped keyframes, current time, and changed transform object IDs.

## Test Coverage

Playwright verifies:

- Position keys can be inserted by a two-second Work In/Out gap at the playhead.
- The graph reflects shifted key times after insertion.
- Extracting the Work In/Out span deletes keys inside the range and shifts
  later keys earlier.
- Lifting the Work In/Out span deletes keys inside the range while keeping
  later keys fixed.
- Comma, semicolon, and quote shortcuts reach the same visible-row edit paths
  as the toolbar buttons.
- The final timing and values persist in exported scene JSON.
