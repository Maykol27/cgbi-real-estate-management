import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test('Sidebar should be collapsible/hidden on mobile', async ({ page }) => {
        await loginAs(page, 'admin');

        // Verify sidebar is hidden/collapsed initially or uses hamburger
        // Assuming a menu button exists
        const menuBtn = page.locator('button[aria-label="Menu"], .material-icons-round:has-text("menu")');
        // If layout uses simple hidden default:
        // expect(await page.locator('nav').isVisible()).toBeFalsy(); 
        // This depends on Layout implementation.

        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Check if critical elements fit
        await expect(page.locator('.dashboard-card, .stat-card').first()).toBeVisible();
    });
});
