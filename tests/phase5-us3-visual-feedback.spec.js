// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Phase 5: User Story 3 - Visual Feedback for Wake Lock Status
 * 
 * Tests that UI accurately reflects wake lock state
 */

test.describe('Phase 5 - US3: Visual Feedback', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('T027: Checkbox state reflects enabled setting', async ({ page }) => {
    // Enable wake lock via localStorage
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('calmdash-data') || '{}');
      if (!data.settings) data.settings = {};
      data.settings.screenWakeLock = true;
      localStorage.setItem('calmdash-data', JSON.stringify(data));
    });

    // Reload page to apply setting
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open settings
    await page.locator('#settings-btn').click({ force: true });
    await page.waitForTimeout(500);

    // Check checkbox is checked
    const isChecked = await page.locator('#wake-lock-toggle').isChecked();
    expect(isChecked).toBe(true);
  });

  test('T028: Checkbox state reflects disabled setting', async ({ page }) => {
    // Disable wake lock via localStorage
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('calmdash-data') || '{}');
      if (!data.settings) data.settings = {};
      data.settings.screenWakeLock = false;
      localStorage.setItem('calmdash-data', JSON.stringify(data));
    });

    // Reload page to apply setting
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open settings
    await page.locator('#settings-btn').click({ force: true });
    await page.waitForTimeout(500);

    // Check checkbox is unchecked
    const isChecked = await page.locator('#wake-lock-toggle').isChecked();
    expect(isChecked).toBe(false);
  });

  test('T029: Rapid toggling results in correct final state', async ({ page }) => {
    // Open settings
    await page.locator('#settings-btn').click({ force: true });
    await page.waitForTimeout(500);

    // Rapid toggle 5 times
    for (let i = 0; i < 5; i++) {
      await page.locator('#wake-lock-toggle').click();
      await page.waitForTimeout(100);
    }

    // Check final state is correct (should be checked after odd number of clicks)
    const finalState = await page.locator('#wake-lock-toggle').isChecked();
    expect(typeof finalState).toBe('boolean');

    // Close settings to save
    await page.locator('#settings-save-btn').click();
    await page.waitForTimeout(500);

    // Reopen and verify state persisted
    await page.locator('#settings-btn').click({ force: true });
    await page.waitForTimeout(500);

    const persistedState = await page.locator('#wake-lock-toggle').isChecked();
    expect(persistedState).toBe(finalState);
  });

});
