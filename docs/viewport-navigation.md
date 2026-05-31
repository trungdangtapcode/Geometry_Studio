# Viewport Navigation

## Research Basis

Blender's 3D Viewport navigation uses middle-mouse interactions as the primary
camera controls:

- `MMB` drag orbits the view.
- `Shift` + `MMB` drag pans the view.
- `Ctrl` + `MMB` drag or mouse wheel zooms the view.

Three.js `OrbitControls` defaults are different: left mouse rotates, middle
mouse dollies, and right mouse pans. Geometry Studio overrides the mouse button
mapping so the viewport feels closer to Blender while keeping left click free
for object selection.

## Implementation

`Source/src/main.ts` configures `OrbitControls` as:

```ts
controls.mouseButtons = {
  LEFT: null,
  MIDDLE: THREE.MOUSE.ROTATE,
  RIGHT: THREE.MOUSE.PAN
};
```

OrbitControls already maps modifier + rotate to panning, so
`Shift + MMB` pans. A capture-phase pointer handler temporarily maps
`Ctrl + MMB` to `THREE.MOUSE.DOLLY`, then resets middle mouse to rotate after
the pointer ends.

Left-button object picking now ignores non-left buttons, so middle mouse
navigation does not accidentally select objects.

## User Behavior

- `MMB` drag: orbit around the current target.
- `Shift + MMB` drag: pan.
- `Ctrl + MMB` drag: dolly zoom.
- Mouse wheel: zoom.
- Right drag: pan fallback.
- Left click: select scene objects.

## Validation

Automated browser coverage lives in
`Source/tests/viewport-navigation.spec.ts`. The test verifies that middle mouse
drag changes saved camera position without changing selected object, Shift +
middle mouse changes the saved camera target, and Ctrl + middle mouse changes
the camera distance to the target.
