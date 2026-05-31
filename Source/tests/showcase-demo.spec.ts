import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  objects: Array<{ name: string; renderMode: string }>;
  timeline: {
    duration: number;
    loop: boolean;
    objects: Array<{
      objectId: string;
      tracks: Array<{ kind: string; keyframes: Array<{ time: number; value: number[] }> }>;
    }>;
  };
};

test("stages the coursework showcase scene with editable motion keys", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#showcase-btn").click();
  await expect(page.locator("#selection-summary")).toContainText("White Wire Sphere");
  await expect(page.locator("#renderer-mode")).toContainText(/Bloom On.*Vignette On/);
  await expect(page.locator("#timeline-play-toggle")).toContainText("Stop");
  await page.keyboard.press("K");
  await expect(page.locator("#timeline-play-toggle")).toContainText("Play");

  const scene = await saveScene(page);
  expect(scene.timeline.duration).toBe(6);
  expect(scene.timeline.loop).toBe(true);
  expect(scene.objects.map((object) => object.name)).toEqual([
    "Animated Shadow Study",
    "Glass Sphere Shadow Caster",
    "White Wire Sphere"
  ]);
  expect(scene.objects.find((object) => object.name === "White Wire Sphere")?.renderMode).toBe("lines");
  expect(scene.timeline.objects.some((object) =>
    object.tracks.some((track) => track.kind === "position" && track.keyframes.length >= 4)
  )).toBe(true);
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

async function saveScene(page: Page): Promise<SceneExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
