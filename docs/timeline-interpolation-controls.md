# Timeline Interpolation Controls

## Purpose

Motion-graphics editors make timing changes directly accessible. Geometry Studio
now exposes Linear, Ease In, Ease Out, Easy Ease, Back In, Back Out, and Hold
interpolation through direct controls or Command Palette actions instead of only
a hidden data field.

## Behavior

- `Linear` applies straight interpolation to selected keyframes or the active
  playhead keyframe.
- `Ease In` starts slowly and accelerates toward the next keyframe.
- `Ease Out` starts quickly and decelerates toward the next keyframe.
- `Ease` applies smooth interpolation and is the default F9 workflow.
- `Back In` adds anticipation by briefly moving away from the target direction
  before accelerating toward the next keyframe.
- `Back Out` overshoots the next keyframe value and settles back, useful for
  pop, bounce, and product-reveal motion.
- `Hold` keeps the previous value until the next keyframe.
- The compact keyframe editor includes a curve preview that updates with the
  active interpolation mode.
- The dope-sheet key markers use distinct styling for Hold, Ease In, Ease Out,
  Easy Ease, Back In/Out, and Linear so timing intent is visible without opening
  the editor.
- The interpolation dropdown is in the timeline toolbar so the full mode list is
  reachable beside the direct Linear/Ease/Hold buttons.
- Back In and Back Out are available from the interpolation dropdown and Command
  Palette search.
- Interpolation buttons and the dropdown are disabled when there is no selected
  keyframe and no active-track keyframe under the playhead. In that state the UI
  still displays `Linear` as the default mode, but clicking it cannot change a
  key because no keyframe target exists yet.

## Keyboard Shortcuts

- `F9`: apply Easy Ease.
- `Shift+F9`: apply Linear.
- `Ctrl/Cmd+F9`: apply Ease In.
- `Ctrl/Cmd+Shift+F9`: apply Ease Out.
- `Alt+F9`: apply Hold.

The shortcuts use the same command path as the toolbar buttons. If the active
track has a keyframe at the playhead, that playhead key is edited. Otherwise,
the command edits selected keyframes.

Back In and Back Out intentionally have no default keyboard shortcut because
they are lower-frequency motion-design accents. Use the Command Palette and
search `back in`, `back out`, or `overshoot`.

## Architecture

The feature stays inside the existing timeline command boundary:

- `animation/timelineInterpolation.ts` owns the supported interpolation values,
  labels, preview paths, and runtime easing weights.
- `ui/timelinePanel.ts` owns button state, preview path rendering, and dropdown
  synchronization.
- `main.ts` owns shortcut dispatch and timeline mutation through
  `setTimelineInterpolation`.
- The timeline schema keeps the same interpolation field but now accepts the
  expanded value set: `linear`, `easeIn`, `easeOut`, `smooth`, `backIn`,
  `backOut`, and `hold`.

## Testing

The browser suite verifies that:

- Linear, Ease In, Ease Out, Easy Ease, Back In, Back Out, and Hold controls are
  visible through toolbar/dropdown/command coverage.
- The easing preview is visible.
- Applying Easy Ease through the toolbar updates the active button and preview.
- Applying Ease In and Ease Out changes runtime interpolation at the segment
  midpoint.
- Applying Back Out creates visible overshoot during playback and persists
  `backOut` in scene JSON.
- Saved scene JSON persists the resulting `smooth` interpolation value.
