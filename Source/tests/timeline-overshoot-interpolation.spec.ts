import { expect, test, type Page } from "@playwright/test";

async function installSceneDownloadCapture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) void object.text().then((text) => downloads.push(text));
      return createObjectURL(object);
    };
  });
}

async function runCommand(page: Page, query: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await expect(page.locator("#command-palette-search")).toBeVisible();
  await page.locator("#command-palette-search").fill(query);
  await page.keyboard.press("Enter");
}

async function exportedScene(page: Page): Promise<{
  selectedId: string;
  timeline: { objects: Array<{ objectId: string; tracks: Array<{ kind: string; keyframes: Array<{ time: number; value: number[]; interpolation: string }> }> }> };
}> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string);
}

test("shows interpolation modes before a keyframe target exists", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");

  await expect(page.locator("#timeline-interpolation")).toBeEnabled();
  await expect(page.locator("#timeline-ease-back-in")).toBeVisible();
  await expect(page.locator("#timeline-ease-back-out")).toBeVisible();

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.37";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-interpolation").selectOption("easeIn");
  await expect(page.locator(".toast", { hasText: "Select a keyframe" })).toBeVisible();
  await expect(page.locator("#timeline-interpolation")).toHaveValue("linear");
});

test("applies back out interpolation with visible overshoot playback", async ({ page }) => {
  test.setTimeout(120_000);
  await installSceneDownloadCapture(page);
  await page.goto("/");

  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();

  await page.keyboard.press("Control+A");
  await page.locator("#timeline-ease-back-out").click();
  await expect(page.locator("#timeline-interpolation")).toHaveValue("backOut");
  await expect(page.locator("#timeline-ease-label")).toContainText("Back Out");

  await runCommand(page, "apply back in interpolation");
  await expect(page.locator("#timeline-interpolation")).toHaveValue("backIn");

  await page.locator("#timeline-ease-back-out").click();
  await expect(page.locator("#timeline-interpolation")).toHaveValue("backOut");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeGreaterThan(2);

  const scene = await exportedScene(page);
  const positionTrack = scene.timeline.objects
    .find((objectTimeline) => objectTimeline.objectId === scene.selectedId)
    ?.tracks.find((track) => track.kind === "position");
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.interpolation)).toEqual(["backOut", "backOut"]);
});
