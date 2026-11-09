import { test, expect } from "./fixtures";

test("Settings controls persist preferences and expose honest, accessible states", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem("yomirra-onboarding", JSON.stringify({ state: { hasCompletedOnboarding: true }, version: 0 })));
  await page.goto("/settings");
  await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  await expect(page.locator('[data-testid="splash-screen"]')).toHaveCount(0);
  // Guests cannot enable restricted content; authenticated opt-in is a separate auth-gated flow.
  await expect(page.getByText("Terkunci", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Tampilkan NSFW", exact: true })).toHaveCount(0);
  await expect(page.getByText(/Masuk dengan akun Google untuk mengaktifkan konten dewasa/)).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Hemat data", exact: true })).not.toBeChecked();
  await page.locator('label[for="data-saver"]').click();
  await expect(page.getByRole("checkbox", { name: "Hemat data", exact: true })).toBeChecked();
  await page.locator('label[for="check-on-start"]').click();
  await expect(page.getByRole("button", { name: "Jeda pengecekan: 15 Menit", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: /^Bahasa utama:/ }).click();
  await page.getByRole("menuitemradio", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Gelap", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("link", { name: /^Kelola sumber/ })).toHaveAttribute("href", "/sources");
  await page.reload();
  await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Hemat data", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Cek otomatis saat dibuka", exact: true })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Jeda pengecekan: 15 Menit", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Bahasa utama: English", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByText("Terkunci", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Tampilkan NSFW", exact: true })).toHaveCount(0);
});
