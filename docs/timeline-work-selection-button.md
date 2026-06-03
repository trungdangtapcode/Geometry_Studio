# Timeline Work Sel Button

## Purpose

`Work Sel` makes the active preview/export range follow the selected keyframe
span. This mirrors a common After Effects workflow: select the action, trim the
work area to that action, then preview or export only that timing region.

## Behavior

- Requires at least one selected keyframe.
- Sets `timeline.workStart` to the first selected key time.
- Sets `timeline.workEnd` to the last selected key time.
- Uses the existing minimum-span guard for one-key selections.
- Reuses the same command path as `Shift+B`.
- Does not start playback; `Preview Sel` remains the button that sets the range
  and immediately plays it.

## Architecture

- `Source/src/main.ts` owns `setTimelineWorkAreaToSelectedKeys` and now exposes
  it as `timeline.work-area-selection`.
- `Source/src/ui/timelinePanel.ts` routes the `Work Sel` button through
  `onSetWorkAreaToSelectedKeyframes`.
- `Source/src/ui/template.ts` places the button beside `Preview Sel` because
  both operate on the selected keyframe span.

## Validation

`tests/timeline-work-selection-button.spec.ts` creates two Position keys,
selects them, clicks `Work Sel`, saves JSON, and verifies `workStart` and
`workEnd` match the selected key times.
