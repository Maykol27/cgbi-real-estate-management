# SIKAI CX Platform - Comprehensive Test Plan

This document outlines the Master Test Plan based on the Use Case analysis. Use this to validate the application before any release.

## 🔴 Priority 1: Authentication & Access Control

| ID | Scenario | Steps to Reproduce | Expected Result | Type |
| :--- | :--- | :--- | :--- | :--- |
| **TC-001** | **Admin Login Success** | 1. Go to Login Page.<br>2. Enter valid Admin credentials.<br>3. Click "Login". | System redirects specifically to `/admin/dashboard`. Admin sidebar is visible. | Happy Path |
| **TC-002** | **Tenant Login Success** | 1. Go to Login Page.<br>2. Enter valid Tenant credentials.<br>3. Click "Login". | System redirects specifically to `/tenant/dashboard`. **Admin features are hidden**. | Happy Path |
| **TC-003** | **Owner Login Success** | 1. Go to Login Page.<br>2. Enter valid Owner credentials.<br>3. Click "Login". | System redirects specifically to `/owner/dashboard`. | Happy Path |
| **TC-004** | **Invalid Password** | 1. Enter valid email.<br>2. Enter WRONG password.<br>3. Click "Login". | Error toast message appears ("Credenciales inválidas"). **No redirect happens**. | Edge Case |
| **TC-005** | **Direct URL Access Denied** | 1. Log in as **Tenant**.<br>2. Manually change URL to `/admin/properties`.<br>3. Press Enter. | System redirects user back to `/tenant/dashboard` or shows "Unauthorized". | Edge Case |
| **TC-006** | **Collaborator Permissions** | 1. Login as Collaborator with ONLY "Tickets" permission.<br>2. Try to access "Settings" via Sidebar. | "Settings" option is NOT visible in sidebar. | Edge Case |

## 🏠 Priority 2: Property Management (Admin)

| ID | Scenario | Steps to Reproduce | Expected Result | Type |
| :--- | :--- | :--- | :--- | :--- |
| **TC-010** | **Create Property** | 1. Admin > Inmuebles > "Nuevo Inmueble".<br>2. Fill all fields (Name, Rent, Owner).<br>3. Click "Guardar". | Property appears in the list. Toast: "Propiedad creada exitosamente". | Happy Path |
| **TC-011** | **Create Property (Missing Data)** | 1. Open "Nuevo Inmueble".<br>2. Leave "Rent" or "Name" empty.<br>3. Click "Guardar". | Form validation prevents submission. Browser alert or red border on fields. | Edge Case |
| **TC-012** | **Assign Non-Existent Owner** | 1. Create Property.<br>2. Try to type an Owner name that doesn't exist (if generic input) OR check dropdown. | Dropdown should only show users with role='Owner'. | Edge Case |
| **TC-013** | **Update Status** | 1. Edit existing property.<br>2. Change status to "Arrendado".<br>3. Save. | Property card badge updates to Green/Arrendado. | Happy Path |

## 👥 Priority 3: User Management

| ID | Scenario | Steps to Reproduce | Expected Result | Type |
| :--- | :--- | :--- | :--- | :--- |
| **TC-020** | **Register Tenant** | 1. Admin > Inquilinos > "Registrar".<br>2. Enter Name, Email, Info.<br>3. Submit. | User created in Auth and DB. User appears in Tenant list. | Happy Path |
| **TC-021** | **Duplicate Email** | 1. Try to register a Tenant with an email that is already used by an Admin. | Error message: "User already exists" or duplicate key error. App should not crash. | Edge Case |
| **TC-022** | **Assign Owner to Property** | 1. Edit Property.<br>2. Select a newly created Owner from dropdown.<br>3. Save.<br>4. Login as that Owner. | Owner dashboard now displays that specific property. | Happy Path |

## 🎫 Priority 4: Tickets & Support

| ID | Scenario | Steps to Reproduce | Expected Result | Type |
| :--- | :--- | :--- | :--- | :--- |
| **TC-030** | **Tenant Creates Ticket** | 1. Tenant > Solicitudes > "Nueva Solicitud".<br>2. Select Category, Subject, Desc.<br>3. Send. | Ticket appears in "En Proceso" or "Pendiente". Admin receives notification. | Happy Path |
| **TC-031** | **Admin Replies** | 1. Admin > Tickets.<br>2. Open Ticket.<br>3. Type message & "Responder". | Message appended to chat history. Tenant can see it immediately. | Happy Path |
| **TC-032** | **View Others' Tickets** | 1. Log in as Tenant A.<br>2. Try to view/guess ID of Ticket belonging to Tenant B (via API or URL if possible). | System shows 404 or Empty state. RLS prevents access. | Edge Case |
| **TC-033** | **Close Ticket Flow** | 1. Admin marks status as "Cerrado".<br>2. Tenant tries to reply. | Input area should be disabled or show "Ticket Closed". | Edge Case |

## 📂 Priority 5: Finance & Documents

| ID | Scenario | Steps to Reproduce | Expected Result | Type |
| :--- | :--- | :--- | :--- | :--- |
| **TC-040** | **Upload Document** | 1. Admin > Documentos > Upload.<br>2. Select File (PDF).<br>3. Target: "Inquilinos".<br>4. Send. | Document appears in list. Tenant logins and sees file. Owner DOES NOT see it. | Happy Path |
| **TC-041** | **Create Finance Request** | 1. Admin > Documentos > Upload "Cotización".<br>2. Type: "Solicitud".<br>3. Set Cost & Desc.<br>4. Submit. | Request created. Notification sent to Owner. | Happy Path |
| **TC-042** | **Upload Invalid File** | 1. Try to upload a 500MB Video file (if blocked) or .exe. | System blocks upload ("File too large" or "Type not supported"). | Edge Case |
| **TC-043** | **Owner Views Financials** | 1. Login as Owner.<br>2. Check Dashboard Graphs. | Graphs render with data ONLY from their assigned properties. | Happy Path |
