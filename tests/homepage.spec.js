const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page.locator('.site-title')).toContainText('Anti-Trans Legislation Tracker');
  });

  test('displays stats bar with correct totals', async ({ page }) => {
    await expect(page.locator('#stat-total')).toHaveText('12');
    await expect(page.locator('#stat-states')).toHaveText('12');
    await expect(page.locator('#stat-signed')).toHaveText('3');
    await expect(page.locator('#stat-active')).not.toHaveText('—');
  });

  test('renders all bill cards', async ({ page }) => {
    await expect(page.locator('.bill-card')).toHaveCount(12);
  });

  test('each bill card has required elements', async ({ page }) => {
    const firstCard = page.locator('.bill-card').first();
    await expect(firstCard.locator('.bill-card-id')).not.toBeEmpty();
    await expect(firstCard.locator('.bill-card-state')).not.toBeEmpty();
    await expect(firstCard.locator('.bill-card-title')).not.toBeEmpty();
    await expect(firstCard.locator('.status-badge')).toBeVisible();
    await expect(firstCard.locator('.cat-tag')).toBeVisible();
  });

  test('displays last updated date in footer', async ({ page }) => {
    await expect(page.locator('#last-updated')).not.toHaveText('—');
  });

  test('footer links to data source and open data', async ({ page }) => {
    await expect(page.locator('.site-footer a[href*="legiscan"]')).toBeVisible();
    await expect(page.locator('.site-footer a[href*="bills.json"]')).toBeVisible();
  });
});
