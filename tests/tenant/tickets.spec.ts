import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { TEST_TICKET } from '../fixtures/test-data';

test.describe('Tenant - Tickets', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'tenant');
        await page.click('text=Ayuda'); // Or "Mis Tickets"
    });

    test('Should create a ticket', async ({ page }) => {
        await page.click('text=+ Nuevo Ticket');

        // Select type if select exists
        // await page.selectOption('select', 'Mantenimiento');

        await page.fill('input[placeholder*="Asunto"]', TEST_TICKET.subject);
        await page.fill('textarea[placeholder*="Descripción"]', TEST_TICKET.description);

        await page.click('button:has-text("Crear Ticket")');

        await expect(page.locator(`text=${TEST_TICKET.subject}`)).toBeVisible();
    });
});
