export function studioTemplate(): string {
  return `
    <main class="studio-shell">
      <section class="viewport" aria-label="3D viewport">
        <canvas id="scene-canvas"></canvas>
        <div class="drop-overlay" id="drop-overlay">
          <span data-icon="Upload"></span>
          <strong>Drop model or texture here</strong>
        </div>
        <div class="viewport-top">
          <div>
            <h1>Geometry Studio</h1>
            <p id="selection-summary">Cube selected</p>
          </div>
          <div class="view-chip" id="camera-chip">FOV 55 | Near 0.1 | Far 500</div>
        </div>
        <div class="viewport-bottom">
          <button class="timeline-btn" id="play-toggle" type="button" aria-label="Play animation">
            <span data-icon="Play"></span><span>Play</span>
          </button>
          <button class="timeline-btn strong" id="cinematic-btn" type="button" aria-label="Cinematic demo">
            <span data-icon="Sparkles"></span><span>Cinematic Demo</span>
          </button>
          <button class="timeline-btn" id="command-palette-btn" type="button" aria-label="Command palette">
            <span data-icon="Search"></span><span>Commands</span>
          </button>
          <button class="timeline-btn" id="evaluation-btn" type="button" aria-label="Evaluation tour">
            <span data-icon="ListChecks"></span><span>Evaluation Tour</span>
          </button>
          <button class="timeline-btn" id="screenshot-btn" type="button" aria-label="Screenshot">
            <span data-icon="Camera"></span><span>Screenshot</span>
          </button>
          <button class="timeline-btn" id="record-video-btn" type="button" aria-label="Record WebM preview">
            <span data-icon="Video"></span><span>Record WebM</span>
          </button>
          <div class="status-line" id="status-line">Ready</div>
          <div class="fps" id="fps">-- FPS</div>
        </div>

        <section class="keyframe-dock" id="keyframe-dock" aria-label="Keyframe timeline">
          <button class="timeline-resize-handle" id="timeline-resize-handle" type="button" aria-label="Resize timeline height" title="Drag to resize timeline height"></button>
          <header class="timeline-header">
            <button class="icon-command" id="timeline-collapse" type="button" aria-label="Collapse timeline" title="Collapse timeline"><span data-icon="PanelBottomClose"></span></button>
            <div class="timeline-title">
              <strong>Keyframe Timeline</strong>
              <span id="timeline-selection">No keyframe selected</span>
              <span class="timeline-timecode" id="timeline-timecode">00:00:00 | F0000</span>
            </div>
            <div class="timeline-toolbar">
              <button class="mini-button" id="timeline-start" type="button"><span data-icon="StepBack"></span><span>Start</span></button>
              <button class="mini-button" id="timeline-end" type="button"><span data-icon="StepForward"></span><span>Out</span></button>
              <button class="mini-button icon-mini" id="timeline-prev-frame" type="button" aria-label="Previous frame" title="Previous frame"><span data-icon="SkipBack"></span></button>
              <button class="mini-button icon-mini" id="timeline-selected-start" type="button" aria-label="First selected keyframe" title="First selected keyframe (Shift+Home)"><span data-icon="ChevronsLeft"></span></button>
              <button class="mini-button icon-mini" id="timeline-prev-keyframe" type="button" aria-label="Previous keyframe" title="Previous keyframe"><span data-icon="ChevronLeft"></span></button>
              <button class="mini-button icon-mini" id="timeline-prev-visible-keyframe" type="button" aria-label="Previous visible-row keyframe" title="Previous visible-row keyframe (Ctrl+Alt+Left)"><span data-icon="ListStart"></span></button>
              <button class="mini-button strong-mini" id="timeline-play-toggle" type="button"><span data-icon="Play"></span><span>Play</span></button>
              <button class="mini-button icon-mini" id="timeline-next-visible-keyframe" type="button" aria-label="Next visible-row keyframe" title="Next visible-row keyframe (Ctrl+Alt+Right)"><span data-icon="ListEnd"></span></button>
              <button class="mini-button icon-mini" id="timeline-next-keyframe" type="button" aria-label="Next keyframe" title="Next keyframe"><span data-icon="ChevronRight"></span></button>
              <button class="mini-button icon-mini" id="timeline-selected-end" type="button" aria-label="Last selected keyframe" title="Last selected keyframe (Shift+End)"><span data-icon="ChevronsRight"></span></button>
              <button class="mini-button icon-mini" id="timeline-next-frame" type="button" aria-label="Next frame" title="Next frame"><span data-icon="SkipForward"></span></button>
              <button class="mini-button icon-mini" id="timeline-prev-marker" type="button" aria-label="Previous marker" title="Previous marker"><span data-icon="Flag"></span></button>
              <button class="mini-button icon-mini" id="timeline-next-marker" type="button" aria-label="Next marker" title="Next marker"><span data-icon="Flag"></span></button>
              <select id="timeline-track-kind" aria-label="Keyframe track">
                <optgroup label="Object">
                  <option value="position">Position</option>
                  <option value="rotation">Rotation</option>
                  <option value="scale">Scale</option>
                  <option value="objectColor">Color</option>
                  <option value="objectOpacity">Opacity</option>
                  <option value="objectRoughness">Roughness</option>
                  <option value="objectMetalness">Metalness</option>
                  <option value="objectTextureRepeat">Texture Repeat</option>
                  <option value="objectTextureOffset">Texture Offset</option>
                  <option value="objectTextureRotation">Texture Rotation</option>
                  <option value="objectVisibility">Visibility</option>
                </optgroup>
                <optgroup label="Camera">
                  <option value="cameraPosition">Camera Position</option>
                  <option value="cameraTarget">Camera Target</option>
                  <option value="cameraLens">Camera Lens</option>
                </optgroup>
                <optgroup label="Lights">
                  <option value="directionalPosition">Sun Position</option>
                  <option value="directionalColor">Sun Color</option>
                  <option value="directionalIntensity">Sun Intensity</option>
                  <option value="pointPosition">Point Position</option>
                  <option value="pointColor">Point Color</option>
                  <option value="pointIntensity">Point Intensity</option>
                  <option value="spotPosition">Spot Position</option>
                  <option value="spotColor">Spot Color</option>
                  <option value="spotIntensity">Spot Intensity</option>
                  <option value="ambientIntensity">Ambient Intensity</option>
                </optgroup>
              </select>
              <select id="timeline-row-filter" aria-label="Timeline row filter">
                <option value="focus">Focus Rows</option>
                <option value="keyed">Keyed Rows</option>
                <option value="all">All Rows</option>
              </select>
              <label class="timeline-search" aria-label="Search timeline rows">
                <span data-icon="Search"></span>
                <input id="timeline-row-search" type="search" placeholder="Search rows" autocomplete="off" />
              </label>
              <button class="mini-button" id="timeline-add-keyframe" type="button"><span data-icon="DiamondPlus"></span><span>Set Key</span></button>
              <button class="mini-button" id="timeline-set-transform" type="button"><span data-icon="Box"></span><span>Set TRS</span></button>
              <button class="mini-button" id="timeline-set-visible" type="button" title="Set keys on every currently visible timeline row"><span data-icon="ListChecks"></span><span>Set Visible</span></button>
              <button class="mini-button" id="timeline-layer-in" type="button" title="Trim selected layer in at the playhead (Alt+[)"><span data-icon="LogIn"></span><span>Layer In</span></button>
              <button class="mini-button" id="timeline-layer-out" type="button" title="Trim selected layer out at the playhead (Alt+])"><span data-icon="LogOut"></span><span>Layer Out</span></button>
              <button class="mini-button" id="timeline-split-layer" type="button" title="Split selected layer at the playhead (Ctrl+Shift+D)"><span data-icon="Scissors"></span><span>Split</span></button>
              <button class="mini-button" id="timeline-layer-work" type="button" title="Set work area to selected layer range (Alt+Shift+B)"><span data-icon="StretchHorizontal"></span><span>Layer Work</span></button>
              <button class="mini-button" id="timeline-select-layer-keys" type="button" title="Select keyframes inside the selected layer range (Alt+Shift+K)"><span data-icon="KeyRound"></span><span>Layer Keys</span></button>
              <button class="mini-button" id="timeline-fit-layer-keys" type="button" title="Retiming-fit selected object keyframes into its layer range (Alt+Shift+F)"><span data-icon="MoveHorizontal"></span><span>Fit Layer</span></button>
              <button class="mini-button" id="timeline-sequence-layers" type="button" title="Sequence all object layer ranges from the playhead (Alt+Shift+L)"><span data-icon="ListOrdered"></span><span>Sequence</span></button>
              <button class="mini-button interpolation-button" id="timeline-ease-linear" type="button" data-interpolation="linear"><span data-icon="MoveRight"></span><span>Linear</span></button>
              <button class="mini-button interpolation-button" id="timeline-ease-in" type="button" data-interpolation="easeIn"><span data-icon="CornerDownRight"></span><span>Ease In</span></button>
              <button class="mini-button interpolation-button" id="timeline-ease-out" type="button" data-interpolation="easeOut"><span data-icon="CornerRightDown"></span><span>Ease Out</span></button>
              <button class="mini-button interpolation-button" id="timeline-ease-smooth" type="button" data-interpolation="smooth"><span data-icon="Spline"></span><span>Ease</span></button>
              <button class="mini-button interpolation-button" id="timeline-ease-hold" type="button" data-interpolation="hold"><span data-icon="StepForward"></span><span>Hold</span></button>
              <button class="mini-button" id="timeline-graph-toggle" type="button" aria-pressed="false"><span data-icon="Activity"></span><span>Graph</span></button>
              <button class="mini-button" id="timeline-add-marker" type="button"><span data-icon="Flag"></span><span>Marker</span></button>
              <button class="mini-button danger" id="timeline-delete-marker" type="button"><span data-icon="Trash2"></span><span>Marker</span></button>
              <button class="mini-button danger" id="timeline-delete-keyframe" type="button"><span data-icon="DiamondMinus"></span><span>Delete</span></button>
              <button class="mini-button danger" id="timeline-ripple-delete-keyframes" type="button" title="Delete selected keyframes and close the timing gap on their tracks (Shift+Delete)"><span data-icon="ListX"></span><span>Ripple Del</span></button>
              <button class="mini-button" id="timeline-copy-keyframes" type="button"><span data-icon="ClipboardCopy"></span><span>Copy</span></button>
              <button class="mini-button" id="timeline-copy-time" type="button" title="Copy visible-row keyframes at the current playhead time"><span data-icon="CopyCheck"></span><span>Copy Time</span></button>
              <button class="mini-button danger" id="timeline-cut-time" type="button" title="Cut visible-row keyframes at the current playhead time"><span data-icon="Scissors"></span><span>Cut Time</span></button>
              <button class="mini-button" id="timeline-paste-keyframes" type="button" disabled title="Copy keyframes before pasting"><span data-icon="ClipboardPaste"></span><span>Paste</span></button>
              <button class="mini-button" id="timeline-paste-insert-keyframes" type="button" disabled title="Copy keyframes before insert-pasting"><span data-icon="ListPlus"></span><span>Paste Insert</span></button>
              <button class="mini-button" id="timeline-select-workarea" type="button"><span data-icon="ListFilter"></span><span>Select Work</span></button>
              <button class="mini-button" id="timeline-select-visible" type="button" title="Select all keyframes on currently visible timeline rows"><span data-icon="ListChecks"></span><span>Select Visible</span></button>
              <button class="mini-button" id="timeline-select-time" type="button" title="Select visible-row keyframes at the current playhead time"><span data-icon="Crosshair"></span><span>Select Time</span></button>
              <button class="mini-button" id="timeline-duplicate-time" type="button" title="Duplicate visible-row keyframes at the current playhead time"><span data-icon="CopyPlus"></span><span>Dup Time</span></button>
              <button class="mini-button danger" id="timeline-delete-time" type="button" title="Delete visible-row keyframes at the current playhead time"><span data-icon="Trash2"></span><span>Del Time</span></button>
              <button class="mini-button" id="timeline-insert-gap" type="button" title="Insert a visible-row timing gap at the playhead using the Work In/Out duration (,)"><span data-icon="ListPlus"></span><span>Insert Gap</span></button>
              <button class="mini-button danger" id="timeline-lift-work" type="button" title="Delete visible-row keyframes inside Work In/Out without closing the gap (;)"><span data-icon="Scissors"></span><span>Lift Work</span></button>
              <button class="mini-button danger" id="timeline-extract-work" type="button" title="Delete visible-row keyframes inside Work In/Out and close the gap (')"><span data-icon="ListX"></span><span>Extract Work</span></button>
              <button class="mini-button" id="timeline-preview-selection" type="button" title="Preview selected keyframe range (Shift+Space)"><span data-icon="Play"></span><span>Preview Sel</span></button>
              <button class="mini-button icon-mini" id="timeline-nudge-left" type="button" aria-label="Nudge keyframe left" title="Nudge keyframe left"><span data-icon="MoveLeft"></span></button>
              <button class="mini-button icon-mini" id="timeline-nudge-right" type="button" aria-label="Nudge keyframe right" title="Nudge keyframe right"><span data-icon="MoveRight"></span></button>
              <button class="mini-button" id="timeline-move-to-playhead" type="button"><span data-icon="Crosshair"></span><span>To Playhead</span></button>
              <button class="mini-button" id="timeline-center-keyframes" type="button"><span data-icon="AlignCenterHorizontal"></span><span>Center</span></button>
              <button class="mini-button" id="timeline-rove-keyframes" type="button"><span data-icon="GitCommitHorizontal"></span><span>Rove</span></button>
              <button class="mini-button" id="timeline-reverse-keyframes" type="button"><span data-icon="ArrowLeftRight"></span><span>Reverse</span></button>
              <button class="mini-button" id="timeline-snap-keyframes" type="button"><span data-icon="Magnet"></span><span>Snap</span></button>
              <button class="mini-button" id="timeline-distribute-keyframes" type="button"><span data-icon="AlignHorizontalSpaceAround"></span><span>Distribute</span></button>
              <button class="mini-button" id="timeline-fit-keyframes" type="button"><span data-icon="StretchHorizontal"></span><span>Fit Keys</span></button>
              <button class="mini-button" id="timeline-stagger-keyframes" type="button" title="Stagger selected keyframe columns from the playhead by the snap step"><span data-icon="ListOrdered"></span><span>Stagger</span></button>
              <button class="mini-button" id="timeline-cascade-keyframes" type="button" title="Cascade selected target keyframes from the playhead by the snap step"><span data-icon="Layers3"></span><span>Cascade</span></button>
              <button class="mini-button" id="timeline-duplicate-keyframe" type="button"><span data-icon="Copy"></span><span>Duplicate</span></button>
              <button class="mini-button" id="timeline-toggle-track" type="button"><span data-icon="Eye"></span><span>Track On</span></button>
              <button class="mini-button" id="timeline-solo-track" type="button"><span data-icon="Circle"></span><span>Solo Off</span></button>
              <button class="mini-button" id="timeline-lock-track" type="button"><span data-icon="Unlock"></span><span>Unlocked</span></button>
              <button class="mini-button danger" id="timeline-clear-track" type="button"><span data-icon="Eraser"></span><span>Clear Track</span></button>
              <button class="mini-button icon-mini" id="timeline-selection-tool" type="button" aria-label="Timeline selection tool" title="Timeline selection tool (V)" aria-pressed="true"><span data-icon="MousePointer2"></span></button>
              <button class="mini-button icon-mini" id="timeline-pan-tool" type="button" aria-label="Timeline pan tool" title="Timeline pan tool (H)" aria-pressed="false"><span data-icon="Hand"></span></button>
              <button class="mini-button icon-mini" id="timeline-zoom-out" type="button" aria-label="Zoom timeline out" title="Zoom timeline out"><span data-icon="ZoomOut"></span></button>
              <button class="mini-button icon-mini" id="timeline-zoom-fit" type="button" aria-label="Fit timeline" title="Fit timeline"><span data-icon="Maximize2"></span></button>
              <button class="mini-button icon-mini" id="timeline-zoom-selection" type="button" aria-label="Fit selected keyframes" title="Fit selected keyframes"><span data-icon="ScanSearch"></span></button>
              <button class="mini-button icon-mini" id="timeline-follow-playhead" type="button" aria-label="Follow playhead" title="Follow playhead" aria-pressed="false"><span data-icon="LocateFixed"></span></button>
              <button class="mini-button icon-mini" id="timeline-zoom-in" type="button" aria-label="Zoom timeline in" title="Zoom timeline in"><span data-icon="ZoomIn"></span></button>
            </div>
          </header>
          <div class="timeline-settings">
            <label><span>Time</span><input id="timeline-current-time" type="number" min="0" step="0.033" value="0" /></label>
            <label><span>Duration</span><input id="timeline-duration" type="number" min="0.5" max="120" step="0.5" value="8" /></label>
            <label><span>Work In</span><input id="timeline-work-start" type="number" min="0" max="120" step="0.1" value="0" /></label>
            <label><span>Work Out</span><input id="timeline-work-end" type="number" min="0.1" max="120" step="0.1" value="8" /></label>
            <label><span>FPS</span><input id="timeline-fps" type="number" min="1" max="120" step="1" value="30" /></label>
            <label>
              <span>Speed</span>
              <select id="timeline-playback-rate" aria-label="Timeline playback speed">
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1" selected>1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
              </select>
            </label>
            <label><span>Snap</span><input id="timeline-snap-step" type="number" min="0.001" max="10" step="0.001" value="0.033" /></label>
            <label>
              <span>Interpolation</span>
              <select id="timeline-interpolation" aria-label="Keyframe interpolation">
                <option value="linear">Linear</option>
                <option value="easeIn">Ease In</option>
                <option value="easeOut">Ease Out</option>
                <option value="smooth">Smooth</option>
                <option value="hold">Hold</option>
              </select>
            </label>
            <label class="toggle-line"><input id="timeline-loop" type="checkbox" checked /><span>Loop</span></label>
            <label class="toggle-line"><input id="timeline-snap" type="checkbox" checked /><span>Snap</span></label>
            <label class="toggle-line"><input id="timeline-auto-key" type="checkbox" /><span>Auto-Key</span></label>
          </div>
          <div class="timeline-keyframe-editor" id="timeline-keyframe-editor">
            <strong id="timeline-key-label">No keyframe selected</strong>
            <label><span>Key Time</span><input id="timeline-key-time" type="number" min="0" step="0.001" disabled /></label>
            <label><span id="timeline-key-x-label">X</span><input id="timeline-key-x" type="number" step="0.001" disabled /></label>
            <label><span id="timeline-key-y-label">Y</span><input id="timeline-key-y" type="number" step="0.001" disabled /></label>
            <label><span id="timeline-key-z-label">Z</span><input id="timeline-key-z" type="number" step="0.001" disabled /></label>
            <label><span>Marker</span><input id="timeline-marker-label" type="text" maxlength="48" disabled /></label>
            <label><span>Color</span><input id="timeline-marker-color" type="color" value="#f4ad2f" disabled /></label>
            <div class="timeline-ease-preview" id="timeline-ease-preview" aria-label="Interpolation preview">
              <svg viewBox="0 0 72 34" aria-hidden="true" focusable="false">
                <path class="ease-preview-grid" d="M4 28 H68 M4 28 V6" />
                <path class="ease-preview-path" id="timeline-ease-path" d="M4 28 L68 6" />
              </svg>
              <span id="timeline-ease-label">Linear</span>
            </div>
          </div>
          <div class="timeline-overview" id="timeline-overview" aria-label="Timeline overview navigator">
            <div class="timeline-overview-label">Overview</div>
            <button class="timeline-overview-track" id="timeline-overview-track" type="button" aria-label="Timeline overview navigator" title="Click to move the playhead. Drag the highlighted window to pan the timeline.">
              <span class="timeline-overview-work" id="timeline-overview-work"></span>
              <span class="timeline-overview-keys" id="timeline-overview-keys"></span>
              <span class="timeline-overview-viewport" id="timeline-overview-viewport"></span>
              <span class="timeline-overview-playhead" id="timeline-overview-playhead"></span>
            </button>
          </div>
          <div class="timeline-graph-panel" id="timeline-graph-panel" aria-label="Selected track value graph">
            <div class="timeline-graph-header">
              <strong id="timeline-graph-title">Value Graph</strong>
              <span id="timeline-graph-range">No keyed track</span>
            </div>
            <svg id="timeline-value-graph" viewBox="0 0 520 96" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path class="timeline-graph-grid" d="M0 16 H520 M0 48 H520 M0 80 H520 M104 0 V96 M208 0 V96 M312 0 V96 M416 0 V96" />
              <path class="timeline-graph-path graph-x" id="timeline-graph-x" d="" />
              <path class="timeline-graph-path graph-y" id="timeline-graph-y" d="" />
              <path class="timeline-graph-path graph-z" id="timeline-graph-z" d="" />
              <rect class="timeline-graph-marquee" id="timeline-graph-marquee" x="0" y="0" width="0" height="0" />
              <g class="timeline-graph-keys" id="timeline-graph-keys"></g>
              <line class="timeline-graph-playhead" id="timeline-graph-playhead" x1="0" y1="0" x2="0" y2="96" />
            </svg>
          </div>
          <div class="timeline-body">
            <div class="timeline-track-labels" id="timeline-track-labels"></div>
            <div class="timeline-workspace">
              <div class="timeline-marker-strip" id="timeline-marker-strip" aria-label="Timeline markers"></div>
              <div class="timeline-layer-strip" id="timeline-layer-strip" aria-label="Object layer ranges"></div>
              <div class="timeline-canvas" id="timeline-canvas"></div>
            </div>
          </div>
        </section>
      </section>

      <nav class="tool-rail" aria-label="Geometry tools">
        <button class="tool-button primitive-btn" type="button" data-primitive="cube" aria-label="Cube" title="Cube"><span data-icon="Box"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="sphere" aria-label="Sphere" title="Sphere"><span data-icon="Circle"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="cone" aria-label="Cone" title="Cone"><span data-icon="Triangle"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="cylinder" aria-label="Cylinder" title="Cylinder"><span data-icon="Database"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="torus" aria-label="Wheel Torus" title="Wheel / Torus"><span data-icon="Disc3"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="teapot" aria-label="Teapot" title="Teapot"><span data-icon="Coffee"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="torusKnot" aria-label="Torus Knot" title="Torus Knot"><span data-icon="Atom"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="tube" aria-label="Tube Curve" title="Tube Curve"><span data-icon="Spline"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="tetrahedron" aria-label="Tetrahedron" title="Tetrahedron"><span data-icon="Pyramid"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="octahedron" aria-label="Octahedron" title="Octahedron"><span data-icon="Diamond"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="dodecahedron" aria-label="Dodecahedron" title="Dodecahedron"><span data-icon="Badge"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="icosahedron" aria-label="Icosahedron" title="Icosahedron"><span data-icon="BadgeCheck"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="parametric" aria-label="Parametric Surface" title="Parametric Surface"><span data-icon="Waves"></span></button>
        <button class="tool-button primitive-btn" type="button" data-primitive="extrude" aria-label="Extruded Shape" title="Extruded Shape"><span data-icon="Gem"></span></button>
        <button class="tool-button" id="sample-model-btn" type="button" aria-label="Built-in sample model" title="Built-in sample model"><span data-icon="Bot"></span></button>
        <label class="tool-button import-button" aria-label="Import model" title="Import GLB, GLTF, OBJ, MTL, STL">
          <span data-icon="Upload"></span>
          <input id="model-input" type="file" accept=".glb,.gltf,.obj,.mtl,.stl,.bin,.jpg,.jpeg,.png,.webp" multiple />
        </label>
      </nav>

      <aside class="inspector" aria-label="Studio inspector">
        <header class="panel-header">
          <div>
            <div class="eyebrow">Studio</div>
            <h2>Scene Controls</h2>
            <label class="density-control">
              <span>Density</span>
              <select id="ui-density" aria-label="UI density">
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
                <option value="blender">Blender</option>
              </select>
            </label>
          </div>
          <button class="icon-command" id="reset-scene" type="button" aria-label="Reset scene" title="Reset scene"><span data-icon="RotateCcw"></span></button>
        </header>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="Workflow"></span>
            <h3>Document</h3>
          </div>
          <div class="doc-actions">
            <button class="wide-button" id="undo-btn" type="button"><span data-icon="Undo2"></span><span>Undo</span></button>
            <button class="wide-button" id="redo-btn" type="button"><span data-icon="Redo2"></span><span>Redo</span></button>
            <button class="wide-button" id="save-scene" type="button"><span data-icon="Save"></span><span>Save JSON</span></button>
            <label class="wide-button file-action"><span data-icon="FolderOpen"></span><span>Load JSON</span><input id="scene-input" type="file" accept="application/json,.json" /></label>
          </div>
          <div class="load-progress" id="load-progress"><span></span><strong>Idle</strong></div>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="Layers"></span>
            <h3>Outliner</h3>
          </div>
          <div class="outliner" id="outliner"></div>
          <div class="compact-row">
            <button class="wide-button" id="duplicate-selected" type="button"><span data-icon="Copy"></span><span>Duplicate</span></button>
            <button class="wide-button danger" id="delete-selected" type="button"><span data-icon="Trash2"></span><span>Delete</span></button>
          </div>
          <label class="rename-line">
            <span>Name</span>
            <input id="object-name" type="text" value="Cube" />
          </label>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="MousePointer2"></span>
            <h3>Transform</h3>
          </div>
          <div class="segmented" role="group" aria-label="Transform tools">
            <button class="segment transform-tool active" type="button" data-mode="translate">Move</button>
            <button class="segment transform-tool" type="button" data-mode="rotate">Rotate</button>
            <button class="segment transform-tool" type="button" data-mode="scale">Scale</button>
          </div>
          <div class="compact-row">
            <button class="wide-button" id="toggle-space" type="button"><span data-icon="Globe2"></span><span>World Space</span></button>
            <button class="wide-button" id="reset-transform" type="button"><span data-icon="Undo2"></span><span>Reset</span></button>
          </div>
          <div class="matrix-grid" id="transform-grid"></div>
        </section>

        <section class="panel-section">
          <button class="section-title section-button" id="render-mode-button" type="button" aria-label="Render mode">
            <span data-icon="ScanLine"></span>
            <h3>Render Mode</h3>
          </button>
          <div class="segmented" id="render-modes">
            <button class="segment active" type="button" data-render="solid">Solid</button>
            <button class="segment" type="button" data-render="points">Points</button>
            <button class="segment" type="button" data-render="lines">Lines</button>
          </div>
          <div class="form-grid">
            <label>
              <span>Material</span>
              <select id="material-mode">
                <option value="standard">Standard</option>
                <option value="basic">Basic</option>
                <option value="phong">Phong</option>
                <option value="lambert">Lambert</option>
                <option value="normal">Normal</option>
              </select>
            </label>
            <label>
              <span>Color</span>
              <input id="object-color" type="color" value="#4bd0a0" />
            </label>
            <label>
              <span>Opacity</span>
              <input id="object-opacity" type="number" min="0" max="1" step="0.05" value="1" />
            </label>
            <label>
              <span>Roughness</span>
              <input id="object-roughness" type="number" min="0" max="1" step="0.05" value="0.42" />
            </label>
            <label>
              <span>Metalness</span>
              <input id="object-metalness" type="number" min="0" max="1" step="0.05" value="0.08" />
            </label>
            <label class="toggle-line panel-toggle">
              <input id="object-visible" type="checkbox" checked />
              <span>Visible</span>
            </label>
          </div>
          <div class="material-presets">
            <button class="mini-button material-preset" type="button" data-material-preset="ceramic">Ceramic</button>
            <button class="mini-button material-preset" type="button" data-material-preset="metal">Metal</button>
            <button class="mini-button material-preset" type="button" data-material-preset="plastic">Plastic</button>
            <button class="mini-button material-preset" type="button" data-material-preset="glass">Glass</button>
            <button class="mini-button material-preset" type="button" data-material-preset="clay">Clay</button>
            <button class="mini-button material-preset" type="button" data-material-preset="basic">Basic</button>
            <button class="mini-button material-preset" type="button" data-material-preset="lambert">Lambert</button>
            <button class="mini-button material-preset" type="button" data-material-preset="phong">Phong</button>
            <button class="mini-button material-preset" type="button" data-material-preset="texture">Texture</button>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="Image"></span>
            <h3>Texture</h3>
          </div>
          <div class="texture-grid">
            <button class="texture-swatch" type="button" data-texture="none">None</button>
            <button class="texture-swatch" type="button" data-texture="checker">Checker</button>
            <button class="texture-swatch" type="button" data-texture="uv">UV</button>
            <button class="texture-swatch" type="button" data-texture="grid">Grid</button>
            <label class="texture-swatch upload-texture">Upload<input id="texture-input" type="file" accept="image/*" /></label>
          </div>
          <div class="form-grid">
            <label>
              <span>Repeat X</span>
              <input class="texture-repeat" type="number" data-axis="x" min="0.25" max="8" step="0.25" value="1" />
            </label>
            <label>
              <span>Repeat Y</span>
              <input class="texture-repeat" type="number" data-axis="y" min="0.25" max="8" step="0.25" value="1" />
            </label>
            <label>
              <span>Offset X</span>
              <input class="texture-offset" type="number" data-axis="x" min="-4" max="4" step="0.05" value="0" />
            </label>
            <label>
              <span>Offset Y</span>
              <input class="texture-offset" type="number" data-axis="y" min="-4" max="4" step="0.05" value="0" />
            </label>
            <label>
              <span>Rotation</span>
              <input id="texture-rotation" type="number" min="-360" max="360" step="5" value="0" />
            </label>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="Camera"></span>
            <h3>Camera</h3>
          </div>
          <div class="camera-presets">
            <button class="mini-button" type="button" data-view="front">Front</button>
            <button class="mini-button" type="button" data-view="top">Top</button>
            <button class="mini-button" type="button" data-view="iso">Iso</button>
            <button class="mini-button" type="button" data-view="reset">Reset</button>
          </div>
          <label class="toggle-line single-toggle">
            <input id="frustum-toggle" type="checkbox" />
            <span>Camera frustum helper</span>
          </label>
          <div class="matrix-grid" id="camera-grid"></div>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="Sun"></span>
            <h3>Lighting</h3>
          </div>
          <div class="segmented" id="light-kinds">
            <button class="segment active" type="button" data-light="directional">Sun</button>
            <button class="segment" type="button" data-light="point">Point</button>
            <button class="segment" type="button" data-light="spot">Spot</button>
          </div>
          <div class="lighting-presets">
            <button class="mini-button lighting-preset active" type="button" data-lighting-preset="studio">Studio</button>
            <button class="mini-button lighting-preset" type="button" data-lighting-preset="product">Product</button>
            <button class="mini-button lighting-preset" type="button" data-lighting-preset="dramatic">Dramatic</button>
            <button class="mini-button lighting-preset" type="button" data-lighting-preset="soft">Soft</button>
            <button class="mini-button lighting-preset" type="button" data-lighting-preset="night">Night</button>
          </div>
          <div class="form-grid">
            <label><span>Intensity</span><input id="light-intensity" type="range" min="0" max="12" step="0.1" value="4" /></label>
            <label><span>Color</span><input id="light-color" type="color" value="#ffffff" /></label>
            <label><span>Ambient</span><input id="ambient-intensity" type="range" min="0" max="3" step="0.01" value="0.45" /></label>
            <label class="toggle-line"><input id="shadow-toggle" type="checkbox" checked /><span>Shadows</span></label>
            <label class="toggle-line"><input id="helper-toggle" type="checkbox" checked /><span>Helpers</span></label>
            <label class="toggle-line"><input id="light-sweep" type="checkbox" /><span>Light Sweep</span></label>
          </div>
          <div class="matrix-grid" id="light-grid"></div>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="SlidersHorizontal"></span>
            <h3>Rendering Lab</h3>
          </div>
          <div class="render-summary" id="renderer-mode">WebGL raster viewport</div>
          <div class="form-grid">
            <label>
              <span>Tone Map</span>
              <select id="tone-mapping" aria-label="Tone mapping">
                <option value="aces">ACES</option>
                <option value="linear">Linear</option>
                <option value="reinhard">Reinhard</option>
                <option value="none">None</option>
              </select>
            </label>
            <label>
              <span>Exposure</span>
              <input id="render-exposure" type="range" min="0.1" max="3" step="0.05" value="1.05" />
            </label>
            <label>
              <span>Shadows</span>
              <select id="shadow-quality" aria-label="Shadow quality">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="ultra">Ultra</option>
              </select>
            </label>
            <label>
              <span>Environment</span>
              <select id="environment-preset" aria-label="Environment lighting">
                <option value="off">Off</option>
                <option value="studio">Studio</option>
                <option value="gallery">Gallery</option>
                <option value="warm">Warm Studio</option>
                <option value="cool">Cool Lab</option>
              </select>
            </label>
            <label class="toggle-line"><input id="post-fxaa-toggle" type="checkbox" /><span>FXAA</span></label>
            <label class="toggle-line"><input id="post-dof-toggle" type="checkbox" /><span>Depth of Field</span></label>
            <label>
              <span>DOF Focus</span>
              <input id="post-dof-focus" type="range" min="0.1" max="80" step="0.1" value="8" />
            </label>
            <label>
              <span>DOF Aperture</span>
              <input id="post-dof-aperture" type="range" min="0" max="0.2" step="0.001" value="0.025" />
            </label>
            <label>
              <span>DOF Blur</span>
              <input id="post-dof-maxblur" type="range" min="0" max="0.08" step="0.001" value="0.012" />
            </label>
            <label class="toggle-line"><input id="post-bloom-toggle" type="checkbox" /><span>Bloom</span></label>
            <label>
              <span>Bloom Strength</span>
              <input id="post-bloom-strength" type="range" min="0" max="2" step="0.05" value="0.42" />
            </label>
            <label>
              <span>Bloom Threshold</span>
              <input id="post-bloom-threshold" type="range" min="0" max="1" step="0.01" value="0.72" />
            </label>
            <label>
              <span>Bloom Radius</span>
              <input id="post-bloom-radius" type="range" min="0" max="1" step="0.01" value="0.22" />
            </label>
            <label class="toggle-line"><input id="post-ssao-toggle" type="checkbox" /><span>SSAO</span></label>
            <label>
              <span>SSAO Radius</span>
              <input id="post-ssao-radius" type="range" min="1" max="32" step="1" value="8" />
            </label>
            <label>
              <span>SSAO Min</span>
              <input id="post-ssao-min" type="range" min="0" max="0.1" step="0.001" value="0.005" />
            </label>
            <label>
              <span>SSAO Max</span>
              <input id="post-ssao-max" type="range" min="0.01" max="1" step="0.01" value="0.12" />
            </label>
            <label class="toggle-line"><input id="post-vignette-toggle" type="checkbox" /><span>Vignette</span></label>
            <label>
              <span>Vignette Dark</span>
              <input id="post-vignette-darkness" type="range" min="0" max="1.5" step="0.05" value="0.75" />
            </label>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="Clapperboard"></span>
            <h3>Animation</h3>
          </div>
          <div class="segmented wrap" id="animation-modes">
            <button class="segment active" type="button" data-animation="none">None</button>
            <button class="segment" type="button" data-animation="spin">Spin</button>
            <button class="segment" type="button" data-animation="orbit">Orbit</button>
            <button class="segment" type="button" data-animation="bounce">Bounce</button>
            <button class="segment" type="button" data-animation="pulse">Pulse</button>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="Activity"></span>
            <h3>Telemetry</h3>
          </div>
          <div class="telemetry-grid" id="telemetry-grid"></div>
        </section>

        <section class="panel-section">
          <div class="section-title">
            <span data-icon="Settings2"></span>
            <h3>Display</h3>
          </div>
          <div class="form-grid">
            <label class="toggle-line"><input id="grid-toggle" type="checkbox" checked /><span>Grid</span></label>
            <label class="toggle-line"><input id="axes-toggle" type="checkbox" checked /><span>Axes</span></label>
            <label class="toggle-line"><input id="stats-toggle" type="checkbox" checked /><span>Stats</span></label>
            <label class="toggle-line"><input id="motion-path-toggle" type="checkbox" checked /><span>Motion Path</span></label>
          </div>
        </section>
      </aside>

      <div class="toast-stack" id="toast-stack"></div>
      <section class="command-palette-overlay" id="command-palette" aria-hidden="true">
        <div class="command-palette-dialog" role="dialog" aria-modal="true" aria-label="Command palette">
          <label class="command-palette-search">
            <span data-icon="Search"></span>
            <input id="command-palette-search" type="search" placeholder="Search commands" autocomplete="off" />
          </label>
          <div class="command-palette-list" id="command-palette-list" role="listbox"></div>
        </div>
      </section>
    </main>
  `;
}
