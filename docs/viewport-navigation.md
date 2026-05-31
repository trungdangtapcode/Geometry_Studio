# Viewport Navigation

## Research Basis

Blender's 3D Viewport navigation uses middle-mouse interactions as the primary
camera controls:

- `MMB` drag orbits the view.
- `Shift` + `MMB` drag pans the view.
- `Ctrl` + `MMB` drag or mouse wheel zooms the view.
- Frame Selected and Frame All recover the orbit target when the view gets
  lost or the user wants to inspect a specific object.

Three.js `OrbitControls` defaults are different: left mouse rotates, middle
mouse dollies, and right mouse pans. Geometry Studio keeps the familiar
left-drag orbit fallback for web and trackpad users, then overrides middle
mouse so Blender-style navigation also works.

## Implementation

`Source/src/main.ts` configures `OrbitControls` as:

```ts
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.ROTATE,
  RIGHT: THREE.MOUSE.PAN
};
```

OrbitControls already maps modifier + rotate to panning, so
`Shift + MMB` pans. A capture-phase pointer handler temporarily maps
`Ctrl + MMB` to `THREE.MOUSE.DOLLY`, then resets middle mouse to rotate after
the pointer ends.

Left-button object picking is deferred until pointer-up and ignored when the
pointer moved more than a few pixels. That keeps normal left-drag orbit usable
while preserving click-to-select behavior.

The camera panel also exposes viewport framing commands:

- `Frame Sel` computes the selected object's world-space bounding box,
  preserves the current viewing direction, moves the orbit target to the
  object's bounding center, and places the camera far enough away to fit it.
- `Frame All` computes the visible scene bounds and fits the camera around the
  full scene.
- `F` and `Numpad .` trigger Frame Selected, matching the common 3D-editor
  recovery workflow.

## User Behavior

- Left drag: orbit fallback for normal web viewport use.
- `MMB` drag: orbit around the current target.
- `Shift + MMB` drag: pan.
- `Ctrl + MMB` drag: dolly zoom.
- Mouse wheel: zoom.
- Right drag: pan fallback.
- Left click without dragging: select scene objects.
- `F` / `Numpad .`: frame the selected object.
- `Frame All` button: frame every visible scene object.

## Validation

Automated browser coverage lives in
`Source/tests/viewport-navigation.spec.ts`. The test verifies that middle mouse
drag changes saved camera position without changing selected object, left-drag
orbit remains available, Shift + middle mouse changes the saved camera target,
and Ctrl + middle mouse changes the camera distance to the target. It also
verifies that Frame Selected changes the saved camera target and distance,
supports Undo, and that Frame All expands the view to the full scene.
