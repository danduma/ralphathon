import { expect, test } from "@playwright/test";

test("screen and phone clients share the typed race event stream", async ({ browser, page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole("heading", { name: /Invisible execution/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start demo" })).toBeVisible();
  await expect(page.getByLabel("Four lane Rube Goldberg race machine")).toContainText("Atlas Planner");
  await expect(page.getByLabel("Phone join QR")).toContainText("/phone?session=");
  await expect(page.locator(".phone-link")).not.toContainText("127.0.0.1");

  const phoneContexts = await Promise.all([0, 1, 2, 3].map(() => browser.newContext({ viewport: { width: 390, height: 844 } })));
  const phones = await Promise.all(phoneContexts.map((context) => context.newPage()));
  for (const [index, phone] of phones.entries()) {
    await phone.goto("/phone");
    await expect(phone.getByRole("heading", { name: "Choose a lane" })).toBeVisible();
    await phone.getByRole("button", { name: index === 0 ? "Atlas Planner" : index === 1 ? "Bolt Builder" : index === 2 ? "Nova Fixer" : "Quill Verifier" }).click();
  }
  await page.screenshot({ path: "test-results/screen-desktop.png", fullPage: true });
  await phones[0].screenshot({ path: "test-results/phone-mobile.png", fullPage: true });

  await expect(page.locator(".race-topline")).toContainText("4/4");
  await page.getByRole("button", { name: "Start demo" }).click();
  await expect(page.getByText("agent.failed").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("agent.recovered").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("verification.passed").first()).toBeVisible({ timeout: 12_000 });
  await expect(page.getByText("Atlas Planner").first()).toBeVisible();
  await expect(phones[0].getByText(/Atlas verification passes|Atlas rings/)).toBeVisible({ timeout: 12_000 });
  await expect(page.locator(".race-topline")).toContainText("finished", { timeout: 12_000 });

  await Promise.all(phoneContexts.map((context) => context.close()));
});
