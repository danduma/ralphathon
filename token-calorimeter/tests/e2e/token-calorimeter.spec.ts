import { expect, test } from "@playwright/test";

test("main demo flow burns tokens, shows receipt, and simplifies", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("The Token Calorimeter")).toBeVisible();
  await page.getByRole("button", { name: /10 minutes late/i }).click();
  await page.getByRole("button", { name: /ignite/i }).click();

  await expect(page.getByTestId("token-counter")).not.toHaveText("0");
  await expect(page.getByRole("button", { name: /simplify/i })).toBeEnabled({ timeout: 15_000 });
  await expect(page.getByText("Same answer. Smaller fire.")).toBeVisible();
  await expect(page.getByTestId("receipt")).toBeVisible();

  await page.getByRole("button", { name: /simplify/i }).click();
  await expect(page.getByText(/removed/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Same message. Smaller fire./i)).toBeVisible();
});
