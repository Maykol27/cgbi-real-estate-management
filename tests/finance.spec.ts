import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-data';
import { loginAs, logout } from './helpers/auth';
import path from 'path';

test.describe('Finance & Documents', () => {

    test('TC-040: Upload Document', async ({ page }) => {
        await loginAs(page, 'admin');
        await page.goto('/admin/documents');

        await page.click('text=Subir Documento'); // Or icon

        await page.fill('input[name="name"]', 'Test Document ' + Date.now());
        await page.selectOption('select[name="target"]', 'Inquilinos');

        // Handle file upload
        // Create a dummy file or use one from fixtures if available.
        // Playwright handles file input
        await page.setInputFiles('input[type="file"]', {
            name: 'test-doc.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('This is a test document.')
        });

        await page.click('button:has-text("Enviar")');

        await expect(page.locator('text=Documento registrado')).toBeVisible();
    });

    test('TC-041: Create Finance Request', async ({ page }) => {
        await loginAs(page, 'admin');
        await page.goto('/admin/finance'); // Assuming finance route

        await page.click('text=Nueva Solicitud');

        await page.fill('input[name="title"]', 'Finance Request ' + Date.now());
        await page.fill('input[name="cost"]', '50000');
        await page.fill('textarea[name="description"]', 'Repair costs');

        // Select property (Context from previous chats: property selection added)
        // Check if property select exists
        const propSelect = page.locator('select[name="property_id"]');
        if (await propSelect.isVisible()) {
            await propSelect.selectOption({ index: 1 });
        }

        await page.click('button:has-text("Enviar")');

        await expect(page.locator('text=Solicitud creada')).toBeVisible();
    });

    test('TC-043: Owner Views Financials', async ({ page }) => {
        await loginAs(page, 'owner');
        await page.goto('/owner/dashboard');

        // Check for specific elements like graphs or financial summary
        await expect(page.locator('text=Estado Financiero')).toBeVisible();
        // Ideally verify data is filtered, but checking visibility is good first step.
    });

});
