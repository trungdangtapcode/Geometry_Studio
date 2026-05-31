import { expect, test, type Page } from "@playwright/test";

async function runCommand(page: Page, query: string, commandId: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill(query);
  await page.locator(`[data-command-id="${commandId}"]`).click({ force: true });
}

test("selects only selected-layer keyframes at the playhead", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-set-transform").click();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator('.outliner-item[data-id="object-2"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Wheel Torus");
  await page.locator("#timeline-set-transform").click();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");

  await page.locator('.outliner-item[data-id="object-1"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await page.locator("#timeline-row-search").fill("sphere");
  await page.locator("#timeline-select-layer-time").click();

  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("selectedKeyed");
  await expect(page.locator("#timeline-row-search")).toHaveValue("");
  await expect.poll(async () =>
    page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"]').count()
  ).toBeGreaterThan(0);
  await expect.poll(async () =>
    page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="rotation"]').count()
  ).toBeGreaterThan(0);
  await expect.poll(async () =>
    page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="scale"]').count()
  ).toBeGreaterThan(0);
  await expect(page.locator('.timeline-track-label[data-object-id="object-2"]')).toHaveCount(0);

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("selected layer keys at playhead");
  await expect(page.locator('[data-command-id="timeline.select-layer-time"]')).toBeEnabled();
  await page.keyboard.press("Escape");
  await runCommand(page, "set work area to selected layer keyframes", "timeline.work-area-layer-keys");
  await expect(page.locator("#timeline-work-start")).toHaveValue("0");
  await expect(page.locator("#timeline-work-end")).toHaveValue("1");
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await runCommand(page, "select selected layer work area keyframes", "timeline.select-layer-work");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await runCommand(page, "fit selected layer keyframe range", "timeline.fit-layer-key-range");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("selectedKeyed");
  await runCommand(page, "preview selected layer keyframe range", "timeline.preview-layer");
  await expect(page.locator("#timeline-work-start")).toHaveValue("0");
  await expect(page.locator("#timeline-work-end")).toHaveValue("1");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("K");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await runCommand(page, "select selected layer keys after playhead", "timeline.select-layer-after");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await runCommand(page, "select selected layer keys before playhead", "timeline.select-layer-before");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Alt+Shift+ArrowRight");
  await expect(page.locator("#timeline-current-time")).toHaveValue("1");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("selectedKeyed");
  await page.keyboard.press("Alt+Shift+ArrowLeft");
  await expect(page.locator("#timeline-current-time")).toHaveValue("0");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");

  expect(errors).toEqual([]);
});

