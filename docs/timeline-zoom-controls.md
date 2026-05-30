# Timeline Zoom Controls

## Purpose

The timeline uses `animation-timeline-js` zoom primitives for dense keyframe
editing. Keyboard zooming keeps the user in the same editing flow while
retiming, stretching, or inspecting keys.

## Behavior

- `+` or `=` zooms the timeline in.
- `-` zooms the timeline out.
- `0` fits the full timeline duration to the visible dock width.
- `Shift+0` fits the view around selected or playhead keyframes.
- The toolbar zoom buttons use the same public panel methods as the keyboard
  shortcuts.
- The command refreshes the timeline canvas after changing zoom so row labels,
  scroll state, and keyframe hit targets stay aligned.

## Testing

The Playwright smoke workflow verifies that keyboard zoom-in increases the
timeline canvas width, keyboard zoom-out decreases it, and the fit command is
available from the same toolbar surface. The Command Palette workflow verifies
that Fit Selected Keyframes is disabled without a keyframe target and zooms the
timeline after a keyframe is set.
