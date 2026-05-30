# Timeline Follow Playhead

## Purpose

Follow Playhead keeps the current-time indicator inside the visible dope-sheet
window while scrubbing or playing. This matches the motion-graphics editor habit
of letting the timeline view chase the current edit point, especially after the
user zooms into a short timing span.

## Behavior

- The timeline toolbar exposes a Follow Playhead icon next to the zoom controls.
- The Command Palette exposes the same action as `Toggle Follow Playhead`.
- The button uses `aria-pressed` and an active visual state so the mode is
  visible without consuming extra toolbar text.
- The preference is stored in local storage because it is editor view state, not
  scene data.
- When enabled, playback-time updates and direct time edits scroll the timeline
  only when the playhead approaches the visible edge. Manual scroll position is
  preserved while the playhead remains comfortably visible.

## Architecture

`KeyframeTimelinePanel` owns the behavior because it already adapts
`animation-timeline-js` zoom, scroll, and current-time rendering. The panel uses
public timeline methods:

- `valToPx(time)` converts the current time to timeline pixels.
- `scrollLeft` updates the library's internal scroll container.
- `getClientWidth()` defines the safe visible range.

`main.ts` only exposes the command-palette action and toast feedback. The
scene timeline schema is unchanged.

## Validation

Playwright verifies the command-palette toggle, toolbar `aria-pressed` state,
automatic horizontal scrolling after a zoomed-in jump to the end of the
timeline, and local-storage persistence across reload.
