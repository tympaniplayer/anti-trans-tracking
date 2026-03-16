const { test, expect } = require('@playwright/test');

test.describe('US Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
  });

  test('loads the SVG map', async ({ page }) => {
    await expect(page.locator('#map-container svg')).toBeVisible();
  });

  test('has state path elements', async ({ page }) => {
    await expect(page.locator('#map-container svg path#TX')).toBeVisible();
    await expect(page.locator('#map-container svg path#FL')).toBeVisible();
    await expect(page.locator('#map-container svg path#CA')).toBeVisible();
  });

  test('states with bills are colored', async ({ page }) => {
    const fill = await page.locator('#map-container svg path#TX').evaluate(
      el => el.style.fill || getComputedStyle(el).fill
    );
    // Should not be the default gray
    expect(fill).not.toBe('#f0f0f0');
    expect(fill).not.toBe('rgb(240, 240, 240)');
  });

  test('clicking a state filters the bill list', async ({ page }) => {
    await page.locator('#map-container svg path#TX').click({ force: true });
    await page.waitForTimeout(200);
    await expect(page.locator('#filter-state')).toHaveValue('TX');
    const cards = page.locator('.bill-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('Texas');
    }
  });

  test('map legend is visible', async ({ page }) => {
    await expect(page.locator('.map-legend')).toBeVisible();
    const items = await page.locator('.legend-item').count();
    expect(items).toBeGreaterThan(0);
  });
});
