import { expect, test } from "@playwright/test";

test("renders the studio and core controls", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Geometry Studio" })).toBeVisible();
  await expect(page.locator(".studio-shell")).toHaveAttribute("data-density", "blender");
  await expect(page.locator("#ui-density")).toHaveValue("blender");
  expect(await page.locator(".inspector").evaluate((element) => parseFloat(getComputedStyle(element).width))).toBeLessThan(310);
  await page.locator("#ui-density").selectOption("compact");
  await expect(page.locator(".studio-shell")).toHaveAttribute("data-density", "compact");
  await page.reload();
  await expect(page.locator("#ui-density")).toHaveValue("compact");
  await expect(page.locator(".studio-shell")).toHaveAttribute("data-density", "compact");
  await expect(page.getByRole("button", { name: "Cube", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Render mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record WebM" })).toBeVisible();
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await expect(page.locator("#timeline-prev-frame")).toBeVisible();
  await expect(page.locator("#timeline-next-frame")).toBeVisible();
  await expect(page.locator("#timeline-set-transform")).toBeVisible();
  await expect(page.locator("#timeline-ease-linear")).toBeVisible();
  await expect(page.locator("#timeline-ease-smooth")).toBeVisible();
  await expect(page.locator("#timeline-ease-hold")).toBeVisible();
  await expect(page.locator("#timeline-ease-preview")).toBeVisible();
  await expect(page.locator("#timeline-graph-toggle")).toBeVisible();
  await page.locator("#timeline-graph-toggle").click();
  await expect(page.locator("#keyframe-dock")).toHaveClass(/graph-visible/);
  await expect(page.locator("#timeline-graph-panel")).toBeVisible();
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position");
  await expect(page.locator("#timeline-copy-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-paste-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-nudge-left")).toBeVisible();
  await expect(page.locator("#timeline-nudge-right")).toBeVisible();
  await expect(page.locator("#timeline-toggle-track")).toBeVisible();
  await expect(page.locator("#timeline-add-marker")).toBeVisible();
  await expect(page.locator("#timeline-delete-marker")).toBeVisible();
  await expect(page.locator("#timeline-resize-handle")).toBeVisible();
  await expect(page.locator("#motion-path-toggle")).toBeChecked();
  await expect(page.locator("#timeline-row-filter")).toHaveValue("focus");
  await page.locator("#timeline-row-filter").selectOption("keyed");
  await expect(page.locator('.timeline-track-label[data-track-kind="position"]')).toHaveCount(3);
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]')).toHaveCount(3);
  await expect(page.locator('.timeline-track-label[data-track-kind="position"][data-track-axis="x"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"][data-track-axis="y"]')).toBeVisible();
  await page.locator("#timeline-row-filter").selectOption("focus");
  const rotationTrackLabel = page.locator('.timeline-track-label[data-track-kind="rotation"]').first();
  await rotationTrackLabel.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");
  await expect(rotationTrackLabel).toHaveClass(/active/);
  await rotationTrackLabel.locator(".timeline-row-key").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Rotation");
  await page.locator('[data-animation="spin"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Keyframed");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Rotation");
  const cameraTrackLabel = page.locator('.camera-track-label[data-track-kind="cameraPosition"]');
  await page.locator("#timeline-track-kind").selectOption("cameraPosition");
  await expect(cameraTrackLabel).toBeVisible();
  await cameraTrackLabel.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("cameraPosition");
  await expect(cameraTrackLabel).toHaveClass(/active/);
  await cameraTrackLabel.locator(".timeline-row-key").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Camera | Camera Position");
  const dockHeight = await page.locator("#keyframe-dock").evaluate((element) => element.getBoundingClientRect().height);
  const resizeBox = await page.locator("#timeline-resize-handle").boundingBox();
  expect(resizeBox).toBeTruthy();
  await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y + 4);
  await page.mouse.down();
  await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y - 120);
  await page.mouse.up();
  await expect.poll(() => page.locator("#keyframe-dock").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(dockHeight + 20);
  await page.locator("#timeline-next-frame").click();
  await expect(page.locator("#timeline-timecode")).toContainText("F0001");
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeGreaterThan(0);
  await page.locator("#timeline-prev-frame").click();
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await page.keyboard.press("End");
  await expect(page.locator("#timeline-timecode")).toContainText("F0240");
  await page.keyboard.press("Home");
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#timeline-timecode")).toContainText("F0001");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await page.locator("#timeline-collapse").click({ force: true });
  await expect(page.locator("#keyframe-dock")).toHaveClass(/collapsed/);
  await expect(page.locator(".timeline-body")).toBeHidden();
  await expect(page.locator(".timeline-toolbar")).toBeHidden();
  await expect.poll(() => page.locator("#keyframe-dock").evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(80);

  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return false;
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    const samplePoints = [
      [0.25, 0.35],
      [0.5, 0.5],
      [0.7, 0.42],
      [0.42, 0.68],
      [0.62, 0.72]
    ];
    return samplePoints.some(([x, y]) => {
      const pixels = new Uint8Array(4);
      gl.readPixels(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels[3] > 0 && (pixels[0] > 0 || pixels[1] > 0 || pixels[2] > 0);
    });
  });

  await page.getByRole("button", { name: "Sphere", exact: true }).click();
  await expect(page.locator("#selection-summary")).toContainText("Sphere");

  await page.locator('[data-render="lines"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Lines");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Cube", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("records grouped position rotation and scale keyframes", async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-set-transform")).toBeVisible();

  await page.locator("#timeline-set-transform").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Position");
  await expect(page.getByRole("button", { name: "Cube Position X", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cube Scale Z", exact: true })).toBeVisible();
  await expect(page.locator("#timeline-add-keyframe")).toContainText("Update Key");
  await page.locator("#timeline-track-kind").selectOption("rotation");
  await expect(page.locator("#timeline-add-keyframe")).toContainText("Update Key");
  await page.locator("#timeline-track-kind").selectOption("scale");
  await expect(page.locator("#timeline-add-keyframe")).toContainText("Update Key");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="rotation"][data-axis="y"]').evaluate((input) => {
    (input as HTMLInputElement).value = "90";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="scale"][data-axis="z"]').evaluate((input) => {
    (input as HTMLInputElement).value = "1.75";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click();

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(1, 1);
  expect(Number(await page.locator('.transform-input[data-prop="rotation"][data-axis="y"]').inputValue())).toBeCloseTo(45, 1);
  expect(Number(await page.locator('.transform-input[data-prop="scale"][data-axis="z"]').inputValue())).toBeCloseTo(1.375, 2);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click();
  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-ease-hold").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-ease-linear").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(0, 1);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(3, 1);
  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position");
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  await expect(page.locator("#timeline-graph-x")).not.toHaveAttribute("d", "");
  await page.locator('.timeline-track-label[data-track-kind="position"][data-track-axis="x"]').click();
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position X");
  const middleGraphKey = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
  await expect(middleGraphKey).toBeVisible();
  const keyBox = await middleGraphKey.boundingBox();
  expect(keyBox).toBeTruthy();
  await page.mouse.move(keyBox!.x + keyBox!.width / 2, keyBox!.y + keyBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(keyBox!.x + keyBox!.width / 2 + 52, keyBox!.y - 22);
  await page.mouse.up();
  const movedKeyTime = Number(await page.locator(".timeline-graph-key.graph-x.selected").first().getAttribute("data-key-time"));
  expect(movedKeyTime).toBeGreaterThan(2.1);
  expect(movedKeyTime).toBeCloseTo(Math.round(movedKeyTime * 2) / 2, 2);
  await page.locator("#timeline-current-time").evaluate((input, time) => {
    (input as HTMLInputElement).value = String(time);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, movedKeyTime);
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeGreaterThan(2.1);
  await page.locator("#undo-btn").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(2, 1);
  const restoredKey = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
  await expect(restoredKey).toBeVisible();
  const restoredBox = await restoredKey.boundingBox();
  expect(restoredBox).toBeTruthy();
  await page.mouse.move(restoredBox!.x + restoredBox!.width / 2, restoredBox!.y + restoredBox!.height / 2);
  await page.keyboard.down("Shift");
  await page.mouse.down();
  await page.mouse.move(restoredBox!.x + restoredBox!.width / 2 + 12, restoredBox!.y - 28);
  await page.mouse.up();
  await page.keyboard.up("Shift");
  const constrainedKeyTime = Number(await page.locator(".timeline-graph-key.graph-x.selected").first().getAttribute("data-key-time"));
  expect(constrainedKeyTime).toBeCloseTo(2, 2);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeGreaterThan(2.1);
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  const firstGraphKey = page.locator('.timeline-graph-key.graph-x[data-key-time="0"]').first();
  const middleGraphKeyAgain = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
  await expect(firstGraphKey).toBeVisible();
  await expect(middleGraphKeyAgain).toBeVisible();
  await firstGraphKey.click();
  await page.keyboard.down("Shift");
  await middleGraphKeyAgain.click();
  await page.keyboard.up("Shift");
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  await page.keyboard.press("Delete");
  await expect(page.locator("#timeline-graph-range")).toContainText("1 key | add another key");
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  const deletableKey = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
  await expect(deletableKey).toBeVisible();
  await deletableKey.click();
  await page.keyboard.press("Delete");
  await expect(page.locator("#timeline-graph-range")).toContainText("2 keys");
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await expect(page.locator("#outliner")).toContainText("Cube");
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  const selectedMiddleKey = page.locator('.timeline-graph-key.graph-x.selected[data-key-time="2"]').first();
  await expect(selectedMiddleKey).toBeVisible();
  const selectedMiddleBox = await selectedMiddleKey.boundingBox();
  expect(selectedMiddleBox).toBeTruthy();
  await page.mouse.move(selectedMiddleBox!.x + selectedMiddleBox!.width / 2, selectedMiddleBox!.y + selectedMiddleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(selectedMiddleBox!.x + selectedMiddleBox!.width / 2 + 56, selectedMiddleBox!.y + selectedMiddleBox!.height / 2);
  await page.mouse.up();
  const groupedTimes = await page.locator(".timeline-graph-key.graph-x.selected").evaluateAll((nodes) =>
    nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))).sort((left, right) => left - right)
  );
  expect(groupedTimes).toHaveLength(3);
  expect(groupedTimes[0]).toBeGreaterThan(0.1);
  expect(groupedTimes[1] - groupedTimes[0]).toBeCloseTo(2, 1);
  expect(groupedTimes[2] - groupedTimes[1]).toBeCloseTo(2, 1);
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "0.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.keyboard.press("Control+A");
  const stretchMiddleKey = page.locator('.timeline-graph-key.graph-x.selected[data-key-time="2"]').first();
  await expect(stretchMiddleKey).toBeVisible();
  const stretchMiddleBox = await stretchMiddleKey.boundingBox();
  expect(stretchMiddleBox).toBeTruthy();
  await page.mouse.move(stretchMiddleBox!.x + stretchMiddleBox!.width / 2, stretchMiddleBox!.y + stretchMiddleBox!.height / 2);
  await page.keyboard.down("Alt");
  await page.mouse.down();
  await page.mouse.move(stretchMiddleBox!.x + stretchMiddleBox!.width / 2 + 76, stretchMiddleBox!.y + stretchMiddleBox!.height / 2);
  await page.mouse.up();
  await page.keyboard.up("Alt");
  const stretchedTimes = await page.locator(".timeline-graph-key.graph-x.selected").evaluateAll((nodes) =>
    nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))).sort((left, right) => left - right)
  );
  expect(stretchedTimes).toHaveLength(3);
  expect(stretchedTimes[0]).toBeCloseTo(0, 1);
  expect(stretchedTimes[1]).toBeGreaterThan(2.2);
  expect(stretchedTimes[2] - stretchedTimes[1]).toBeCloseTo(stretchedTimes[1] - stretchedTimes[0], 1);
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  expect(errors).toEqual([]);
});

