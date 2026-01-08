import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Admin - Settings', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
        await page.click('text=Configuración');
    });

    test('Should view users list', async ({ page }) => {
        await expect(page.locator('text=Gestión de Usuarios')).toBeVisible();
    });

    test('Should have create user button', async ({ page }) => {
        await expect(page.locator('button:has-text("Agregar Usuario")')).toBeVisible();
    });
});
