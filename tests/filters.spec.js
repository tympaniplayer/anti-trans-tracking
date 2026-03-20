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
    const cardCount = await page.locator('.bill-card').count();
    expect(cardCount).toBeGreaterThan(0);
    // Verify all visible cards have signed_into_law status
    for (let i = 0; i < cardCount; i++) {
      await expect(page.locator('.bill-card').nth(i).locator('.status-signed_into_law')).toBeVisible();
    }
  });

  test('level filter shows only federal bills', async ({ page }) => {
    await page.uncheck('#filter-level input[value="state"]');
    await page.waitForTimeout(200);
    const cards = page.locator('.bill-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('Federal');
    }
  });

  test('sentiment checkboxes filter by sentiment', async ({ page }) => {
    // Uncheck all sentiments
    const checkboxes = page.locator('#filter-sentiment input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).uncheck();
    }
    // Check only restrictive
    await page.check('#filter-sentiment input[value="restrictive"]');
    await page.waitForTimeout(200);
    const cards = page.locator('.bill-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    for (let i = 0; i < cardCount; i++) {
      await expect(cards.nth(i).locator('.sentiment-restrictive')).toBeVisible();
    }
  });

  test('reset button clears all filters', async ({ page }) => {
    const totalCount = await page.locator('.bill-card').count();
    await page.selectOption('#filter-state', 'TX');
    await page.waitForTimeout(200);
    expect(await page.locator('.bill-card').count()).toBeLessThan(totalCount);
    await page.click('#filters-reset');
    await page.waitForTimeout(200);
    await expect(page.locator('.bill-card')).toHaveCount(totalCount);
    await expect(page.locator('#filter-state')).toHaveValue('');
  });

  test('sort by state A-Z', async ({ page }) => {
    await page.selectOption('#sort-select', 'state-asc');
    await page.waitForTimeout(200);
    const states = await page.locator('.bill-card-state').allTextContents();
    expect(states.length).toBeGreaterThan(1);
    // First state alphabetically should come first
    const sorted = [...states].sort((a, b) => a.localeCompare(b));
    expect(states[0]).toBe(sorted[0]);
  });

  test('changing sort order rearranges bills', async ({ page }) => {
    await page.selectOption('#sort-select', 'date-desc');
    await page.waitForTimeout(200);
    const idsByDate = await page.locator('.bill-card-id').allTextContents();
    await page.selectOption('#sort-select', 'state-asc');
    await page.waitForTimeout(200);
    const idsByState = await page.locator('.bill-card-id').allTextContents();
    // Different sort criteria should produce different orderings
    const orderChanged = idsByDate.some((id, i) => id !== idsByState[i]);
    expect(orderChanged).toBe(true);
  });
});
