import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  timeline: {
    workStart: number;
    workEnd: number;
  };
};

test("sets Work In and Work Out from selected keyframes through the toolbar button", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-current-time")).toBeVisible();

  await page.locator("#timeline-track-kind").selectOption("position");
  await setPositionKey(page, 1, 2);
  await setPositionKey(page, 3, 6);

  await page.keyboard.press("Control+A");
  await page.locator("#timeline-work-selection").click();

  const scene = await saveScene(page);
  expect(scene.timeline.workStart).toBe(1);
  expect(scene.timeline.workEnd).toBe(3);
  expect(errors).toEqual([]);
});

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

async function setPositionKey(page: Page, time: number, x: number): Promise<void> {
  await setTimelineTime(page, time);
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input, value) => {
    (input as HTMLInputElement).value = String(value);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, x);
  await page.locator("#timeline-add-keyframe").click();
}

async function setTimelineTime(page: Page, time: number): Promise<void> {
  await page.locator("#timeline-current-time").evaluate((input, value) => {
    (input as HTMLInputElement).value = String(value);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, time);
}

async function saveScene(page: Page): Promise<SceneExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
