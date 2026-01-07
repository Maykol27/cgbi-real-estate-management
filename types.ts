export enum UserRole {
  ADMIN = 'ADMIN',
  TENANT = 'TENANT',
  OWNER = 'OWNER',
  COLLABORATOR = 'COLLABORATOR'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  status: 'Occupied' | 'Vacant' | 'Maintenance';
  listingType: 'Sale' | 'Rent';
}

export interface Ticket {
  id: string;
  subject: string;
  requester: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Closed';
  propertyId?: string;
  propertyName?: string;
  assignedTo?: string; // Collaborator ID
}