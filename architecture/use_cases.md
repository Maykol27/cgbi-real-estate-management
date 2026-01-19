# SIKAI CX Platform - Use Case Analysis & QA Strategy

## 1. Actors & Roles

| Actor | Description |
| :--- | :--- |
| **Admin** | System Superuser. Manages all aspects of the platform (Users, Properties, Finance, Documents). |
| **Collaborator** | Support staff with restricted permissions. Access is defined by the Admin (e.g., can manage Tickets but not Settings). |
| **Owner** | Property owner. Passive user who views reports, financial status, and documents related to their properties. |
| **Tenant** | Property resident. Active user who views contracts, payments, reports issues (tickets), and updates profile. |
| **External System** | Refers to automated services like Supabase Auth (Identity), Email Service (Notifications), or future Payment Gateways. |

## 2. UML Use Case Diagram

```mermaid
usecaseDiagram
    actor "Admin" as A
    actor "Collaborator" as C
    actor "Owner" as O
    actor "Tenant" as T
    actor "External System" as SYS

    package "Authentication" {
        usecase "Login" as UC1
        usecase "Logout" as UC2
        usecase "Change Password" as UC3
        usecase "Verify Credentials" as UC_Auth
    }

    package "Property Management" {
        usecase "Create Property" as UC4
        usecase "Update Property Status" as UC5
        usecase "Assign Owner" as UC6
        usecase "View Property Details" as UC7
    }

    package "User Management" {
        usecase "Register Tenant" as UC8
        usecase "Register Owner" as UC9
        usecase "Manage Permissions" as UC10
    }

    package "Ticket & Support" {
        usecase "Create Support Ticket" as UC11
        usecase "Reply to Ticket" as UC12
        usecase "Close Ticket" as UC13
        usecase "View Ticket History" as UC14
    }

    package "Finance & Documents" {
        usecase "Upload Document" as UC15
        usecase "View/Download Document" as UC16
        usecase "Create Finance Request" as UC17
        usecase "View Financial Reports" as UC18
        usecase "Record Payment" as UC19
    }

    %% Relationships
    A --|> C : "Can act as"
    
    %% Auth
    A --> UC1
    O --> UC1
    T --> UC1
    UC1 ..> UC_Auth : <<include>>
    UC1 --> UC2
    UC1 --> UC3

    %% Admin Actions
    A --> UC4
    A --> UC8
    A --> UC9
    A --> UC10
    UC4 ..> UC6 : <<include>>
    A --> UC19

    %% Collaborator Actions (Restricted)
    C --> UC5
    C --> UC12
    C --> UC13
    C --> UC15
    C --> UC17

    %% Tenant Actions
    T --> UC11
    T --> UC14
    T --> UC16
    T --> UC18 : "View Own Payments"

    %% Owner Actions
    O --> UC7
    O --> UC16
    O --> UC18 : "View Income/Expense"

    %% System
    SYS --> UC_Auth
```

## 3. Critical QA Flows (Test Scenarios)

Use these flows to prioritize your manual and automated testing.

### 🔴 Priority 1: Core Access & Security
*   **Login Redirection**: Verify that an Admin is redirected to `/admin`, a Tenant to `/tenant`, and an Owner to `/owner` upon login.
*   **Role Isolation**: ensure a Tenant **cannot** access `/admin/dashboard` by manually typing the URL.
*   **Collaborator Restrictions**: Create a Collaborator with *only* "Tickets" permission. Verify they see the Tickets tab but **cannot** see "Settings" or "Properties".

### 🟠 Priority 2: The "Happy Path" for Leasing
1.  **Setup**: Admin creates a Property -> Admin creates an Owner -> Admin assigns Owner to Property.
2.  **Lease**: Admin creates a Tenant -> Admin links Tenant to that Property (via Contract/Document or informal status update).
3.  **Verification**:
    *   Owner logs in: Should see the Property.
    *   Tenant logs in: Should see their Dashboard.

### 🟡 Priority 3: Finance & Requests (Complex Logic)
1.  **Request Creation**: Admin uploads a "Solicitud de Aprobación" (Quote) for a property repair using `AdminDocuments`.
2.  **Owner Verification**: Owner logs in -> Goes to "Solicitudes" -> Should see the specific file/request.
3.  **Cross-Check**: Another Owner (of a different property) logs in -> Should **NOT** see that request. *(Privacy Check)*.

### 🟢 Priority 4: Ticket Lifecycle
1.  **Open**: Tenant creates a ticket "No hay agua".
2.  **Triage**: Admin/Collaborator sees the ticket in "New" state.
3.  **Response**: Admin replies "Enviando plomero".
4.  **Feedback**: Tenant sees the reply immediately.
5.  **Close**: Admin marks ticket as "Closed". Tenant can no longer reply (or sees it as closed).
