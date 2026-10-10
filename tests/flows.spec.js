import { test, expect } from "@playwright/test";

const demographics = {
  race: { black: 0.2, white: 0.05, "southeast asian": 0.04, "south asian": 0.55, "latino hispanic": 0.03, "east asian": 0.1, "middle eastern": 0.03 },
  age: { "20-29": 0.1, "30-39": 0.7, "40-49": 0.05, "10-19": 0.04, "50-59": 0.03, "3-9": 0.02, "60-69": 0.02, "70+": 0.02, "0-2": 0.02 },
  gender: { male: 0.4, female: 0.6 },
};

const cors = { "access-control-allow-origin": "*" };

test.beforeEach(async ({ page }) => {
  await page.route("**/skinstricPhaseOne", (route) => route.fulfill({ headers: cors, json: { success: true, message: "Added to the list successfully!" } }));
  await page.route("**/skinstricPhaseTwo", (route) => route.fulfill({ headers: cors, json: { success: true, data: demographics } }));
});

async function enterProfile(page, name = "Élodie O’Neill", location = "São Paulo") {
  await page.goto("/test");
  await page.getByLabel("Your name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await page.getByLabel("Your location", { exact: true }).fill(location);
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await expect(page).toHaveURL(/\/test\/image$/);
}

async function uploadPhoto(page, dimensions = { width: 96, height: 128 }) {
  const base64 = await page.evaluate(({ width, height }) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = "#b8a08e";
    context.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/png").split(",")[1];
  }, dimensions);
  await page.getByLabel("Upload photo").setInputFiles({ name: "test.png", mimeType: "image/png", buffer: Buffer.from(base64, "base64") });
  await expect(page.getByRole("heading", { name: "Review your photo" })).toBeVisible();
}

async function openResults(page) {
  await enterProfile(page);
  await uploadPhoto(page);
  await page.getByRole("button", { name: "Use this photo" }).click();
  await expect(page).toHaveURL(/\/test\/analysis$/);
  await page.getByRole("link", { name: "Demographics", exact: true }).click();
  await expect(page).toHaveURL(/\/test\/results$/);
}

async function trackCamera(page, delay = 0) {
  await page.addInitScript((wait) => {
    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.testStreams = [];
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await getUserMedia(constraints);
      window.testStreams.push(stream);
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      return stream;
    };
  }, delay);
}

test("landing navigation and both field validations preserve back-navigation values", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sophisticated skincare" })).toBeVisible();
  await page.getByRole("link", { name: "Take test", exact: true }).first().click();
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Enter your name.");
  for (const invalid of ["Jane123", "@@@", "   "]) {
    await page.getByLabel("Your name", { exact: true }).fill(invalid);
    await page.getByRole("button", { name: "Proceed", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/test$/);
  }
  await page.getByLabel("Your name", { exact: true }).fill("李");
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await page.getByLabel("Your location", { exact: true }).fill("City 5");
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("numbers and symbols");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("李");
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await expect(page.getByLabel("Your location", { exact: true })).toHaveValue("City 5");
  await page.getByLabel("Your location", { exact: true }).fill("東京都");
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await expect(page).toHaveURL(/\/test\/image$/);
});

test("Phase One posts trimmed Unicode values and sends one request", async ({ page }) => {
  const requests = [];
  await page.route("**/skinstricPhaseOne", async (route) => {
    requests.push(route.request().postDataJSON());
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({ headers: cors, json: { success: true } });
  });
  await enterProfile(page, " Élodie O’Neill ", " São Paulo ");
  expect(requests).toEqual([{ name: "Élodie O’Neill", location: "São Paulo" }]);
});

test("profile failures remain on the form and recover on retry", async ({ page }) => {
  await page.route("**/skinstricPhaseOne", (route) => route.abort("failed"));
  await page.goto("/test");
  await page.getByLabel("Your name", { exact: true }).fill("Jane Doe");
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await page.getByLabel("Your location", { exact: true }).fill("Paris");
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Check your connection");
  await expect(page.getByLabel("Your location", { exact: true })).toHaveValue("Paris");
  await page.route("**/skinstricPhaseOne", (route) => route.fulfill({ headers: cors, json: { success: true } }));
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await expect(page).toHaveURL(/\/test\/image$/);
});

test("upload converts to raw JPEG Base64 and clears the photo after analysis", async ({ page }) => {
  const requests = [];
  await page.route("**/skinstricPhaseTwo", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ headers: cors, json: { success: true, data: demographics } });
  });
  await enterProfile(page);
  await uploadPhoto(page);
  await page.getByRole("button", { name: "Use this photo" }).click();
  await expect(page).toHaveURL(/\/test\/analysis$/);
  expect(requests).toHaveLength(1);
  expect(Object.keys(requests[0])).toEqual(["image"]);
  expect(requests[0].image).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  expect([...Buffer.from(requests[0].image, "base64").subarray(0, 2)]).toEqual([255, 216]);
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Let’s get to know you" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Your photo, ready for analysis" })).toHaveCount(0);
  const saved = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
  expect(saved).toEqual({ local: 0, session: 0 });
});

