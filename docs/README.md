# Geometry Studio Engineering Docs

This folder contains engineering design notes for future development. It does
not replace `Doc/`, which contains the formal LaTeX course report and generated
PDF.

## User Docs

- [User Cheatsheet](user-cheatsheet.md) is the practical button and shortcut map
  for operating the finished app.
- [Beginner Tutorial](beginner-tutorial.md) walks through navigation, object
  editing, keyframing, camera/light animation, import, rendering, and report
  evidence screenshots.

## Timeline Planning Set

- [Timeline Research](timeline-research.md) compares timeline and animation
  editor references, including Three.js Editor, Three.js native animation,
  Theatre.js, Wick Editor, Motion Canvas, vis-timeline, and
  `animation-timeline-js`.
- [Timeline Architecture](timeline-architecture.md) defines the proposed
  keyframe timeline data model, module boundaries, playback pipeline, scene JSON
  migration, and conflict rules.
- [Timeline Implementation Plan](timeline-implementation-plan.md) breaks the
  feature into a four-week implementation plan with first-version scope,
  interaction behavior, and tests.
- [Improvement Roadmap](improvement-roadmap.md) records the next research-backed
  upgrade path for rendering quality, OBJ/MTL import, post-processing, timeline
  polish, and optional path-traced preview.
- [Rendering Lab](rendering-lab.md) documents tone mapping, exposure, shadow
  quality, telemetry, and scene JSON persistence.
- [Viewport Navigation](viewport-navigation.md) documents left-drag orbit,
  Blender-style middle mouse orbit, Shift-middle pan, Ctrl-middle dolly, Frame
  Selected/Frame All, and click selection.
- [PBR Material Presets](pbr-material-presets.md) documents Ceramic, Metal,
  Plastic, Glass, Clay, and legacy material comparison presets.
- [Environment Lighting Presets](environment-lighting.md) documents generated
  PMREM studio lighting for PBR materials without runtime network assets.
- [Lighting Presets](lighting-presets.md) documents named ambient,
  directional, point, and spot light rigs for evaluator demos.
- [OBJ + MTL Import](obj-mtl-import.md) documents multi-file OBJ material
  loading and imported source-material preservation.
- [Post-Processing Toggles](post-processing.md) documents SSAO, Bloom,
  Vignette, FXAA, Depth of Field, and the EffectComposer pass chain.
- [Stylized Toon Shading](stylized-toon-shading.md) documents the research and
  implementation plan for Anime Toon cel shading, ink outlines, readable
  imported model materials, and Comic Halftone post-processing.
- [Depth Of Field Post-Processing](depth-of-field.md) documents the Three.js
  `BokehPass` integration, focus/aperture controls, scene JSON persistence, and
  why the effect remains real-time WebGL raster rendering.
- [FXAA Anti-Aliasing](fxaa-antialiasing.md) documents the lightweight
  anti-aliasing pass decision and scene JSON persistence.
- [SSAO Rendering](ssao-rendering.md) documents optional screen-space ambient
  occlusion for contact shading in the real-time viewport.
- [Path-Traced Still Preview](path-traced-preview.md) documents the optional
  `three-gpu-pathtracer` integration for progressive high-quality still
  screenshots.
- [AE-Style Timeline Integration Research](ae-timeline-integration-research.md)
  records the no-reinvention decision for the next timeline phase: keep
  `animation-timeline-js` as the dope-sheet component and integrate proven
  Auto-Key / duplicate / navigation workflows around it.
- [Command Palette](command-palette.md) documents the searchable editor command
  surface for reaching timeline, playback, scene, and tool commands without
  expanding the permanent toolbar.
- [Light Timeline Tracks](light-timeline-tracks.md) documents the implemented
  light property tracks, playback rules, and current schema status.
- [Object Property Timeline Tracks](object-property-timeline-tracks.md)
  documents schema v6 object Color, Opacity, Roughness, Metalness, and
  Visibility tracks.
- [Texture Timeline Tracks](texture-timeline-tracks.md) documents schema v7
  texture Repeat, Offset, and Rotation tracks.
- [Timeline Work Area](timeline-work-area.md) documents schema v8 Work In/Out
  playback range behavior, keyboard shortcuts, and direct draggable range
  editing.
- [Timeline Markers](timeline-markers.md) documents schema v9 marker cue
  points, marker colors, marker navigation, and draggable marker retiming.
