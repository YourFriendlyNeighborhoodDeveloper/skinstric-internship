import { test, expect } from "@playwright/test";

for (const source of ["upload", "selfie"]) {
  test(`real APIs complete the ${source} and demographic flow`, async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("/test");
    await page.getByLabel("Your name", { exact: true }).fill("Integration Test");
    await page.getByRole("button", { name: "Proceed", exact: true }).click();
    await page.getByLabel("Your location", { exact: true }).fill("Test City");
    await page.getByRole("button", { name: "Proceed", exact: true }).click();
    await expect(page).toHaveURL(/\/test\/image$/, { timeout: 35000 });

    if (source === "selfie") {
      await page.getByRole("link", { name: "Allow A.I. to scan your face" }).click();
      await page.getByRole("button", { name: "Enable camera" }).click();
      await page.getByRole("button", { name: "Take photo", exact: true }).click();
    } else {
      const base64 = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 96;
        canvas.height = 128;
        canvas.getContext("2d").fillRect(0, 0, 96, 128);
        return canvas.toDataURL("image/png").split(",")[1];
      });
      await page.getByLabel("Upload photo").setInputFiles({
        name: "generated-test.png",
        mimeType: "image/png",
        buffer: Buffer.from(base64, "base64"),
      });
    }

    await page.getByRole("button", { name: "Use this photo" }).click();
    await expect(page).toHaveURL(/\/test\/analysis$/, { timeout: 35000 });
    await page.getByRole("link", { name: "Get summary" }).click();
    for (const category of ["race", "age", "gender"]) {
      const card = page.getByRole("navigation", { name: "Demographic categories" })
        .getByRole("button").filter({ has: page.getByText(category, { exact: true }) });
      await card.click();
      const rows = page.getByRole("radiogroup", { name: `Select your ${category}` }).locator("label");
      const percentages = await rows.locator("span:last-child").allTextContents();
      expect(percentages.length).toBe(category === "race" ? 7 : category === "age" ? 9 : 2);
      const scores = percentages.map((percentage) => {
        expect(percentage).toMatch(/^\d+\.\d{2}%$/);
        return Number(percentage.slice(0, -1));
      });
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
      const last = rows.last().getByRole("radio");
      const label = await last.getAttribute("value");
      await last.check();
      await expect(last).toBeChecked();
      await expect(card).toContainText(label);
    }
  });
}
