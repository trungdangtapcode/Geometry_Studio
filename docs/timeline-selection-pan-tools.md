# Timeline Selection And Pan Tools

## Purpose

The dope sheet now exposes explicit Selection and Pan tools, similar to
After Effects' Selection and Hand tools. Earlier keyframe selection depended on
hidden default canvas behavior from `animation-timeline-js`; the UI now makes
that behavior visible, keyboard-addressable, and testable.

## Standing On Existing Work

`animation-timeline-js` already provides production-ready interaction modes:

- `TimelineInteractionMode.Selection` supports direct keyframe selection and
  drag-box marquee selection on the canvas.
- `TimelineInteractionMode.Pan` turns canvas dragging into timeline navigation
  while preserving the library's built-in timeline model and scroll handling.
- The library also handles selected-keyframe rendering, hit testing, drag
  events, scroll synchronization, and selection events.

Geometry Studio keeps those responsibilities inside the library and only adds a
thin editor adapter in `KeyframeTimelinePanel`.

## Behavior

- `V` activates the Timeline Selection Tool.
- `H` activates the Timeline Pan Tool.
- The toolbar exposes icon buttons for both tools near the zoom controls.
- The Command Palette exposes `Timeline Selection Tool` and `Timeline Pan Tool`.
- Active tool buttons use `aria-pressed` and the shared active button style.
- Selection mode keeps the dope sheet ready for keyframe clicks and marquee
  selection.
- Pan mode is for navigating dense timeline regions after zooming into long
  edits.

## Architecture

`KeyframeTimelinePanel` owns the active dope-sheet tool state:

- `setDopeSheetTool("selection")` maps to
  `TimelineInteractionMode.Selection`.
- `setDopeSheetTool("pan")` maps to `TimelineInteractionMode.Pan`.
- The panel synchronizes button active states and stores the current tool in
  `data-timeline-tool` for styling/debugging.

`main.ts` only provides command-palette commands, keyboard shortcuts, and toast
feedback. The scene document schema is unchanged because the active edit tool is
editor UI state, not project data.

## Validation

The Playwright smoke flow verifies that the Selection and Pan buttons are
visible, that Selection is the default, and that both toolbar and command
palette actions update `aria-pressed`. Browser validation should also exercise
drag-box keyframe selection inside the dope sheet after creating several
position, rotation, or scale keys.
