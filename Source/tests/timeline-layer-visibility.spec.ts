import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  objects: Array<{ id: string; name: string; visible?: boolean }>;
};

test("toggles selected layer visibility and preserves it in saved scenes", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const cubeGroup = page.locator('.timeline-track-group[data-group-target-id="object-1"]');
  const cubeOutliner = page.locator('.outliner-item[data-id="object-1"]');
  const visibleToggle = page.locator("#object-visible");

  await expect(cubeOutliner).toHaveClass(/active/);
  await expect(visibleToggle).toBeChecked();

  await runCommand(page, "toggle selected layer visibility", "timeline.toggle-layer-visibility");
  await expect(visibleToggle).not.toBeChecked();
  await expect(cubeGroup).toHaveClass(/hidden-object-layer/);
  await expect(cubeGroup.locator(".track-label-text small")).toContainText("Hidden");
  await expect(cubeOutliner).toHaveClass(/hidden-object/);

  const hiddenScene = await saveScene(page);
  expect(hiddenScene.objects.find((object) => object.name === "Cube")?.visible).toBe(false);

  await page.keyboard.press("Alt+V");
  await expect(visibleToggle).toBeChecked();
  await expect(cubeGroup).not.toHaveClass(/hidden-object-layer/);
  await expect(cubeOutliner).not.toHaveClass(/hidden-object/);

  await page.keyboard.press("Alt+V");
  await expect(visibleToggle).not.toBeChecked();
  await runCommand(page, "show all object layers", "timeline.show-all-layers");
  await expect(visibleToggle).toBeChecked();
  await expect(cubeGroup).not.toHaveClass(/hidden-object-layer/);

  const shownScene = await saveScene(page);
  expect(shownScene.objects.every((object) => object.visible !== false)).toBe(true);
  expect(errors).toEqual([]);
});

async function runCommand(page: Page, query: string, commandId: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill(query);
  await expect(page.locator(`[data-command-id="${commandId}"]`)).toBeEnabled();
  await page.locator(`[data-command-id="${commandId}"]`).click({ force: true });
}

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

async function saveScene(page: Page): Promise<SceneExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