- [Timeline Preset Baking](timeline-preset-baking.md) documents why preset
  animation buttons now generate visible keyframes instead of hidden procedural
  motion.
- [Timeline Resizable Dock](timeline-resizable-dock.md) documents the persistent
  dock height handle, row alignment, and scroll synchronization.
- [Timeline Frame Navigation](timeline-frame-navigation.md) documents
  frame-step controls, Work Out jump, and timecode display.
- [Timeline Playhead Ruler](timeline-playhead-ruler.md) documents the draggable
  Current Time Indicator and layer overview playhead line.
- [Timeline Landmark Snapping](timeline-snapping.md) documents marker, keyframe,
  work-area, and layer-boundary snap targets for timeline drags.
- [Timeline Selected Key Boundaries](timeline-selected-key-boundaries.md)
  documents first/last selected keyframe navigation.
- [Timeline Selected Range Preview](timeline-selected-range-preview.md)
  documents one-command preview playback for selected keyframe spans.
- [Timeline Zoom Controls](timeline-zoom-controls.md) documents toolbar and
  keyboard timeline zoom behavior.
- [Timeline Wheel Navigation](timeline-wheel-navigation.md) documents
  cursor-anchored wheel zoom and horizontal wheel/trackpad panning for dense
  timeline editing.
- [Timeline Label Column Resize](timeline-label-column-resize.md) documents the
  persisted resizable layer/property label column.
- [Timeline Selection And Pan Tools](timeline-selection-pan-tools.md) documents
  the explicit dope-sheet Selection and Hand/Pan tools backed by
  `animation-timeline-js` interaction modes.
- [Timeline Overview Navigator](timeline-overview-navigator.md) documents the
  compact dope-sheet mini-map for key density, work area, playhead, and visible
  range navigation.
- [Timeline Range Strip Minimize](timeline-range-strip-minimize.md) documents
  the section-only overview/layer-range collapse and scrollable dense toolbar.
- [Timeline Fit Selected Keyframes](timeline-fit-selection.md) documents the
  AE-style command for zooming the timeline view around selected or playhead
  keyframes.
- [Timeline Follow Playhead](timeline-follow-playhead.md) documents the
  local editor preference that auto-scrolls the dope sheet to keep current time
  visible during playback and scrubbing.
- [Timeline Property Reveal Shortcuts](timeline-property-reveal.md) documents
  AE-style Position, Rotation, Scale, and Opacity row reveal commands.
- [Timeline Transport Shortcuts](timeline-transport-shortcuts.md) documents
  J/K/L forward, pause, and reverse playback behavior.
- [Timeline Playback Speed](timeline-playback-speed.md) documents explicit
  `0.25x` to `4x` preview speed controls and command palette integration.
- [Timeline Keyframe Clipboard](timeline-keyframe-clipboard.md) documents
  keyframe copy/paste behavior for object, camera, and light tracks.
- [Timeline Paste Insert](timeline-paste-insert.md) documents insert-style
  clipboard paste that shifts later destination keys before pasting.
- [Timeline Keyframe Ripple Delete](timeline-keyframe-ripple-delete.md)
  documents selected timing-span removal that closes gaps on affected tracks.
- [Timeline Keyframe Nudge](timeline-keyframe-nudge.md) documents frame-step
  retiming controls for selected or playhead keyframes.
- [Timeline Keyframe Alignment](timeline-keyframe-align.md) documents moving
  selected keyframe blocks to the playhead while preserving relative timing.
- [Timeline Keyframe Center](timeline-keyframe-center.md) documents centering
  selected keyframe timing blocks on the playhead.
- [Timeline Keyframe Rove](timeline-keyframe-rove.md) documents AE-style
  endpoint-preserving roving of selected interior timing columns.
- [Timeline Keyframe Reverse](timeline-keyframe-reverse.md) documents
  time-reversing selected keyframe blocks.
- [Timeline Keyframe Snap](timeline-keyframe-snap.md) documents snapping
  selected keyframes to frame boundaries.
- [Timeline Keyframe Distribution](timeline-keyframe-distribute.md) documents
  evenly spacing selected keyframe timing columns across Work In/Out.
- [Timeline Keyframe Fit](timeline-keyframe-fit.md) documents proportional
  time-stretching of selected keyframe timing columns into Work In/Out.
