import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Tenant - Payments', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'tenant');
        await page.click('text=Pagos');
    });

    test('Should view payments history', async ({ page }) => {
        await expect(page.locator('text=Estado de Cuenta')).toBeVisible();
    });

    test('Should allow simulation button click', async ({ page }) => {
        const simBtn = page.locator('button:has-text("Simular Pago")');
        if (await simBtn.isVisible()) {
            await simBtn.click();
            await expect(page.locator('text=Pagado')).toBeVisible();
        }
    });
});
