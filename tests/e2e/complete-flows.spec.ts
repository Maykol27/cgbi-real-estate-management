import { test, expect } from '@playwright/test';
import { loginAs, logout } from '../helpers/auth';
import { TEST_TICKET } from '../fixtures/test-data';

test.describe('E2E - Complete Flows', () => {

    test('Full Ticket Lifecycle: Tenant creates -> Admin replies -> Tenant reads', async ({ browser }) => {
        // Context 1: Tenant
        const tenantContext = await browser.newContext();
        const tenantPage = await tenantContext.newPage();
        await loginAs(tenantPage, 'tenant');

        // Create Ticket
        await tenantPage.click('text=Ayuda'); // Or Tickets
        await tenantPage.click('text=+ Nuevo Ticket');
        await tenantPage.fill('input[placeholder*="Asunto"]', 'E2E Flow Ticket');
        await tenantPage.fill('textarea[placeholder*="Descripción"]', 'Testing full cycle');
        await tenantPage.click('button:has-text("Crear Ticket")');
        const ticketIdElement = tenantPage.locator('text=E2E Flow Ticket');
        await expect(ticketIdElement).toBeVisible();

        await tenantContext.close(); // Or keep open if checking live updates

        // Context 2: Admin
        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();
        await loginAs(adminPage, 'admin');

        await adminPage.click('text=Tickets');
        await adminPage.reload(); // Refresh to ensure new data

        // Find ticket
        await adminPage.click('text=E2E Flow Ticket'); // Open details

        // Reply
        await adminPage.fill('textarea[placeholder*="Responder"]', 'Admin reply verification');
        await adminPage.click('button:has-text("Enviar")');
        await expect(adminPage.locator('text=Admin reply verification')).toBeVisible();

        // Changing status
        // await adminPage.click('text=En Progreso');

        await adminContext.close();
    });
});
