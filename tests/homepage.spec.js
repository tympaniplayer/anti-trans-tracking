const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page.locator('.site-title')).toContainText('Anti-Trans Legislation Tracker');
  });

  test('displays stats bar with numeric values', async ({ page }) => {
    await expect(page.locator('#stat-total')).not.toHaveText('—');
    await expect(page.locator('#stat-states')).not.toHaveText('—');
    await expect(page.locator('#stat-signed')).not.toHaveText('—');
    await expect(page.locator('#stat-active')).not.toHaveText('—');

    const total = Number(await page.locator('#stat-total').textContent());
    expect(total).toBeGreaterThan(0);
  });

  test('renders bill cards', async ({ page }) => {
    const count = await page.locator('.bill-card').count();
    expect(count).toBeGreaterThan(0);
  });

  test('each bill card has required elements', async ({ page }) => {
    const firstCard = page.locator('.bill-card').first();
    await expect(firstCard.locator('.bill-card-id')).not.toBeEmpty();
    await expect(firstCard.locator('.bill-card-state')).not.toBeEmpty();
    await expect(firstCard.locator('.bill-card-title')).not.toBeEmpty();
    await expect(firstCard.locator('.status-badge')).toBeVisible();
    await expect(firstCard.locator('.cat-tag')).toBeVisible();
  });

  test('bill cards display sentiment badges', async ({ page }) => {
    const badgeCount = await page.locator('.bill-card .sentiment-badge').count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('displays last updated date in footer', async ({ page }) => {
    await expect(page.locator('#last-updated')).not.toHaveText('—');
  });

  test('footer links to data source and open data', async ({ page }) => {
    await expect(page.locator('.site-footer a[href*="legiscan"]')).toBeVisible();
    await expect(page.locator('.site-footer a[href*="bills.json"]')).toBeVisible();
  });
});