- [Timeline Keyframe Stagger](timeline-keyframe-stagger.md) documents
  sequencing selected keyframe timing columns from the playhead by the snap
  step.
- [Timeline Keyframe Cascade](timeline-keyframe-cascade.md) documents
  sequencing selected target keyframe blocks from the playhead by the snap step.
- [Timeline Keyframe Editor](timeline-keyframe-editor.md) documents numeric
  keyframe time and value editing.
- [Timeline Track Controls](timeline-track-controls.md) documents active-track
  enable/disable, solo, and lock/unlock behavior.
- [Timeline Clear Track](timeline-clear-track.md) documents deleting all
  keyframes from the active property track through the toolbar or Command
  Palette without deleting the target object.
- [Timeline Row Selection](timeline-row-selection.md) documents dope-sheet row
  label selection and active/disabled row states.
- [Timeline Layer Groups](timeline-layer-groups.md) documents AE-style
  collapsible object, camera, and light disclosure rows plus object pose-key
  buttons.
- [Timeline Row Keying](timeline-row-keying.md) documents the AE-style diamond
  key buttons on each property row.
- [Timeline Visible Row Keying](timeline-visible-row-keying.md) documents the
  `Set Visible` command for keying every currently visible dope-sheet row.
- [Timeline Visible Row Selection](timeline-visible-row-selection.md) documents
  selecting keyframes from the current row filter/search result.
- [Timeline Visible Time Selection](timeline-visible-time-selection.md)
  documents selecting visible-row keyframes at the current playhead time.
- [Timeline Visible Time Status](timeline-visible-time-status.md) documents the
  live visible-key count in the timeline timecode.
- [Timeline Visible Time Copy](timeline-visible-time-copy.md) documents copying
  visible-row pose columns from the playhead.
- [Timeline Visible Time Cut](timeline-visible-time-cut.md) documents cutting
  visible-row pose columns from the playhead.
- [Timeline Visible Time Duplicate](timeline-visible-time-duplicate.md)
  documents duplicating visible-row pose columns from the playhead.
- [Timeline Visible Time Delete](timeline-visible-time-delete.md) documents
  deleting visible-row pose columns from the playhead.
- [Timeline Visible Gap Editing](timeline-visible-gap-editing.md) documents
  inserting playhead gaps and extracting Work In/Out on visible rows.
- [Timeline Visible Key Navigation](timeline-visible-key-navigation.md)
  documents previous/next keyframe navigation scoped to visible rows.
- [Timeline Row Search](timeline-row-search.md) documents the AE-style row
  search field for quickly isolating object, camera, and light tracks.
- [Timeline Row Switches](timeline-row-switches.md) documents direct row-level
  enable, solo, lock, and key controls.
- [Timeline Row Value Readouts](timeline-row-value-readouts.md) documents live
  dope-sheet property values while editing and scrubbing.
- [Timeline Track Metadata](timeline-track-metadata.md) documents the shared
  track groups, labels, colors, and type guards used by the timeline UI.
- [Timeline Target Resolution](timeline-target-resolution.md) documents the
  UI-row-to-track mapping used by visible-row keying and gap-edit commands.
- [Timeline Transform Keying](timeline-transform-keying.md) documents the
  `Set TRS` command for recording Position, Rotation, and Scale as one object
  pose.
- [Transform Inspector Keying](transform-inspector-keying.md) documents the
  AE-style diamond buttons beside Position, Rotation, and Scale in the inspector.
- [Transform Pose Clipboard](transform-pose-clipboard.md) documents copying and
  pasting complete Position, Rotation, and Scale poses, including Auto-Key
  behavior.
- [Auto-Key Initial Pose](auto-key-initial-pose.md) documents automatic Work In
  pose seeding for first transform auto-key edits.
- [Timeline Axis Rows](timeline-axis-rows.md) documents X/Y/Z timeline rows for
  object Position, Rotation, and Scale.
- [Timeline Channel Rows](timeline-channel-rows.md) documents expanded channel
  rows for vector object, texture, camera, and light tracks.
- [Timeline Layer Ranges And Overview](timeline-layer-trim-split.md) documents
  AE-style Layer In, Layer Out, Split, layer boundary jumps, layer work-area
  commands, and draggable object duration bars that can trim visibility or move
  object keyframes with the layer.
