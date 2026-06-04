# Timeline Layer Comments

Layer Comments are AE-style notes for identifying what a layer does in a dense
timeline. They are editor metadata only: comments do not affect rendering,
materials, animation playback, screenshots, or exported videos.

## User Workflow

1. Select an object layer.
2. Open the Command Palette and run `Set Selected Layer Comment`.
3. Enter a short note such as `Hero reveal beat`, `Imported campus tree row`,
   `Camera helper`, or `Background prop`.
4. The note appears in the object group row and can be found by the timeline row
   search field.

Use comments together with layer labels, shy rows, solo, and lock switches to
keep a large demo scene understandable during presentation.

## Behavior

- Stores comments on each object as `layerComment`.
- Saves and loads comments in scene JSON version 8.
- Normalizes whitespace and limits comments to 160 characters.
- Includes comments in timeline row search.
- Preserves comments when duplicating a layer.
- Leaves the 3D object, material, render mode, and timeline keyframes unchanged.

## Implementation

- `editor/layerComments.ts` owns comment normalization.
- `editor/types.ts` adds `SceneEntry.layerComment` and serialized
  `layerComment`.
- `editor/documents.ts` persists comments in scene JSON.
- `main.ts` implements the `timeline.set-layer-comment` Command Palette action.
- `ui/timelinePanel.ts` renders comments in object group metadata and includes
  them in row-search text.

## Validation

`Source/tests/timeline-layer-comments.spec.ts` verifies prompt editing, timeline
display, row-search matching, JSON persistence, and duplicate-layer preservation.
