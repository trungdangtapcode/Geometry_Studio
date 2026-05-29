# Timeline Interpolation Controls

## Purpose

Motion-graphics editors make timing changes directly accessible. Geometry Studio
now exposes Linear, Easy Ease, and Hold interpolation as first-class timeline
toolbar buttons instead of only a dropdown setting.

## Behavior

- `Linear` applies straight interpolation to selected keyframes or the active
  playhead keyframe.
- `Ease` applies smooth interpolation and is the default F9 workflow.
- `Hold` keeps the previous value until the next keyframe.
- The compact keyframe editor includes a curve preview that updates with the
  active interpolation mode.
- The interpolation dropdown remains available and stays synchronized with the
  direct buttons.

## Keyboard Shortcuts

- `F9`: apply Easy Ease.
- `Shift+F9`: apply Linear.
- `Alt+F9`: apply Hold.

The shortcuts use the same command path as the toolbar buttons. They edit
selected keyframes first; if no keyframe is selected, they edit the keyframe at
the playhead on the active track.

## Architecture

The feature stays inside the existing timeline command boundary:

- `ui/timelinePanel.ts` owns button state, preview path rendering, and dropdown
  synchronization.
- `main.ts` owns shortcut dispatch and timeline mutation through
  `setTimelineInterpolation`.
- The timeline schema is unchanged because interpolation already exists on each
  keyframe.

## Testing

The browser smoke suite verifies that:

- Linear, Ease, and Hold controls are visible.
- The easing preview is visible.
- Applying Easy Ease through the toolbar updates the active button and preview.
- Saved scene JSON persists the resulting `smooth` interpolation value.