- [Timeline Layer Sequencing](timeline-layer-sequencing.md) documents the
  toolbar, command-palette, `Fit Layer`, `Layer Keys`, and `Alt+Shift+F` /
  `Alt+Shift+K` / `Alt+Shift+L` workflows for layer retiming, selected layer
  keyframes, and sequenced layer ranges.
- [Timeline Interpolation Controls](timeline-interpolation-controls.md)
  documents direct Linear, Ease In, Ease Out, Easy Ease, and Hold timing
  controls.
- [Timeline Runtime Interpolation](timeline-runtime-interpolation.md) documents
  per-keyframe transform/runtime interpolation semantics.
- [Timeline Value Graph](timeline-value-graph.md) documents the active-track
  graph preview that samples the same runtime evaluator as playback.
- [Timeline Graph Marquee Selection](timeline-graph-marquee-selection.md)
  documents drag-box selection for graph keys.
- [Timeline Row Filtering](timeline-row-filtering.md) documents Focus, Keyed,
  and All row visibility modes for dense scenes.
- [Timeline Motion Paths](timeline-motion-paths.md) documents selected-object
  position path rendering for visible spatial keyframe feedback.
- [Preview Export](preview-export.md) documents WebM work-area recording and
  recording progress UI.
- [UI Density Control](ui-density.md) documents the Blender-style compact
  control-density system.

## Current Recommendation

Use `animation-timeline-js@2.3.5` for the visual timeline UI and Three.js native
animation runtime where it fits:

- `animation-timeline-js` gives the project MIT-licensed, TypeScript-friendly
  keyframe timeline primitives without pulling in a large application framework.
- Object Position, Rotation, and Scale tracks use the same per-segment runtime
  evaluator as camera, light, material, texture, visibility, and motion-path
  preview tracks. Rotation stays stored as readable Euler degrees so full turns
  such as `0 -> 360` animate as authored.
- Camera, light, and object appearance tracks use the same timeline document and
  UI adapter, then apply evaluated values directly to renderer-owned properties
  during scrubbing/playback.
- Timeline keyframe clipboard support copies or cuts selected/playhead
  keyframes, pastes them at the current playhead time while preserving relative
  timing and interpolation, duplicates selected keys with `Ctrl/Cmd+D`, and
  keeps pasted or duplicated keys selected for the next edit.
- Visible-time clipboard operations preserve original object targets, so
  filtered multi-object pose columns paste back onto their source objects.
- Frame-step keyframe nudge controls retime selected or playhead keyframes
  without dragging.
- Move Keys to Playhead aligns selected keyframe blocks to an exact beat while
  preserving their internal timing.
- Center Selected Keyframes on Playhead aligns the midpoint of a selected
  timing block to the edit beat while preserving internal spacing.
- Rove Across Time keeps selected endpoints fixed while evenly spacing interior
  timing columns, adapting a common After Effects keyframe assistant workflow.
- Time Reverse Keyframes mirrors selected timing blocks while keeping values
  and interpolation attached to each keyframe.
- Snap Selected Keyframes to Frames cleans dragged or imported key timing to the
  active FPS grid without changing key values.
- Distribute Selected Keyframes spaces selected timing columns across Work
  In/Out while keeping grouped pose keys aligned.
- Fit Selected Keyframes to Work Area proportionally scales selected timing
  columns into Work In/Out while preserving authored spacing.
- The visible work-area band supports edge trimming and body dragging, so the
  playback preview range can be adjusted directly in the timeline header.
- Stagger Selected Keyframes sequences selected timing columns from the playhead
  by the active snap step, giving quick cascade and follow-through timing.
- Cascade Selected Keyframes sequences selected object, camera, or light target
  blocks from the playhead by the active snap step while preserving each
  target's internal timing.
- Ctrl/Cmd+A selects every keyframe on the active track, making bulk copy,
  delete, interpolation, and nudge workflows faster.
- Delete and Backspace remove selected timeline keyframes before falling back to
  scene-object deletion, matching motion-graphics editor expectations.
- `Ripple Del` and `Shift+Delete` remove selected timing spans and shift later
  keys earlier on affected tracks, adding the first practical ripple-editing
  workflow from the AE/Premiere research plan.
- `Paste Insert` and `Ctrl/Cmd+Shift+V` paste copied keyframes after shifting
  later destination keys by the copied timing span, with Paste controls enabled
  only when copied keyframes are available.
