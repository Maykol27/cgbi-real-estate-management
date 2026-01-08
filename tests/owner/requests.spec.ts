import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Owner - Requests', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'owner');
        // Assuming "Solicitud" or similar link
    });

    test('Should create a request', async ({ page }) => {
        // If request button is on dashboard or properties
        if (await page.locator('text=+ Nueva Solicitud').isVisible()) {
            await page.click('text=+ Nueva Solicitud');
            // Fill details
            await page.fill('textarea', 'Solicito mantenimiento preventivo');
            await page.click('button:has-text("Enviar")');
            await expect(page.locator('text=Solicito mantenimiento preventivo')).toBeVisible();
        }
    });
});
