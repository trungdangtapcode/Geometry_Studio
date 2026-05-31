# Timeline Range Strip Minimize

## Purpose

The timeline overview and object layer range bars are useful for dense edits,
but they consume vertical space on smaller screens. The editor now treats that
area as its own collapsible section instead of requiring the whole timeline dock
to be collapsed.

## Behavior

- The header range-strip button and the inline Overview button minimize only
  the overview navigator and object layer range bars.
- The keyframe toolbar, settings, marker/ruler strip, dope sheet rows, playhead,
  and value graph remain available.
- A compact restore bar is shown while the range strip is minimized so the
  feature is discoverable without expanding the full dock.
- The preference is stored in local storage as
  `geometry-studio-timeline-layer-strip-collapsed`.

## Toolbar Overflow

The timeline command toolbar is intentionally dense. It is horizontally
scrollable, exposes fade indicators when commands are off-screen, and supports:

- vertical mouse wheel over the toolbar to scroll sideways;
- `ArrowLeft` / `ArrowRight` to step through hidden commands when the toolbar is
  focused;
- `Home` / `End` to jump to the first or last toolbar command.

## Validation

Automated coverage lives in `Source/tests/timeline-rendering-controls.spec.ts`.
The focused workflow verifies that minimizing the range strip hides only that
section, increases the usable dope-sheet canvas height, preserves a visible
restore control, and persists across reload.
