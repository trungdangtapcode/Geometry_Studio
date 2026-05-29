# Timeline Keyframe Cascade

## Purpose

`Cascade` sequences selected target keyframes from the playhead by the current
snap step. It adapts the After Effects "sequence layers" idea to Geometry
Studio's dope sheet: each selected object, camera, or light target moves as a
block, while keys inside that target preserve their internal timing.

## Behavior

- The command works on selected keyframes.
- Keyframes are grouped by target object, camera, or light rig.
- The first target group moves to the current playhead time.
- Each following target group moves one snap step later.
- Multiple selected keys on the same target keep their relative timing.
- If snapping is disabled, the command uses one frame based on the current FPS.
- Locked tracks block the operation through the same safety path as other
  selected-key timing commands.
- Selected keys remain selected after cascading.
- Toolbar command: `Cascade`.
- Keyboard shortcut: `Shift+Alt+G`.

## Workflow

1. Use row filtering, row search, `Set Visible`, or `Select Visible` to select
   keys across multiple targets.
2. Park the playhead at the first desired cascade time.
3. Click `Cascade` or press `Shift+Alt+G`.
4. Adjust the snap step or FPS to change the target-to-target delay.

This complements `Stagger`: Stagger sequences timing columns, while Cascade
sequences target blocks. Use Cascade when several objects start on the same beat
and should ripple outward in object order.

## Testing

The Playwright cascade workflow selects Position keys across multiple visible
objects, parks the playhead at 2 seconds, runs `Shift+Alt+G`, exports scene
JSON, and verifies the object Position tracks are offset by one frame each.
