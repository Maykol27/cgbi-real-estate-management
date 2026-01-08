import { test, expect } from '@playwright/test';

test.describe('SIKAI CX - Basic Application Tests', () => {

    test('La aplicación carga correctamente', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Esperar que la página cargue
        await page.waitForLoadState('networkidle');

        // Verificar que el título no está vacío
        const title = await page.title();
        expect(title).toBeTruthy();
    });

    test('Login page es accesible', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Buscar elementos de login (ajustar según tu app)
        const loginForm = page.locator('form, [role="form"], input[type="email"], input[type="password"]').first();
        await expect(loginForm).toBeVisible({ timeout: 5000 });
    });

    test('La aplicación responde a interacciones básicas', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Verificar que hay elementos interactivos
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);
    });

    test('No hay errores de consola críticos', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Filtrar errores conocidos o menores
        const criticalErrors = errors.filter(err =>
            !err.includes('favicon') &&
            !err.includes('DevTools')
        );

        expect(criticalErrors).toHaveLength(0);
    });

    test('La navegación básica funciona', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Verificar que hay enlaces de navegación
        const links = page.locator('a[href]');
        const linkCount = await links.count();
        expect(linkCount).toBeGreaterThan(0);
    });
});
