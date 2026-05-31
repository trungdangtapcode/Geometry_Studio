# AE-Style Parent And Link

## Purpose

After Effects uses parenting and Null Objects to control several layers from one
transform. Geometry Studio now has the same core workflow for 3D scene objects:
select an object, assign a parent layer, or create a Null Controller and parent
the selected object to it.

## Controls

- `Parent` dropdown: choose `None` or any valid scene object as the selected
  object's parent.
- `Parent To Null`: creates a wireframe `Null Controller` at the selected
  object's world position and parents the selected object to it.
- `Clear Parent`: removes the parent while preserving the selected object's
  world pose.
- Command Palette:
  - `Add Null Controller`
  - `Parent Selected To New Null`
  - `Clear Selected Parent`

## Runtime Behavior

Parent changes preserve the child object's world transform by using Three.js
`Object3D.attach`. The child keeps its apparent position, rotation, and scale
when the link is created or cleared, while its local transform is rewritten under
the new parent.

Cycle prevention is enforced before parenting. An object cannot be parented to
itself or to one of its descendants.

## Persistence

Scene JSON stores `parentId` on each object. During load, objects are restored
first, then valid parent links are rebuilt. Invalid or cyclic saved parent links
are ignored.

## Deletion And Duplication

Deleting a parent detaches direct children back to the scene so they remain
visible and selectable. Duplicating a parented object keeps the duplicate under
the same parent when that parent still exists.

## AE Comparison

This is equivalent to the first useful level of AE's Parent & Link column:

- parent transform inheritance
- null controller workflow
- link clearing
- saved parent relationships

Future work can add a visible pick-whip drag gesture and multi-select parenting,
but the data model and scene graph behavior are now in place.