test("supports undo redo scene loading and evaluation tour", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  await page.getByRole("button", { name: "Cone", exact: true }).click();
  await expect(page.locator("#selection-summary")).toContainText("Cone");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("#selection-summary")).not.toContainText("Cone");
  await page.locator("#redo-btn").click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Cone");

  const sceneDocument = {
    version: 1,
    savedAt: new Date().toISOString(),
    selectedId: "object-42",
    playing: false,
    camera: {
      position: [4, 4, 8],
      target: [0, 1.2, 0],
      fov: 60,
      near: 0.1,
      far: 400
    },
    display: {
      grid: true,
      axes: true,
      stats: true,
      frustum: true
    },
    lights: {
      active: "point",
      helpers: true,
      shadows: true,
      sweep: false,
      ambientIntensity: 0.5,
      directional: { color: "#ffffff", intensity: 4, position: [6, 9, 5] },
      point: { color: "#fff1c7", intensity: 5, position: [3, 6, 4] },
      spot: { color: "#ffffff", intensity: 5, position: [4, 7, 4] }
    },
    objects: [
      {
        id: "object-42",
        name: "Loaded Cube",
        kind: "primitive",
        type: "cube",
        renderMode: "lines",
        materialMode: "basic",
        color: "#4bd0a0",
        textureName: "none",
        textureRepeat: [1, 1],
        animation: "none",
        position: [0, 0.02, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    ]
  };

  await page.locator("#scene-input").setInputFiles({
    name: "loaded.scene.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sceneDocument))
  });
  await expect(page.locator("#selection-summary")).toContainText("Loaded Cube");
  await expect(page.locator("#selection-summary")).toContainText("Lines");

  await page.getByRole("button", { name: "Evaluation Tour" }).click();
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await expect(page.locator("#outliner")).toContainText("Teapot");
  await expect(page.locator("#outliner")).toContainText("Sample Drone");
});

