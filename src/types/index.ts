export enum UserRole {
    ADMIN = 'ADMIN',
    TENANT = 'TENANT',
    OWNER = 'OWNER',
    COLLABORATOR = 'COLLABORATOR'
}

export interface User {
    id: string | number;
    name: string;
    role: 'Admin' | 'Propietario' | 'Inquilino' | 'Colaborador';
    email: string;
    permissions?: string[];
    policyNumber?: string;
    photoUrl?: string; // Nuevo campo para foto
    phone?: string;    // Nuevo campo para teléfono
    financialStatus?: 'Al Día' | 'Pendiente de Pago' | 'En Mora';
    propertyId?: string | number;
}

export interface Ticket {
    id: string | number;
    title: string;
    desc: string;
    status: 'Pendiente' | 'En Progreso' | 'Cerrado';
    type?: 'Mantenimiento' | 'Administrativo' | 'PQRS / Felicitaciones' | 'Tareas CGBI';
    priority?: 'Alta' | 'Media' | 'Baja';
    requester: string;
    requester_id?: string; // ✅ FIX: UUID del creador para match con DB
    requesterRole: 'Propietario' | 'Inquilino' | 'Admin' | 'Colaborador';
    date: string;
    propertyId?: string | number;
    propertyName?: string;
    assigned_to?: string | number;
    attachment?: string;
    attachmentUrl?: string;
    messages: {
        id: number;
        sender: string;
        role: string;
        text: string;
        time: string;
    }[];
}

export interface Property {
    id: string | number;
    name: string;
    address: string;
    type: string;
    image?: string;
    status: 'Disponible' | 'Vendido' | 'Arrendado' | 'Desistido' | 'Ocupado' | 'Mantenimiento';
    listingType: 'Venta' | 'Arriendo';
    rent: string;
    owner: string;
    owner_id?: string;
    sqMeters: number;
    rooms: number;
    bathrooms: number;
    parking: number;
    description: string;
    contractEnd?: string;
}

export interface Document {
    id: string | number;
    name: string;
    type: 'Factura / Recibo' | 'Contrato' | 'Comunicación' | 'Solicitud' | 'Documento Personal';
    target: string; // Display name: "Todos", "Juan Pérez", etc.
    targetIds?: (string | number)[]; // Array de UUIDs para RLS
    targetId?: string | number; // Single UUID helper for specific client
    sharedWithId?: string | number; // ✅ FIX: Alias para match de propietario específico
    sharedWith?: string; // Display name del destinatario
    owner?: string; // Nombre del propietario
    date: string;
    size: string;
    fileUrl?: string;
    createdBy?: string | number;
}

export interface Visit {
    id: string | number;
    propertyId: string | number;
    propertyName: string;
    visitorName: string;
    advisor?: string;
    date: Date;
    status: 'Programada' | 'Realizada' | 'Cancelada' | 'Reprogramada';
    feedback?: string;
}

export interface FinanceRequest {
    id: string | number;
    title: string;
    desc: string;
    cost: string;
    status: 'Pendiente' | 'Aprobado' | 'Rechazado';
    requester: string;
    date: string;
    rejectionReason?: string;
    attachmentUrl?: string;
    propertyId?: string | number;
}

export interface Payment {
    id: string | number;
    amount: number;
    status: number; // 0=Pendiente, 1=Pagado, 2=Vencido
    date: string;
    period: string;
    tenant_id?: string | number;
    property_id?: string | number;
    fileUrl?: string;
}
