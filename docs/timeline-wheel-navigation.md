# Timeline Wheel Navigation

## Purpose

AE-style timeline work depends on fast navigation. Toolbar zoom buttons are
useful, but dense keyframe editing also needs direct wheel and trackpad
gestures inside the dope sheet.

## Behavior

- `Alt` + wheel zooms the timeline around the cursor.
- `Ctrl` / `Cmd` + wheel also zooms around the cursor, matching the underlying
  `animation-timeline-js` convention.
- `Shift` + wheel pans horizontally.
- Horizontal trackpad wheel deltas pan horizontally without an extra modifier.
- Plain vertical wheel keeps the existing vertical row scroll behavior.

The zoom anchor is the timeline time under the pointer before the wheel event.
After zooming, the panel restores that same time under the pointer so the edit
context does not drift.

## Implementation

`Source/src/ui/timelinePanel.ts` binds a capture-phase wheel listener to the
`animation-timeline-js` scroll container after each render. The handler only
intercepts zoom or horizontal pan gestures. Normal vertical scrolling remains
owned by the library.

The implementation keeps `animation-timeline-js` as the dope-sheet engine and
uses its public `getZoom`, `setZoom`, `valToPx`, `pxToVal`, and `scrollLeft`
APIs instead of replacing the component.

## Validation

Automated browser coverage lives in
`Source/tests/timeline-wheel-navigation.spec.ts`. The test verifies that:

- `Alt` + wheel changes the timeline zoom level.
- The zoom creates horizontal overflow on a long timeline.
- `Shift` + wheel pans the dope sheet horizontally.
- Native horizontal trackpad-style wheel deltas also pan horizontally.