test("creates and saves transform keyframes on the timeline", async ({ page }) => {
  test.setTimeout(480_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByText("Keyframe Timeline")).toBeVisible();

  await page.locator("#timeline-add-keyframe").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Position");
  await expect(page.locator("#timeline-key-time")).toBeEnabled();
  await expect(page.locator("#timeline-key-x")).toBeEnabled();
  await page.locator("#timeline-key-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(0.27, 2);
  await page.locator("#timeline-key-x").evaluate((input) => {
    (input as HTMLInputElement).value = "1.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#timeline-key-x")).toHaveValue("1.25");
  await page.locator("#timeline-marker-label").evaluate((input) => {
    (input as HTMLInputElement).value = "Intro Beat";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-marker").click();
  await expect(page.locator(".timeline-marker")).toHaveCount(1);
  await expect(page.locator("#timeline-marker-label")).toHaveValue("Intro Beat");
  await page.locator("#timeline-marker-label").evaluate((input) => {
    (input as HTMLInputElement).value = "Opening Cue";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator(".timeline-marker")).toContainText("Opening Cue");
  await page.locator("#timeline-auto-key").check();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  await positionX.evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(positionX).toHaveValue("2");

  const timelineCanvas = page.locator("#timeline-canvas canvas").first();
  await expect(timelineCanvas).toBeVisible();
  await page.locator("#timeline-zoom-fit").click();
  await expect(page.locator("#timeline-zoom-in")).toBeVisible();
  await expect(page.locator("#timeline-zoom-out")).toBeVisible();
  await page.locator("#timeline-duplicate-keyframe").click();
  await expect(page.locator("#timeline-selection")).toContainText("1 keyframe selected");
  await page.locator("#timeline-ease-smooth").click();
  await expect(page.locator("#timeline-ease-smooth")).toHaveClass(/active/);
  await expect(page.locator("#timeline-ease-label")).toContainText("Easy Ease");
  await page.locator("#timeline-copy-keyframes").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();
  await expect(page.locator("#timeline-selection")).toContainText("1 keyframe selected");
  await page.locator("#timeline-nudge-right").click();
  await page.locator("#timeline-toggle-track").click();
  await expect(page.locator("#timeline-toggle-track")).toContainText("Track Off");
  await expect(page.locator('.timeline-track-label[data-track-kind="position"]').first()).toHaveClass(/disabled-track/);

  await page.locator("#timeline-track-kind").selectOption("rotation");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const rotationY = page.locator('.transform-input[data-prop="rotation"][data-axis="y"]');
  await rotationY.evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await expect(page.locator("#timeline-add-keyframe")).toContainText("Update Key");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await rotationY.evaluate((input) => {
    (input as HTMLInputElement).value = "360";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await rotationY.inputValue())).toBeCloseTo(180, 0);

  await page.locator("#timeline-track-kind").selectOption("cameraPosition");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const cameraX = page.locator('.camera-input[data-group="position"][data-prop="x"]');
  await cameraX.evaluate((input) => {
    (input as HTMLInputElement).value = "9";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(cameraX).toHaveValue("9");

  await page.locator('[data-light="point"]').click();
  await page.locator("#timeline-track-kind").selectOption("pointIntensity");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const pointIntensity = page.locator("#light-intensity");
  await pointIntensity.evaluate((input) => {
    (input as HTMLInputElement).value = "6";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(pointIntensity).toHaveValue("6");

  await page.locator("#timeline-track-kind").selectOption("objectColor");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectColor = page.locator("#object-color");
  await objectColor.evaluate((input) => {
    (input as HTMLInputElement).value = "#3366ff";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectColor).toHaveValue("#3366ff");

  await page.locator("#timeline-track-kind").selectOption("objectOpacity");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectOpacity = page.locator("#object-opacity");
  await objectOpacity.evaluate((input) => {
    (input as HTMLInputElement).value = "0.4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectOpacity).toHaveValue("0.4");

  await page.locator("#timeline-track-kind").selectOption("objectRoughness");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectRoughness = page.locator("#object-roughness");
  await objectRoughness.evaluate((input) => {
    (input as HTMLInputElement).value = "0.85";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectRoughness).toHaveValue("0.85");

  await page.locator("#timeline-track-kind").selectOption("objectMetalness");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3.35";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectMetalness = page.locator("#object-metalness");
  await objectMetalness.evaluate((input) => {
    (input as HTMLInputElement).value = "0.55";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectMetalness).toHaveValue("0.55");

  await page.locator('[data-texture="uv"]').click();
  await page.locator("#timeline-track-kind").selectOption("objectTextureRepeat");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.texture-repeat[data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.texture-repeat[data-axis="y"]').evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-track-kind").selectOption("objectTextureOffset");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.texture-offset[data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "0.15";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.texture-offset[data-axis="y"]').evaluate((input) => {
    (input as HTMLInputElement).value = "0.3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-track-kind").selectOption("objectTextureRotation");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#texture-rotation").evaluate((input) => {
    (input as HTMLInputElement).value = "45";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-track-kind").selectOption("objectVisibility");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectVisible = page.locator("#object-visible");
  await objectVisible.evaluate((input) => {
    (input as HTMLInputElement).checked = false;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectVisible).not.toBeChecked();
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "4.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  expect(sceneJson).toBeTruthy();
  const sceneDocument = JSON.parse(sceneJson as string);

  expect(sceneDocument.version).toBe(2);
  expect(sceneDocument.display.motionPath).toBe(true);
  expect(sceneDocument.timeline.version).toBe(9);
  expect(sceneDocument.timeline.duration).toBe(8);
  expect(sceneDocument.timeline.workStart).toBe(0.5);
  expect(sceneDocument.timeline.workEnd).toBe(4.5);
  expect(sceneDocument.timeline.autoKey).toBe(true);
  expect(sceneDocument.timeline.markers).toHaveLength(1);
  expect(sceneDocument.timeline.markers[0].label).toBe("Opening Cue");
  expect(sceneDocument.timeline.markers[0].time).toBeCloseTo(0.267, 3);
  expect(sceneDocument.timeline.camera.tracks).toHaveLength(1);
  expect(sceneDocument.timeline.camera.tracks[0].kind).toBe("cameraPosition");
  expect(sceneDocument.timeline.camera.tracks[0].keyframes).toHaveLength(2);
  expect(sceneDocument.timeline.camera.tracks[0].keyframes[1].value[0]).toBe(9);
  expect(sceneDocument.timeline.lights.tracks).toHaveLength(1);
  expect(sceneDocument.timeline.lights.tracks[0].kind).toBe("pointIntensity");
  expect(sceneDocument.timeline.lights.tracks[0].keyframes).toHaveLength(2);
  expect(sceneDocument.timeline.lights.tracks[0].keyframes[1].value[0]).toBe(6);
  expect(sceneDocument.timeline.objects.length).toBeGreaterThanOrEqual(3);
  const keyedCube = sceneDocument.timeline.objects.find((object: { tracks: Array<{ kind: string }> }) =>
    object.tracks.some((track) => track.kind === "objectColor")
  );
  expect(keyedCube).toBeTruthy();
  const objectTracks = keyedCube!.tracks as Array<{
    kind: string;
    enabled: boolean;
    keyframes: Array<{ time: number; value: number[]; interpolation: string }>;
  }>;
  const positionTrack = objectTracks.find((track) => track.kind === "position")!;
  const rotationTrack = objectTracks.find((track) => track.kind === "rotation")!;
  const colorTrack = objectTracks.find((track) => track.kind === "objectColor")!;
  const opacityTrack = objectTracks.find((track) => track.kind === "objectOpacity")!;
  const roughnessTrack = objectTracks.find((track) => track.kind === "objectRoughness")!;
  const metalnessTrack = objectTracks.find((track) => track.kind === "objectMetalness")!;
  const textureRepeatTrack = objectTracks.find((track) => track.kind === "objectTextureRepeat")!;
  const textureOffsetTrack = objectTracks.find((track) => track.kind === "objectTextureOffset")!;
  const textureRotationTrack = objectTracks.find((track) => track.kind === "objectTextureRotation")!;
  const visibilityTrack = objectTracks.find((track) => track.kind === "objectVisibility")!;
  expect(positionTrack.keyframes).toHaveLength(4);
  expect(positionTrack.enabled).toBe(false);
  expect(positionTrack.keyframes[0].time).toBeCloseTo(0.267, 3);
  expect(positionTrack.keyframes[0].value[0]).toBe(1.25);
  expect(positionTrack.keyframes[1].value[0]).toBe(2);
  const duplicatedPosition = positionTrack.keyframes.find((keyframe) => Math.abs(keyframe.time - 1.033) < 0.001)!;
  expect(duplicatedPosition.value[0]).toBe(2);
  expect(duplicatedPosition.interpolation).toBe("smooth");
  const pastedPosition = positionTrack.keyframes.find((keyframe) => Math.abs(keyframe.time - 1.533) < 0.001)!;
  expect(pastedPosition.value[0]).toBe(2);
  expect(pastedPosition.interpolation).toBe("smooth");
  expect(rotationTrack.keyframes).toHaveLength(2);
  expect(rotationTrack.keyframes[1].value[1]).toBeCloseTo(360, 3);
  expect(colorTrack.keyframes).toHaveLength(2);
  expect(colorTrack.keyframes[1].value[2]).toBeCloseTo(1, 3);
  expect(opacityTrack.keyframes).toHaveLength(2);
  expect(opacityTrack.keyframes[1].value[0]).toBe(0.4);
  expect(roughnessTrack.keyframes).toHaveLength(2);
  expect(roughnessTrack.keyframes[1].value[0]).toBe(0.85);
  expect(metalnessTrack.keyframes).toHaveLength(2);
  expect(metalnessTrack.keyframes[1].value[0]).toBe(0.55);
  expect(textureRepeatTrack.keyframes).toHaveLength(2);
  expect(textureRepeatTrack.keyframes[1].value).toEqual([2, 3, 0]);
  expect(textureOffsetTrack.keyframes).toHaveLength(2);
  expect(textureOffsetTrack.keyframes[1].value).toEqual([0.15, 0.3, 0]);
  expect(textureRotationTrack.keyframes).toHaveLength(2);
  expect(textureRotationTrack.keyframes[1].value[0]).toBeCloseTo(Math.PI / 4, 3);
  expect(visibilityTrack.keyframes).toHaveLength(2);
  expect(visibilityTrack.keyframes[1].value[0]).toBe(0);
  expect(sceneDocument.objects[0].textureName).toBe("uv");
  expect(sceneDocument.objects[0].textureRepeat).toEqual([2, 3]);
  expect(sceneDocument.objects[0].textureOffset).toEqual([0.15, 0.3]);
  expect(sceneDocument.objects[0].textureRotation).toBeCloseTo(Math.PI / 4, 3);

  await page.locator("#timeline-track-kind").selectOption("position");
  await timelineCanvas.click({ force: true });
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("4 keyframes selected");
  await page.keyboard.press("Control+X");
  await expect(page.locator("#timeline-selection")).toContainText("No keyframe selected");
  await page.locator("#undo-btn").click();
  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-clear-track").click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Keyframed");
  expect(errors).toEqual([]);
});