- A compact keyframe editor allows precise selected/playhead keyframe time and
  value edits, and selection-only timeline actions are disabled when no
  selected or playhead keyframe can be edited. Interpolation controls follow
  the same availability rule.
- `Commands`, `Ctrl/Cmd+K`, and `F3` open a searchable command palette for
  timeline, playback, retiming, interpolation, tool, and scene commands.
- Track enable/disable controls mute individual property tracks without deleting
  saved keyframes.
- Row-label selection makes the left timeline column a direct track navigation
  surface for object, camera, and light tracks.
- Row-level diamond buttons add or update keys directly from the property row,
  matching common motion-graphics editor workflows.
- The `Set Visible` command records every currently visible dope-sheet row in
  one undoable operation, making row search and filters usable as property-set
  keying tools.
- The `Select Visible` command turns current row visibility into an editable
  keyframe selection scope for copy, paste, retime, reverse, snap, distribute,
  fit, and preview workflows.
- The `Select Time` command selects visible-row keyframes at the playhead,
  enabling pose-column copy, delete, paste, and retime workflows.
- The timeline timecode shows how many visible-row keyframes exist at the
  playhead before a pose-column command is applied.
- Visible-time action buttons are disabled when that count is zero, preventing
  accidental no-op pose-column edits.
- The `Copy Time` command copies visible-row keyframes at the playhead into the
  same clipboard used by normal selected-key copy/paste.
- The `Cut Time` command copies then removes visible-row keyframes at the
  playhead, enabling filtered pose-column move workflows.
- The `Dup Time` command duplicates visible-row keyframes at the playhead by
  the active snap step, keeping the duplicated pose column selected.
- The `Del Time` command removes visible-row keyframes at the playhead under
  one undoable edit.
- `Insert Gap` shifts visible-row keyframes at or after the playhead later by
  the Work In/Out duration, creating room for new timing; shortcut `,`.
- `Lift Work` deletes visible-row keyframes inside Work In/Out without shifting
  later visible-row keys; shortcut `;`.
- `Extract Work` deletes visible-row keyframes inside Work In/Out and shifts
  later visible-row keys earlier; shortcut `'`.
- Previous/next visible-row keyframe commands jump the playhead through the
  current row filter/search result instead of only the active track.
- Timeline row labels show live property values, so scrubbed Position, Rotation,
  Scale, material, texture, camera, and light values can be inspected directly
  from the dope sheet.
- The `Set TRS` command records the selected object's Position, Rotation, and
  Scale together at the playhead for pose-to-pose motion authoring.
- Object transform tracks expand into X/Y/Z rows in the timeline panel while
  preserving vector-based JSON persistence and Three.js playback.
- Vector-valued object, texture, camera, and light tracks expand into focused
  channel rows such as Color R/G/B, Texture U/V, Camera Lens FOV/Near/Far, and
  light Color R/G/B.
- Layer In, Layer Out, Split, layer boundary jumps, Layer Work, and draggable
  object layer bars provide AE-style object timing using Visibility hold
  keyframes; body dragging shifts unlocked object keyframes with the layer. The
  shortcuts are `Alt+[`, `Alt+]`, `Ctrl/Cmd+Shift+D`, `Alt+I`, `Alt+O`, and
  `Alt+Shift+B`.
- Linear, Ease In, Ease Out, Easy Ease, and Hold interpolation have direct
  toolbar controls, synchronized dropdown state, keyboard shortcuts, and a
  compact curve preview.
- The active track can be inspected in a value graph that samples the same
  per-keyframe evaluator as runtime playback and motion-path preview. Graph key
  points can be dragged horizontally and vertically to retime keys and edit
  channel values with snap-aware time movement, Ctrl/Cmd toggle selection,
  Shift range selection, selected-key group dragging, Alt-drag proportional time
  stretching, Shift drag constraints, and one undo step per drag.
- Row filtering keeps dense scenes manageable through Focus, Keyed, and All
  timeline views, with `U` cycling row visibility from the keyboard.
- Timeline zoom supports toolbar controls plus `+`, `-`, and `0` shortcuts for
  timeline scale changes without leaving the keyboard.
- Selected objects with two or more Position keys show a viewport motion path,
  turning hidden `A_t0 -> A_t1` data into visible spatial feedback.
