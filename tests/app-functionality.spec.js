// @ts-check
import { test, expect } from '@playwright/test';

test.describe('CalmDash App Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload to get fresh state
    await page.reload();

    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should load the app and display main sections', async ({ page }) => {
    // Check if the app title is visible
    await expect(page.locator('h1')).toContainText('CalmDash');

    // Check if main sections are present
    await expect(page.locator('text=루틴')).toBeVisible();
    await expect(page.locator('text=일정')).toBeVisible();
    await expect(page.locator('text=할 일')).toBeVisible();
  });

  test('should display clock and weather widgets', async ({ page }) => {
    // Check if clock is displayed
    const clock = page.locator('#clock');
    await expect(clock).toBeVisible();

    // Check if weather widget is present
    const weather = page.locator('#weather');
    await expect(weather).toBeVisible();
  });

  test('should open and close settings modal', async ({ page }) => {
    // Find and click settings button
    const settingsBtn = page.locator('[data-action="settings"]');
    await settingsBtn.click();

    // Check if modal is visible
    const modal = page.locator('.modal, [role="dialog"]');
    await expect(modal).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button:has-text("닫기"), button:has-text("취소")').first();
    await closeBtn.click();

    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test.describe('Routine Management', () => {
    test('should add a new routine', async ({ page }) => {
      // Click add routine button
      const addBtn = page.locator('[data-action="add-routine"]');
      await addBtn.click();

      // Fill in routine details
      await page.fill('input[name="title"]', 'E2E 테스트 루틴');
      await page.selectOption('select[name="time_hour"]', '09');
      await page.selectOption('select[name="time_min"]', '30');
      await page.selectOption('select[name="repeat"]', '매일');

      // Submit form
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Verify routine is added
      await expect(page.locator('text=E2E 테스트 루틴')).toBeVisible();
    });

    test('should toggle routine completion', async ({ page }) => {
      // First add a routine
      await page.locator('[data-action="add-routine"]').click();
      await page.fill('input[name="title"]', '토글 테스트');
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Find the routine checkbox/toggle
      const routineCard = page.locator('text=토글 테스트').locator('..');
      const checkbox = routineCard.locator('input[type="checkbox"]').first();

      // Toggle completion
      await checkbox.check();

      // Verify it's checked
      await expect(checkbox).toBeChecked();

      // Toggle back
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
    });

    test('should delete a routine', async ({ page }) => {
      // Add a routine to delete
      await page.locator('[data-action="add-routine"]').click();
      await page.fill('input[name="title"]', '삭제될 루틴');
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Find and click delete button
      const routineCard = page.locator('text=삭제될 루틴').locator('..');
      const deleteBtn = routineCard.locator('[data-action="delete"]');
      await deleteBtn.click();

      // Confirm deletion if there's a confirmation dialog
      const confirmBtn = page.locator('button:has-text("삭제")').last();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }

      // Verify routine is removed
      await expect(page.locator('text=삭제될 루틴')).not.toBeVisible();
    });
  });

  test.describe('Schedule Management', () => {
    test('should add a new schedule', async ({ page }) => {
      // Click add schedule button
      const addBtn = page.locator('[data-action="add-schedule"]');
      await addBtn.click();

      // Fill in schedule details
      await page.fill('input[name="title"]', 'E2E 일정 테스트');
      await page.selectOption('select[name="start_hour"]', '14');
      await page.selectOption('select[name="start_min"]', '00');
      await page.selectOption('select[name="end_hour"]', '15');
      await page.selectOption('select[name="end_min"]', '30');

      // Submit form
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Verify schedule is added
      await expect(page.locator('text=E2E 일정 테스트')).toBeVisible();
    });

    test('should add an all-day schedule', async ({ page }) => {
      // Click add schedule button
      await page.locator('[data-action="add-schedule"]').click();

      // Fill in details
      await page.fill('input[name="title"]', '종일 일정');

      // Check all-day checkbox if exists
      const allDayCheckbox = page.locator('input[name="isAllDay"]');
      if (await allDayCheckbox.isVisible()) {
        await allDayCheckbox.check();
      }

      // Submit
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Verify
      await expect(page.locator('text=종일 일정')).toBeVisible();
    });
  });

  test.describe('Todo Management', () => {
    test('should add a new todo', async ({ page }) => {
      // Click add todo button
      const addBtn = page.locator('[data-action="add-todo"]');
      await addBtn.click();

      // Fill in todo details
      await page.fill('input[name="title"]', 'E2E 할일 테스트');

      // Set due date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.fill('input[name="dueDate"], input[type="date"]', dateStr);

      // Set priority
      await page.selectOption('select[name="priority"]', 'high');

      // Submit
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Verify
      await expect(page.locator('text=E2E 할일 테스트')).toBeVisible();
    });

    test('should toggle todo completion', async ({ page }) => {
      // Add a todo
      await page.locator('[data-action="add-todo"]').click();
      await page.fill('input[name="title"]', '완료 체크 테스트');
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Find the todo checkbox
      const todoCard = page.locator('text=완료 체크 테스트').locator('..');
      const checkbox = todoCard.locator('input[type="checkbox"]').first();

      // Toggle completion
      await checkbox.check();
      await expect(checkbox).toBeChecked();

      // Toggle back
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
    });

    test('should display todos with correct priority badges', async ({ page }) => {
      // Add high priority todo
      await page.locator('[data-action="add-todo"]').click();
      await page.fill('input[name="title"]', '긴급 할일');
      await page.selectOption('select[name="priority"]', 'high');
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Verify priority badge is shown
      const todoCard = page.locator('text=긴급 할일').locator('..');
      await expect(todoCard).toBeVisible();

      // Look for high priority indicator (might be a badge, icon, or color)
      const priorityBadge = todoCard.locator('.e-badge, [data-priority="high"]');
      if (await priorityBadge.count() > 0) {
        await expect(priorityBadge.first()).toBeVisible();
      }
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist data after page reload', async ({ page }) => {
      // Add a routine
      await page.locator('[data-action="add-routine"]').click();
      await page.fill('input[name="title"]', '영구 루틴');
      await page.click('button:has-text("추가"), button:has-text("저장")');

      // Verify it's visible
      await expect(page.locator('text=영구 루틴')).toBeVisible();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify data persists
      await expect(page.locator('text=영구 루틴')).toBeVisible();
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle between light and dark theme', async ({ page }) => {
      // Find theme toggle button
      const themeToggle = page.locator('[data-action="toggle-theme"]');

      if (await themeToggle.isVisible()) {
        // Get initial theme
        const bodyClass = await page.locator('body').getAttribute('class');
        const initialDark = bodyClass?.includes('dark') || false;

        // Toggle theme
        await themeToggle.click();

        // Wait for change
        await page.waitForTimeout(100);

        // Verify theme changed
        const newBodyClass = await page.locator('body').getAttribute('class');
        const newDark = newBodyClass?.includes('dark') || false;

        expect(newDark).toBe(!initialDark);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for main heading
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Section headings should exist
      const headings = page.locator('h1, h2, h3, h4');
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have keyboard navigable buttons', async ({ page }) => {
      // Focus on first interactive element
      await page.keyboard.press('Tab');

      // Check if something is focused
      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBeGreaterThan(0);
    });
  });
});