test("copies and deletes selected-layer keyframes at the playhead", async ({ page }) => {
  test.setTimeout(120_000);
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
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click();

  await page.locator('.outliner-item[data-id="object-2"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Wheel Torus");
  await page.locator("#timeline-set-transform").click();

  await page.locator('.outliner-item[data-id="object-1"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await runCommand(page, "copy selected layer keys at playhead", "timeline.copy-layer-time");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await runCommand(page, "delete selected layer keys at playhead", "timeline.delete-layer-time");

  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#save-scene")?.click());
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const trackTimes = (objectId: string, kind: string) =>
    sceneDocument.timeline.objects
      .find((objectTimeline: { objectId: string }) => objectTimeline.objectId === objectId)
      ?.tracks.find((track: { kind: string }) => track.kind === kind)
      ?.keyframes.map((keyframe: { time: number }) => keyframe.time) ?? [];

  expect(trackTimes("object-1", "position")).toEqual([1]);
  expect(trackTimes("object-1", "rotation")).toEqual([1]);
  expect(trackTimes("object-1", "scale")).toEqual([1]);
  expect(trackTimes("object-2", "position")).toEqual([0]);
  expect(trackTimes("object-2", "rotation")).toEqual([0, 8]);
  expect(trackTimes("object-2", "scale")).toEqual([0]);
  expect(errors).toEqual([]);
});

test("lifts and extracts selected-layer work area without touching other layers", async ({ page }) => {
  test.setTimeout(180_000);
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
  for (const objectId of ["object-1", "object-2"]) {
    await page.locator(`.outliner-item[data-id="${objectId}"]`).click({ force: true });
    for (const time of [0, 1, 2]) {
      await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
        (input as HTMLInputElement).value = String(nextTime);
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, time);
      await page.locator("#timeline-set-transform").click();
    }
  }

  await page.locator('.outliner-item[data-id="object-1"]').click({ force: true });
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(page.locator("#timeline-insert-layer-gap")).toBeVisible();
  await expect(page.locator("#timeline-lift-layer-work")).toBeVisible();
  await expect(page.locator("#timeline-extract-layer-work")).toBeVisible();
  await page.locator("#timeline-lift-layer-work").click();
  await expect(page.locator("#timeline-row-filter")).toHaveValue("selectedKeyed");
  await page.locator("#timeline-extract-layer-work").click();
  await expect(page.locator("#timeline-row-filter")).toHaveValue("selectedKeyed");

  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#save-scene")?.click());
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const trackTimes = (objectId: string, kind: string) =>
    sceneDocument.timeline.objects
      .find((objectTimeline: { objectId: string }) => objectTimeline.objectId === objectId)
      ?.tracks.find((track: { kind: string }) => track.kind === kind)
      ?.keyframes.map((keyframe: { time: number }) => keyframe.time) ?? [];

  expect(trackTimes("object-1", "position")).toEqual([0, 1]);
  expect(trackTimes("object-1", "rotation")).toEqual([0, 1]);
  expect(trackTimes("object-1", "scale")).toEqual([0, 1]);
  expect(trackTimes("object-2", "position")).toEqual([0, 1, 2]);
  expect(trackTimes("object-2", "rotation")).toEqual([0, 1, 2, 8]);
  expect(trackTimes("object-2", "scale")).toEqual([0, 1, 2]);
  expect(errors).toEqual([]);
});

test("copies cuts and duplicates selected-layer work area keyframes", async ({ page }) => {
  test.setTimeout(180_000);
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
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  for (const objectId of ["object-1", "object-2"]) {
    await page.locator(`.outliner-item[data-id="${objectId}"]`).click({ force: true });
    for (const time of [0, 1, 2]) {
      await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
        (input as HTMLInputElement).value = String(nextTime);
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, time);
      await page.locator("#timeline-set-transform").click();
    }
  }

  await page.locator('.outliner-item[data-id="object-1"]').click({ force: true });
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await runCommand(page, "copy selected layer work area keyframes", "timeline.copy-layer-work");
  await expect(page.locator("#timeline-paste-keyframes")).toBeEnabled();

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();
  await runCommand(page, "duplicate selected layer work area keyframes", "timeline.duplicate-layer-work");
  await runCommand(page, "cut selected layer work area keyframes", "timeline.cut-layer-work");

  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#save-scene")?.click());
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const trackTimes = (objectId: string, kind: string) =>
    sceneDocument.timeline.objects
      .find((objectTimeline: { objectId: string }) => objectTimeline.objectId === objectId)
      ?.tracks.find((track: { kind: string }) => track.kind === kind)
      ?.keyframes.map((keyframe: { time: number }) => keyframe.time) ?? [];

  expect(trackTimes("object-1", "position")).toEqual([0, 2, 3, 4]);
  expect(trackTimes("object-1", "rotation")).toEqual([0, 2, 3, 4]);
  expect(trackTimes("object-1", "scale")).toEqual([0, 2, 3, 4]);
  expect(trackTimes("object-2", "position")).toEqual([0, 1, 2]);
  expect(trackTimes("object-2", "rotation")).toEqual([0, 1, 2, 8]);
  expect(trackTimes("object-2", "scale")).toEqual([0, 1, 2]);
  expect(errors).toEqual([]);
});

test("inserts a selected-layer gap without shifting other layers", async ({ page }) => {
  test.setTimeout(180_000);
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
  for (const objectId of ["object-1", "object-2"]) {
    await page.locator(`.outliner-item[data-id="${objectId}"]`).click({ force: true });
    for (const time of [0, 1, 2]) {
      await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
        (input as HTMLInputElement).value = String(nextTime);
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, time);
      await page.locator("#timeline-set-transform").click();
    }
  }

  await page.locator('.outliner-item[data-id="object-1"]').click({ force: true });
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-insert-layer-gap").click();
  await expect(page.locator("#timeline-row-filter")).toHaveValue("selectedKeyed");

  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#save-scene")?.click());
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const trackTimes = (objectId: string, kind: string) =>
    sceneDocument.timeline.objects
      .find((objectTimeline: { objectId: string }) => objectTimeline.objectId === objectId)
      ?.tracks.find((track: { kind: string }) => track.kind === kind)
      ?.keyframes.map((keyframe: { time: number }) => keyframe.time) ?? [];

  expect(trackTimes("object-1", "position")).toEqual([0, 2, 3]);
  expect(trackTimes("object-1", "rotation")).toEqual([0, 2, 3]);
  expect(trackTimes("object-1", "scale")).toEqual([0, 2, 3]);
  expect(trackTimes("object-2", "position")).toEqual([0, 1, 2]);
  expect(trackTimes("object-2", "rotation")).toEqual([0, 1, 2, 8]);
  expect(trackTimes("object-2", "scale")).toEqual([0, 1, 2]);
  expect(errors).toEqual([]);
});
