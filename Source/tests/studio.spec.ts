import { expect, test } from "@playwright/test";

test("renders the studio and core controls", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Geometry Studio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cube", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Render mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record WebM" })).toBeVisible();
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await expect(page.locator("#timeline-prev-frame")).toBeVisible();
  await expect(page.locator("#timeline-next-frame")).toBeVisible();
  await expect(page.locator("#timeline-copy-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-paste-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-nudge-left")).toBeVisible();
  await expect(page.locator("#timeline-nudge-right")).toBeVisible();
  await expect(page.locator("#timeline-toggle-track")).toBeVisible();
  const rotationTrackLabel = page.locator('.timeline-track-label[data-track-kind="rotation"]').first();
  await rotationTrackLabel.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");
  await expect(rotationTrackLabel).toHaveClass(/active/);
  const cameraTrackLabel = page.locator('.camera-track-label[data-track-kind="cameraPosition"]');
  await cameraTrackLabel.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("cameraPosition");
  await expect(cameraTrackLabel).toHaveClass(/active/);
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

  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return false;
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    const pixels = new Uint8Array(4);
    gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels.some((value) => value > 0);
  });

  await page.getByRole("button", { name: "Sphere", exact: true }).click();
  await expect(page.locator("#selection-summary")).toContainText("Sphere");

  await page.locator('[data-render="lines"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Lines");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Cube", exact: true })).toBeVisible();
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
  await page.locator("#timeline-interpolation").selectOption("smooth");
  await page.locator("#timeline-copy-keyframes").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();
  await page.locator("#timeline-nudge-right").click();
  await page.locator("#timeline-toggle-track").click();
  await expect(page.locator("#timeline-toggle-track")).toContainText("Track Off");
  await expect(page.locator('.timeline-track-label[data-track-kind="position"]').first()).toHaveClass(/disabled-track/);

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
  expect(sceneDocument.timeline.version).toBe(8);
  expect(sceneDocument.timeline.duration).toBe(8);
  expect(sceneDocument.timeline.workStart).toBe(0.5);
  expect(sceneDocument.timeline.workEnd).toBe(4.5);
  expect(sceneDocument.timeline.autoKey).toBe(true);
  expect(sceneDocument.timeline.camera.tracks).toHaveLength(1);
  expect(sceneDocument.timeline.camera.tracks[0].kind).toBe("cameraPosition");
  expect(sceneDocument.timeline.camera.tracks[0].keyframes).toHaveLength(2);
  expect(sceneDocument.timeline.camera.tracks[0].keyframes[1].value[0]).toBe(9);
  expect(sceneDocument.timeline.lights.tracks).toHaveLength(1);
  expect(sceneDocument.timeline.lights.tracks[0].kind).toBe("pointIntensity");
  expect(sceneDocument.timeline.lights.tracks[0].keyframes).toHaveLength(2);
  expect(sceneDocument.timeline.lights.tracks[0].keyframes[1].value[0]).toBe(6);
  expect(sceneDocument.timeline.objects).toHaveLength(1);
  const objectTracks = sceneDocument.timeline.objects[0].tracks as Array<{
    kind: string;
    enabled: boolean;
    keyframes: Array<{ time: number; value: number[]; interpolation: string }>;
  }>;
  const positionTrack = objectTracks.find((track) => track.kind === "position")!;
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
  expect(positionTrack.keyframes[1].value[0]).toBe(2);
  expect(positionTrack.keyframes[1].interpolation).toBe("smooth");
  const pastedPosition = positionTrack.keyframes.find((keyframe) => Math.abs(keyframe.time - 1.533) < 0.001)!;
  expect(pastedPosition.value[0]).toBe(2);
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
  await page.locator("#timeline-clear-track").click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Keyframed");
  expect(errors).toEqual([]);
});
