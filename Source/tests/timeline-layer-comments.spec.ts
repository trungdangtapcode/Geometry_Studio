import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  objects: Array<{ id: string; name: string; layerComment?: string }>;
};

test("sets searchable layer comments and preserves them when duplicating layers", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Layer comment");
    await dialog.accept("Hero reveal beat");
  });
  await runCommand(page, "set layer comment", "timeline.set-layer-comment");

  const cubeGroup = page.locator('.timeline-track-group[data-group-target-id="object-1"]');
  await expect(cubeGroup).toHaveAttribute("data-layer-comment", "Hero reveal beat");
  await expect(cubeGroup.locator(".track-label-text small")).toContainText("Hero reveal beat");

  await page.locator("#timeline-row-search").fill("hero reveal");
  await expect(cubeGroup).toBeVisible();
  await expect(page.locator('.timeline-track-group[data-group-target-id="object-2"]')).toHaveCount(0);

  const commentedScene = await saveScene(page);
  const cube = commentedScene.objects.find((object) => object.name === "Cube");
  expect(cube?.layerComment).toBe("Hero reveal beat");

  await page.locator("#timeline-row-search").fill("");
  await page.locator("#timeline-duplicate-layer").click();
  await expect(page.locator("#selection-summary")).toContainText("Cube Copy");

  const duplicatedScene = await saveScene(page);
  const duplicate = duplicatedScene.objects.find((object) => object.id === duplicatedScene.selectedId);
  expect(duplicate?.name).toBe("Cube Copy");
  expect(duplicate?.layerComment).toBe("Hero reveal beat");
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
