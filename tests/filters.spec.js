const { test, expect } = require('@playwright/test');

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
  });

  test('state dropdown is populated', async ({ page }) => {
    const options = await page.locator('#filter-state option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('selecting a state filters the bill list', async ({ page }) => {
    await page.selectOption('#filter-state', 'TX');
    await page.waitForTimeout(200);
    const cards = page.locator('.bill-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('Texas');
    }
  });

  test('category checkboxes filter by category', async ({ page }) => {
    // Uncheck all
    const checkboxes = page.locator('#filter-category input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).uncheck();
    }
    // Check only healthcare
    await page.check('#filter-category input[value="healthcare"]');
    await page.waitForTimeout(200);
    const cards = page.locator('.bill-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    for (let i = 0; i < cardCount; i++) {
      await expect(cards.nth(i).locator('.cat-tag-healthcare')).toBeVisible();
    }
  });

  test('status checkboxes filter by status', async ({ page }) => {
    // Uncheck all statuses
    const checkboxes = page.locator('#filter-status input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).uncheck();
    }
    // Check only signed_into_law
    await page.check('#filter-status input[value="signed_into_law"]');
    await page.waitForTimeout(200);
    await expect(page.locator('.bill-card')).toHaveCount(3);
  });

  test('level filter shows only federal bills', async ({ page }) => {
    await page.uncheck('#filter-level input[value="state"]');
    await page.waitForTimeout(200);
    await expect(page.locator('.bill-card')).toHaveCount(1);
    await expect(page.locator('.bill-card').first()).toContainText('Federal');
  });

  test('reset button clears all filters', async ({ page }) => {
    await page.selectOption('#filter-state', 'TX');
    await page.waitForTimeout(200);
    expect(await page.locator('.bill-card').count()).toBeLessThan(12);
    await page.click('#filters-reset');
    await page.waitForTimeout(200);
    await expect(page.locator('.bill-card')).toHaveCount(12);
    await expect(page.locator('#filter-state')).toHaveValue('');
  });

  test('sort by state A-Z', async ({ page }) => {
    await page.selectOption('#sort-select', 'state-asc');
    await page.waitForTimeout(200);
    await expect(page.locator('.bill-card-state').first()).toContainText('Alabama');
  });

  test('sort toggles between newest and oldest', async ({ page }) => {
    const firstBefore = await page.locator('.bill-card-id').first().textContent();
    await page.selectOption('#sort-select', 'date-asc');
    await page.waitForTimeout(200);
    const firstAfter = await page.locator('.bill-card-id').first().textContent();
    expect(firstAfter).not.toBe(firstBefore);
  });
});