- Timeline markers add named cue points for animation beats and demo segments,
  with direct marker dragging plus `M`, `Shift+M`, `Alt+M`, and `Shift+Alt+M`
  shortcuts for authoring, navigation, and cleanup.
- Work area editing supports Start/Out buttons plus `B`, `N`, `I`, `O`,
  `Shift+B`, and `Ctrl/Cmd+Shift+A` keyboard workflows for fast preview-range
  authoring and range selection. The ruler scrub lane also supports `Shift`
  click for Work In and `Alt` click for Work Out.
- J/K/L transport shortcuts provide forward, pause, reverse, and repeated-key
  shuttle playback inside the active work area, while the Speed selector gives
  direct `0.25x` to `4x` preview rates.
- The red Current Time Indicator in the timeline ruler can be dragged directly
  to scrub the scene, and the ruler scrub lane supports direct click-to-seek,
  with the matching playhead line shown across layer ranges.
- Timeline drags snap to authored landmarks such as markers, keyframes, Work
  In/Out, and layer boundaries before falling back to the frame grid.
- Preset animation buttons bake visible Position, Rotation, or Scale keyframes,
  keeping playback inspectable from the timeline.
- The keyframe dock has a persisted height resize handle, with row labels and
  canvas scrolling kept in sync.
- Blender-style UI density is the default, with Compact and Comfortable options
  persisted in local storage.
- The `Commands` button plus `Ctrl/Cmd+K` and `F3` open a searchable command
  palette for playback, keyframe, selection, interpolation, retiming, view,
  tool, and scene operations.

## Implementation Status

The implemented timeline stack in `Source/` now includes object transform,
object appearance, camera, and light tracks:

- `animation/timelineSchema.ts` owns timeline defaults, migration, cloning, and
  track helpers.
- `animation/timelineEditing.ts` owns pure keyframe edit operations such as
  source resolution, copy/paste payloads, paste insert, duplicate, ripple
  delete, visible-row gap editing, frame nudge, shared edit retiming helpers,
  and numeric keyframe editing.
- `animation/timelineTracks.ts` owns shared timeline track categories, labels,
  preset-to-track mapping, and object value capture helpers so the editor shell
  does not duplicate track taxonomy.
- `animation/timelineTargets.ts` owns UI-visible row deduplication and row-to-
  track resolution for visible-row timeline commands.
- `animation/interpolation.ts` owns the shared per-keyframe interpolation
  evaluator.
- `animation/timelinePlayer.ts` evaluates Position, Rotation, and Scale tracks
  directly from the timeline document.
- `animation/timelineTransport.ts` owns J/K/L playback direction, explicit
  preview speed, shuttle rate, button labels, and signed playback delta
  calculation.
- `ui/timelinePanel.ts` wraps `animation-timeline-js` and connects the visual
  timeline to editor callbacks.
- `ui/commandPalette.ts` owns the searchable command surface and disabled-state
  rendering while `main.ts` supplies command descriptors that reuse existing
  editor functions.
- `ui/timelineValueGraph.ts` owns active-track graph rendering, key point
  display, channel normalization, and graph time/value drag interaction.
- `ui/timelinePlayhead.ts` owns the draggable ruler Current Time Indicator and
  visual layer-overview playhead line.
- `ui/timelineSnapping.ts` owns shared landmark snapping for playhead, marker,
  work-area, and layer-range drag workflows.
- `ui/timelineWorkArea.ts` owns direct Work In/Out range dragging in the timeline
  header.
- `ui/density.ts` owns UI-density persistence and root layout mode application.
- `main.ts` evaluates camera, light, color, opacity, and visibility tracks
  against the same keyframe schema so non-transform properties remain
  synchronized with scrubbing, Auto-Key, Undo, Redo, save, and load.

The longer-term documents remain useful for the next stages: per-axis expansion,
curve editing, nested model tracks, and export workflows.

## Reading Order

1. Read the research document to understand the library choice.
2. Read the architecture document before touching source code.
3. Follow the implementation plan one phase at a time, keeping each phase
   testable and reviewable.

## Related Project Folders

- `Source/` contains the Vite and TypeScript application.
- `Release/` contains the static production build.
- `Doc/` contains the formal LaTeX report.
- `docs/` contains engineering plans and architecture notes.
