import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Admin - Tenants Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
        await page.click('text=Inquilinos');
    });

    test('Should list tenants', async ({ page }) => {
        await expect(page.locator('text=Lista de Inquilinos')).toBeVisible();
    });

    // test('Should add a tenant', async ({ page }) => {
    //   await page.click('text=Nuevo Inquilino');
    //   // Fill form...
    // });
});