test("invalid formats, corrupt files, and oversized uploads show recoverable errors", async ({ page }) => {
  await enterProfile(page);
  await page.getByLabel("Upload photo").setInputFiles({ name: "text.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("JPEG, PNG, or WebP");
  await page.getByLabel("Upload photo").setInputFiles({ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be opened");
  await page.getByLabel("Upload photo").setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("smaller than 10 MB");
  await uploadPhoto(page);
});

test("large photos are resized before sending them to the service", async ({ page }) => {
  await enterProfile(page);
  await uploadPhoto(page, { width: 2400, height: 1200 });
  const preview = page.getByRole("img", { name: "Your photo, ready for analysis" });
  await expect.poll(() => preview.evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }))).toEqual({ width: 1600, height: 800 });
});

test("photo review Back discards the upload and returns to photo options", async ({ page }) => {
  await enterProfile(page);
  await uploadPhoto(page);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Let’s get to know you" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Your photo, ready for analysis" })).toHaveCount(0);
  await uploadPhoto(page);
  await page.getByRole("button", { name: "Choose another photo" }).click();
  await expect(page.getByRole("heading", { name: "Let’s get to know you" })).toBeVisible();
});

test("image service errors never produce results and the same photo can be retried", async ({ page }) => {
  await enterProfile(page);
  await uploadPhoto(page);
  for (const response of [
    { status: 503, json: { success: false } },
    { status: 200, json: { success: false, message: "Rejected" } },
    { status: 200, json: { success: true, data: { ...demographics, age: {} } } },
    { status: 200, json: { success: true, data: { ...demographics, gender: { male: 5 } } } },
    { status: 200, contentType: "application/json", body: "invalid json" },
  ]) {
    await page.route("**/skinstricPhaseTwo", (route) => route.fulfill({ headers: cors, ...response }));
    await page.getByRole("button", { name: "Use this photo" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/test\/image$/);
    await expect(page.getByRole("heading", { name: "Review your photo" })).toBeVisible();
  }
  await page.route("**/skinstricPhaseTwo", (route) => route.fulfill({ headers: cors, json: { success: true, data: demographics } }));
  await page.getByRole("button", { name: "Use this photo" }).click();
  await expect(page).toHaveURL(/\/test\/analysis$/);
});

test("scores are descending and selections synchronize the sidebar and confidence", async ({ page }) => {
  await openResults(page);
  const categories = page.getByRole("navigation", { name: "Demographic categories" });
  const race = page.getByRole("radiogroup", { name: "Select your race" });
  await expect(race.locator("label")).toHaveText(["south asian55.00%", "black20.00%", "east asian10.00%", "white5.00%", "southeast asian4.00%", "latino hispanic3.00%", "middle eastern3.00%"]);
  await page.getByRole("radio", { name: "black 20.00%" }).check();
  await expect(categories.getByRole("button", { name: "black Race", exact: false })).toBeVisible();
  await expect(page.getByRole("region", { name: "race confidence" })).toContainText("20.00%");
  await expect(race.locator("label").first()).toContainText("55.00%");
  await categories.getByRole("button", { name: "30-39 Age" }).click();
  await expect(page.getByRole("radiogroup", { name: "Select your age" }).locator("label")).toHaveText(["30-3970.00%", "20-2910.00%", "40-495.00%", "10-194.00%", "50-593.00%", "3-92.00%", "60-692.00%", "70+2.00%", "0-22.00%"]);
  await page.getByRole("radio", { name: "20-29 10.00%" }).check();
  await expect(categories.getByRole("button", { name: "20-29 Age" })).toBeVisible();
  await categories.getByRole("button", { name: "female Gender" }).click();
  await expect(page.getByRole("radiogroup", { name: "Select your gender" }).locator("label")).toHaveText(["female60.00%", "male40.00%"]);
  await page.getByRole("radio", { name: "male 40.00%", exact: true }).check();
  await expect(categories.getByRole("button", { name: "male gender", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset selections" }).click();
  await expect(categories.getByRole("button", { name: "south asian Race" })).toBeVisible();
  await expect(categories.getByRole("button", { name: "30-39 Age" })).toBeVisible();
  await expect(categories.getByRole("button", { name: "female Gender" })).toBeVisible();
});

test("attribute selections survive navigation without another API request", async ({ page }) => {
  let requests = 0;
  await page.route("**/skinstricPhaseTwo", (route) => { requests += 1; return route.fulfill({ headers: cors, json: { success: true, data: demographics } }); });
  await openResults(page);
  await page.getByRole("radio", { name: "black 20.00%" }).check();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await page.getByRole("link", { name: "Get summary" }).click();
  await expect(page.getByRole("radio", { name: "black 20.00%" })).toBeChecked();
  expect(requests).toBe(1);
});

test("direct routes and refresh recover without fabricated results", async ({ page }) => {
  for (const path of ["/test/image", "/test/camera", "/test/analysis", "/test/results"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Let’s start with you" })).toBeVisible();
  }
  await openResults(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Let’s start with you" })).toBeVisible();
  await page.getByRole("link", { name: "Start test", exact: true }).click();
  await expect(page.getByLabel("Your name", { exact: true })).toBeVisible();
});

test("navigation cancels profile submission and the form is usable on return", async ({ page }) => {
  let resolveRequest;
  const started = new Promise((resolve) => { resolveRequest = resolve; });
  await page.route("**/skinstricPhaseOne", async (route) => {
    resolveRequest();
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fulfill({ headers: cors, json: { success: true } });
  });
  await page.goto("/test");
  await page.getByLabel("Your name", { exact: true }).fill("Jane Doe");
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await page.getByLabel("Your location", { exact: true }).fill("Paris");
  await page.getByRole("button", { name: "Proceed", exact: true }).click();
  await started;
  await page.getByRole("link", { name: "Skinstric home" }).click();
  await expect(page).toHaveURL("/");
  await page.goBack();
  await expect(page).toHaveURL(/\/test$/);
  await expect(page.getByRole("button", { name: "Proceed", exact: true })).toBeEnabled();
});

test("camera permission and missing-device errors offer working upload navigation", async ({ page }) => {
  await page.addInitScript(() => {
    let attempts = 0;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia() {
          attempts += 1;
          throw new DOMException("Test camera error", attempts === 1 ? "NotAllowedError" : "NotFoundError");
        },
      },
    });
  });
  await enterProfile(page);
  await page.getByRole("link", { name: "Allow A.I. to scan your face" }).click();
  await page.getByRole("button", { name: "Enable camera" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("permission was denied");
  await page.getByRole("button", { name: "Enable camera" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("No camera was found");
  await page.getByRole("link", { name: "Back to photo options" }).click();
  await uploadPhoto(page);
});

test("selfie capture stops tracks, supports retake, and submits through Phase Two", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Native fake camera device is provided by Chromium.");
  await trackCamera(page);
  await enterProfile(page);
  await page.getByRole("link", { name: "Allow A.I. to scan your face" }).click();
  await page.getByRole("button", { name: "Enable camera" }).click();
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review your photo" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.testStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")))).toBe(true);
  await page.getByRole("button", { name: "Retake photo" }).click();
  await page.getByRole("button", { name: "Enable camera" }).click();
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  const request = page.waitForRequest("**/skinstricPhaseTwo");
  await page.getByRole("button", { name: "Use this photo" }).click();
  expect((await request).postDataJSON().image).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  await expect(page).toHaveURL(/\/test\/analysis$/);
  await page.getByRole("link", { name: "Get summary" }).click();
  await expect(page.getByRole("heading", { name: "Demographics", exact: true })).toBeVisible();
});

test("camera tracks stop on navigation and late permission results are discarded", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Native fake camera device is provided by Chromium.");
  await trackCamera(page, 1000);
  await enterProfile(page);
  await page.getByRole("link", { name: "Allow A.I. to scan your face" }).click();
  await page.getByRole("button", { name: "Enable camera" }).click();
  await expect.poll(() => page.evaluate(() => window.testStreams.length)).toBe(1);
  await page.getByRole("link", { name: "Back to photo options" }).click();
  await expect.poll(() => page.evaluate(() => window.testStreams[0].getTracks().every((track) => track.readyState === "ended"))).toBe(true);
  await page.getByRole("link", { name: "Allow A.I. to scan your face" }).click();
  await page.getByRole("button", { name: "Enable camera" }).click();
  await expect(page.getByRole("button", { name: "Take photo", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to photo options" }).click();
  await expect.poll(() => page.evaluate(() => window.testStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")))).toBe(true);
});

test("landing, form, photo options, and result categories fit the viewport", async ({ page }) => {
  async function expectNoOverflow() {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expectNoOverflow();
    await page.goto("/test");
    await expectNoOverflow();
    await enterProfile(page);
    await expectNoOverflow();
    await uploadPhoto(page);
    await expectNoOverflow();
    await page.getByRole("button", { name: "Use this photo" }).click();
    await page.getByRole("link", { name: "Get summary" }).click();
    await expectNoOverflow();
    await page.getByRole("navigation", { name: "Demographic categories" }).getByRole("button", { name: "30-39 Age" }).click();
    await expectNoOverflow();
    await page.getByRole("button", { name: "Reset selections" }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Reset selections" })).toBeVisible();
  }
});
