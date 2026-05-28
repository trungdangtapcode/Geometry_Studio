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
              <button class="mini-button icon-mini" id="timeline-prev-keyframe" type="button" aria-label="Previous keyframe" title="Previous keyframe"><span data-icon="ChevronLeft"></span></button>
              <button class="mini-button strong-mini" id="timeline-play-toggle" type="button"><span data-icon="Play"></span><span>Play</span></button>
              <button class="mini-button icon-mini" id="timeline-next-keyframe" type="button" aria-label="Next keyframe" title="Next keyframe"><span data-icon="ChevronRight"></span></button>
              <button class="mini-button icon-mini" id="timeline-next-frame" type="button" aria-label="Next frame" title="Next frame"><span data-icon="SkipForward"></span></button>
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
              <button class="mini-button" id="timeline-add-keyframe" type="button"><span data-icon="DiamondPlus"></span><span>Add</span></button>
              <button class="mini-button danger" id="timeline-delete-keyframe" type="button"><span data-icon="DiamondMinus"></span><span>Delete</span></button>
              <button class="mini-button" id="timeline-copy-keyframes" type="button"><span data-icon="ClipboardCopy"></span><span>Copy</span></button>
              <button class="mini-button" id="timeline-paste-keyframes" type="button"><span data-icon="ClipboardPaste"></span><span>Paste</span></button>
              <button class="mini-button icon-mini" id="timeline-nudge-left" type="button" aria-label="Nudge keyframe left" title="Nudge keyframe left"><span data-icon="MoveLeft"></span></button>
              <button class="mini-button icon-mini" id="timeline-nudge-right" type="button" aria-label="Nudge keyframe right" title="Nudge keyframe right"><span data-icon="MoveRight"></span></button>
              <button class="mini-button" id="timeline-duplicate-keyframe" type="button"><span data-icon="Copy"></span><span>Duplicate</span></button>
              <button class="mini-button" id="timeline-toggle-track" type="button"><span data-icon="Eye"></span><span>Track On</span></button>
              <button class="mini-button danger" id="timeline-clear-track" type="button"><span data-icon="Eraser"></span><span>Clear Track</span></button>
              <button class="mini-button icon-mini" id="timeline-zoom-out" type="button" aria-label="Zoom timeline out" title="Zoom timeline out"><span data-icon="ZoomOut"></span></button>
              <button class="mini-button icon-mini" id="timeline-zoom-fit" type="button" aria-label="Fit timeline" title="Fit timeline"><span data-icon="Maximize2"></span></button>
              <button class="mini-button icon-mini" id="timeline-zoom-in" type="button" aria-label="Zoom timeline in" title="Zoom timeline in"><span data-icon="ZoomIn"></span></button>
            </div>
          </header>
          <div class="timeline-settings">
            <label><span>Time</span><input id="timeline-current-time" type="number" min="0" step="0.033" value="0" /></label>
            <label><span>Duration</span><input id="timeline-duration" type="number" min="0.5" max="120" step="0.5" value="8" /></label>
            <label><span>Work In</span><input id="timeline-work-start" type="number" min="0" max="120" step="0.1" value="0" /></label>
            <label><span>Work Out</span><input id="timeline-work-end" type="number" min="0.1" max="120" step="0.1" value="8" /></label>
            <label><span>FPS</span><input id="timeline-fps" type="number" min="1" max="120" step="1" value="30" /></label>
            <label><span>Snap</span><input id="timeline-snap-step" type="number" min="0.001" max="10" step="0.001" value="0.033" /></label>
            <label>
              <span>Interpolation</span>
              <select id="timeline-interpolation" aria-label="Keyframe interpolation">
                <option value="linear">Linear</option>
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
          </div>
          <div class="timeline-body">
            <div class="timeline-track-labels" id="timeline-track-labels"></div>
            <div class="timeline-canvas" id="timeline-canvas"></div>
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
        <label class="tool-button import-button" aria-label="Import model" title="Import GLB, GLTF, OBJ, STL">
          <span data-icon="Upload"></span>
          <input id="model-input" type="file" accept=".glb,.gltf,.obj,.stl" />
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
          <div class="form-grid">
            <label><span>Intensity</span><input id="light-intensity" type="range" min="0" max="12" step="0.1" value="4" /></label>
            <label><span>Color</span><input id="light-color" type="color" value="#ffffff" /></label>
            <label><span>Ambient</span><input id="ambient-intensity" type="range" min="0" max="3" step="0.05" value="0.45" /></label>
            <label class="toggle-line"><input id="shadow-toggle" type="checkbox" checked /><span>Shadows</span></label>
            <label class="toggle-line"><input id="helper-toggle" type="checkbox" checked /><span>Helpers</span></label>
            <label class="toggle-line"><input id="light-sweep" type="checkbox" /><span>Light Sweep</span></label>
          </div>
          <div class="matrix-grid" id="light-grid"></div>
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
          </div>
        </section>
      </aside>

      <div class="toast-stack" id="toast-stack"></div>
    </main>
  `;
}
