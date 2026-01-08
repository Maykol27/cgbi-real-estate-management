// Test data for use across the suite
export const TEST_USERS = {
    admin: { email: 'maykol.sicard27@gmail.com', password: 'pruebas2026cgbi', role: 'admin' },
    tenant: { email: 'juan.perez@cgbi.com', password: 'pruebas2026cgbi', role: 'tenant' },
    owner: { email: 'carlos.ruiz@cgbi.com', password: 'pruebas2026cgbi', role: 'owner' },
    collaborator: { email: 'pedro.colab@cgbi.com', password: 'pruebas2026cgbi', role: 'collaborator' }
};

export const TEST_PROPERTY = {
    name: 'Playwright Test Property',
    address: '123 Test Avenue, QA City',
    rent: 1500000,
    rooms: 3,
    area: 85
};

export const TEST_TICKET = {
    subject: 'Test Maintenance Request',
    description: 'This is an automated test ticket created by Playwright.',
    priority: 'High'
};
