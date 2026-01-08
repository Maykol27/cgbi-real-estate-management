import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Owner - Properties', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'owner');
        await page.click('text=Mis Propiedades');
    });

    test('Should view owned properties', async ({ page }) => {
        // Expect at least one property or empty state
        // await expect(page.locator('.property-card')).toHaveCount(1);
        await expect(page.locator('text=Estado de Ocupación')).toBeVisible();
    });
});
