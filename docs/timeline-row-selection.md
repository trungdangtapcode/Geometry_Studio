# Timeline Row Selection

## Status

Timeline row-label selection is implemented for the dope-sheet panel. The left
track label column is now an editing surface, not just static text.

## User-Facing Behavior

- Clicking an object track label selects that object and makes the clicked
  property track active.
- Clicking a camera or light row makes that global track active.
- The active track row is highlighted.
- Disabled tracks are dimmed and use an outlined swatch.
- Toolbar actions such as Add, Copy, Paste, Duplicate, Clear Track, Track
  On/Off, and previous/next keyframe operate on the active row.

## Design Rationale

This follows the same interaction pattern used by dope sheets and compositing
timelines: users choose the property row first, then apply keyframe operations to
that row. It reduces reliance on the track dropdown and makes object, camera,
and light animation easier to scan.

## Testing

The Playwright smoke test verifies that:

- Clicking an object Rotation row updates the active track dropdown.
- The clicked object row receives active styling.
- Clicking the Camera Position row updates the active track dropdown.
- Disabled tracks receive disabled row styling.
