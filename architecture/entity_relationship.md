# SIKAI CX Platform - Entity-Relationship Diagram (ERD)

## 1. Information Sources
This diagram is inferred from:
- **Supabase Migrations**: Defining SQL tables, constraints, and policies.
- **Frontend Types**: `types.ts` defining the data models used in the application.
- **Seed Data**: `seed.sql` showing initial data relationships.

## 2. Mermaid.js ER Diagram

```mermaid
erDiagram
    profiles ||--o{ properties : "owns (as Owner)"
    profiles ||--o{ tickets : "requests/assigned_to"
    profiles ||--o{ finance_requests : "requests"
    profiles ||--o{ visits : "advises"
    profiles ||--o{ payments : "makes payment (Tenant)"
    
    properties ||--o{ tickets : "has issue"
    properties ||--o{ visits : "has scheduled"
    properties ||--o{ finance_requests : "relates to"
    properties ||--o{ documents : "related to"

    %% Entity Definitions

    profiles {
        uuid id PK "Links to auth.users"
        string role "Admin, Owner, Tenant, Collaborator"
        string name
        string email
        string permissions "Array of strings (JSONB)"
        string policyNumber "For Tenants"
        date created_at
    }

    properties {
        bigint id PK
        string name
        string address
        string type "Apartment, House, etc."
        string status "Occupied, Vacant, Maintenance"
        float rent "Rental Price or Sale Price"
        uuid owner_id FK "Links to profiles.id"
        string listingType "Sale or Rent"
        int sqMeters
        int rooms
        int bathrooms
        int parking
        string description
        string image_url
    }

    tickets {
        bigint id PK
        string subject
        string description
        string status "Open, In Progress, Closed"
        string priority "High, Medium, Low"
        uuid requester_id FK "Tenant or Owner"
        uuid assigned_to FK "Collaborator/Admin"
        bigint property_id FK
        timestamp created_at
    }

    finance_requests {
        bigint id PK
        string title
        string description
        float cost
        string status "Pending, Approved, Rejected"
        uuid requester_id FK "Admin/Collaborator"
        bigint property_id FK
        timestamp created_at
    }

    documents {
        bigint id PK
        string name
        string type "Contract, Invoice, etc."
        string url
        string target "Owner, Tenant, All"
        uuid uploaded_by FK
        bigint property_id FK
        timestamp created_at
    }

    payments {
        bigint id PK
        float amount
        date date
        string status "Paid, Pending"
        string concept "Rent, Administration"
        uuid tenant_id FK
        string tenant_name
        timestamp created_at
    }

    visits {
        bigint id PK
        date date
        string visitor_name
        string status "Scheduled, Completed, Cancelled"
        string feedback
        bigint property_id FK
        uuid advisor FK "Collaborator"
        timestamp created_at
    }

```

## 3. Data Integrity & Relationships

### Core Relationships
*   **Profiles (Users)**: The central entity. `id` is a UUID matching `auth.users`.
    *   **Roles**: Defined by the `role` column ('Admin', 'Owner', 'Tenant', 'Collaborator').
    *   **Cardinality**: A Profile can own multiple Properties (1:N), request multiple Tickets (1:N), and make multiple Payments (1:N).

### Property Management
*   **Properties**: Linked to a single Owner (`owner_id`).
    *   **Orphaned Data Risk**: If a Profile is deleted, `msg_20260116183000` ensures `owner_id` becomes NULL (Set Null), preserving the Property record.

### Maintenance & Support (Tickets)
*   **Tickets**: Link a `Requester` (Tenant/Owner) to an `Assignee` (Collaborator).
    *   **Property Link**: Essential for knowing where the issue is.
    *   **Update**: `requester_id` and `assigned_to` also Set Null on user deletion to preserve history.

### Finance
*   **Finance Requests**: Linked to a property via `property_id` (Added in recent migration). Used for Owners to approve repairs.
*   **Payments**: Linked to Tenants. Critical for tracking income.

### Documents
*   **Documents**: Can be generic (visible to role groups) or specific (though schema integration varies). Often linked to Properties or general uploads.
