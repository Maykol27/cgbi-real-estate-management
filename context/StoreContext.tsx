import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- Types ---
export interface User {
    id: string | number;
    name: string;
    role: 'Admin' | 'Propietario' | 'Inquilino' | 'Colaborador';
    email: string;
    permissions?: string[];
    policyNumber?: string;
    photoUrl?: string; // Nuevo campo para foto
}

export interface Ticket {
    id: string | number;
    title: string;
    desc: string;
    status: 'Pendiente' | 'En Progreso' | 'Cerrado';
    type?: 'Mantenimiento' | 'Administrativo' | 'PQRS / Felicitaciones' | 'Tareas CGBI'; // Added type
    priority?: 'Alta' | 'Media' | 'Baja';
    requester: string;
    requesterRole: 'Propietario' | 'Inquilino' | 'Admin';
    date: string;
    propertyId?: string | number;
    propertyName?: string;
    assignedTo?: string | number;
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

export interface Document {
    id: string | number;
    name: string;
    type: 'Factura / Recibo' | 'Contrato' | 'Comunicación' | 'Solicitud' | 'Documento Personal';
    target: string;
    targetIds?: (string | number)[];
    targetId?: string;
    date: string;
    size: string;
    fileUrl?: string;
}

export interface Property {
    id: string | number;
    name: string;
    address: string;
    type: string;
    image?: string;
    // Status depends on listingType, but we keep a union of all possible values here
    status: 'Disponible' | 'Vendido' | 'Arrendado' | 'Desistido' | 'Ocupado' | 'Mantenimiento';
    listingType: 'Venta' | 'Arriendo';
    rent: string;
    owner: string;
    owner_id?: string; // Added owner_id from Supabase
    sqMeters: number;
    rooms: number;
    bathrooms: number;
    parking: number;
    description: string;
}

export interface Visit {
    id: string | number;
    propertyId: string | number;
    propertyName: string;
    visitorName: string; // Nombre del cliente
    advisor?: string; // Nuevo campo: Asesor
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

interface StoreContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<User | null>;
    logout: () => void;
    users: User[]; // List of all users

    tickets: Ticket[];
    addTicket: (t: Omit<Ticket, 'id' | 'date' | 'status'>) => Promise<{ success: boolean; message: string }>;
    updateTicketStatus: (id: string | number, status: Ticket['status']) => void;
    updateTicketPriority: (id: string | number, priority: Ticket['priority']) => void;
    addMessageToTicket: (id: string | number, msg: { sender: string; role: string; text: string }) => void;

    documents: Document[];
    addDocument: (d: Omit<Document, 'id' | 'date'> & { file?: File }) => void;
    deleteDocument: (id: string | number) => void;

    properties: Property[];
    addProperty: (p: Omit<Property, 'id'>) => void;
    updatePropertyStatus: (id: string | number, status: Property['status']) => void;

    visits: Visit[];
    addVisit: (v: Omit<Visit, 'id'>) => Promise<{ success: boolean; message: string }>;
    updateVisitFeedback: (id: string | number, feedback: string) => void;
    updateVisit: (id: string | number, updates: Partial<Visit>) => void; // Added for full updates

    financeRequests: FinanceRequest[];
    addFinanceRequest: (r: Omit<FinanceRequest, 'id' | 'date' | 'status'>) => void;
    updateFinanceRequestStatus: (id: string | number, status: string, reason?: string) => void;

    payments: Payment[];
    addPayment: (p: Omit<Payment, 'id' | 'status'>) => Promise<{ success: boolean; message: string }>;

    // Users
    // Users
    addUser: (u: Omit<User, 'id'>) => void;
    updateProfile: (userId: string | number, updates: Partial<User>) => void; // New method for generic profile updates

    // Notification Helper
    requestNotificationPermission: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- State (initialized empty) ---
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [financeRequests, setFinanceRequests] = useState<FinanceRequest[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllData = async () => {
            // 1. Fetch Profiles
            const { data: profilesData } = await supabase.from('profiles').select('*');
            let mappedUsers: User[] = [];

            if (profilesData) {
                mappedUsers = profilesData.map((p: any) => ({
                    id: p.id,
                    name: p.full_name || p.email, // Fallback if name empty
                    email: p.email,
                    role: p.role,
                    permissions: p.permissions || [] // handle permissions if stored in DB
                })) as unknown as User[];

                setUsers(mappedUsers);
            }

            // 2. Fetch Properties
            const { data: propsData } = await supabase.from('properties').select('*');
            if (propsData) {
                const mappedProps = propsData.map((p: any) => {
                    const ownerUser = mappedUsers.find(u => u.id === p.owner_id);
                    return {
                        id: p.id,
                        name: p.name,
                        address: p.address,
                        type: p.type,
                        status: p.status,
                        listingType: p.listing_type,
                        rent: p.rent,
                        owner: ownerUser ? ownerUser.name : 'No Asignado',
                        owner_id: p.owner_id,
                        sqMeters: p.sq_meters,
                        rooms: p.rooms,
                        bathrooms: p.bathrooms,
                        parking: p.parking,
                        description: p.description
                    };
                }) as Property[];
                setProperties(mappedProps);
            }

            // 3. Fetch Tickets
            const { data: ticketsData } = await supabase.from('tickets').select('*');
            if (ticketsData) {
                const mappedTickets = ticketsData.map((t: any) => {
                    // Assuming tickets have a user_id or created_by
                    const requester = mappedUsers.find(u => u.id === t.user_id);
                    return {
                        id: t.id,
                        title: t.title,
                        desc: t.description,
                        status: t.status,
                        priority: t.priority,
                        requester: requester ? requester.name : 'Unknown',
                        requesterRole: requester ? requester.role : 'Usuario',
                        date: new Date(t.created_at).toLocaleDateString(),
                        propertyId: t.property_id,
                        messages: t.messages || []
                    };
                }) as Ticket[];
                setTickets(mappedTickets);
            }

            // 4. Fetch Documents
            const { data: docsData } = await supabase.from('documents').select('*');
            if (docsData) {
                const mappedDocs = docsData.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    target: 'Todos', // Default or from DB
                    date: new Date(d.created_at).toLocaleDateString(),
                    size: d.size,
                    fileUrl: d.url
                })) as Document[];
                setDocuments(mappedDocs);
            }

            // 5. Fetch Visits
            const { data: visitsData } = await supabase.from('visits').select('*');
            if (visitsData) {
                const mappedVisits = visitsData.map((v: any) => ({
                    id: v.id,
                    propertyId: v.property_id,
                    propertyName: 'Unknown', // Resolve
                    visitorName: v.visitor_name,
                    advisor: v.advisor, // Map advisor
                    date: new Date(v.date),
                    status: v.status,
                    feedback: v.feedback
                })) as Visit[];
                setVisits(mappedVisits);
            }

            // 6. Fetch Finance Requests
            const { data: finData } = await supabase.from('finance_requests').select('*');
            if (finData) {
                const mappedFin = finData.map((f: any) => ({
                    id: f.id,
                    title: f.title,
                    desc: f.description,
                    cost: f.amount,
                    status: f.status,
                    requester: 'Unknown', // Resolve from requester_id
                    date: new Date(f.created_at).toLocaleDateString(),
                    rejectionReason: f.rejection_reason
                })) as FinanceRequest[];
                setFinanceRequests(mappedFin);
            }
        };

        fetchAllData();

        // Auth subscription handles user session
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                await fetchProfile(session.user.id);
                // Reload data on sign in?
                fetchAllData();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setUsers([]);
                setProperties([]);
                setTickets([]);
                // Clear others
                setDocuments([]);
                setVisits([]);
                setFinanceRequests([]);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };

    }, []);

    // --- Actions ---
    const notify = (title: string, body: string) => {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: '/logo-cgbi.jpeg' });
        }
    };

    const requestNotificationPermission = () => {
        if (!("Notification" in window)) {
            alert("Tu navegador no soporta notificaciones de escritorio.");
            return;
        }

        if (Notification.permission === 'granted') {
            notify("Notificaciones Activas", "El servicio de notificaciones ya está activo y funcionando.");
            // alert("Las notificaciones ya están activadas para CGBI."); // Optional: explicit alert
            return;
        }

        if (Notification.permission === 'denied') {
            alert("⚠️ Las notificaciones están bloqueadas.\n\nPor favor, habilítalas manualmente en la configuración de privacidad de tu navegador (icono de candado en la barra de direcciones) para recibir alertas importantes.");
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notify("¡Éxito!", "Has activado las notificaciones de CGBI.");
            } else {
                // If user just clicked Block in the prompt
                console.log("Permiso de notificaciones denegado por el usuario.");
            }
        });
    };

    // --- Supabase Auth Integration ---
    // --- Supabase Auth Integration & Global State Management ---
    useEffect(() => {
        // 1. Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // 2. Global Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                console.log(`🟢 Usuario logueado: ${session.user.email}`);
                await fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                console.log('🔴 Sesión cerrada correctamente.');
                // Cleanup Local State
                setUser(null);
                setTickets([]);
                setDocuments([]);
                setVisits([]);
                setFinanceRequests([]);
                setPayments([]);
            }
        });

        // Unsubscribe on unmount
        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string): Promise<User | undefined> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                const loadedUser: User = {
                    id: data.id,
                    name: data.full_name,
                    role: data.role as any,
                    email: data.email,
                    permissions: data.permissions
                };

                setUser(loadedUser);

                // Fetch User Payments - ENABLED
                let paymentsQuery = supabase.from('payments').select('*');
                if (data.role !== 'Administrador' && data.role !== 'Colaborador') {
                    paymentsQuery = paymentsQuery.eq('tenant_id', data.id);
                }
                const { data: paymentsData } = await paymentsQuery;
                if (paymentsData) {
                    setPayments(paymentsData.map(p => ({
                        id: p.id,
                        amount: p.amount,
                        status: p.status,
                        date: p.date,
                        period: p.period,
                        tenant_id: p.tenant_id
                    })));
                }
                return loadedUser;
            } else if (error) {
                console.error("Error fetching profile:", error);
            }
        } catch (error) {
            console.error(error);
        }
        return undefined;
    };

    const login = async (email: string, password?: string): Promise<User | null> => {
        try {
            if (password) {
                // 2. Auth Call
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

                if (authError) {
                    // Capture and display Supabase error
                    console.error("Supabase Auth Error:", authError.message);
                    notify("Error de Autenticación", authError.message);
                    return null;
                }

                if (authData?.user) {
                    // Do NOT manually call fetchProfile here; onAuthStateChange will do it.
                    // Returning partial user to satisfy type, or rely on state.
                    // We can just return null and let the UI react to the 'user' state change.
                    // Or return a stub.
                    // Returning null might be confusing for the caller 'handleLogin'.
                    // Let's return the basic auth user mapped to our type.
                    return {
                        id: authData.user.id,
                        email: authData.user.email,
                        name: "Cargando...", // Will be updated by fetchProfile
                        role: "" as any, // Wait for fetchProfile
                        permissions: []
                    };
                }
            }
        } catch (error: any) {
            console.error("Login Exception:", error);

            // EMERGENCY CHECK: Did we actually log in despite the timeout/error?
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log("⚠️ Timeout captured, but Session IS VALID. Recovering...");
                const profile = await fetchProfile(session.user.id);
                return profile || null;
            }

            // Auto-Healing for Timeouts
            if (error.message === "Request Timeout" || error.message?.includes("timeout")) {
                console.warn("Real Login timeout - cleaning storage.");
                localStorage.clear();
                sessionStorage.clear();
                notify("Conexión Lenta", "El sistema tardó demasiado. Por favor intente de nuevo.");
            } else {
                notify("Error del Sistema", error.message || "Ocurrió un error inesperado.");
            }
        }
        return null;
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error signing out:", error.message);
                // notify("Error al salir", error.message); // Optional to notify
            }
            // State cleanup handled by onAuthStateChange(SIGNED_OUT)
            setUser(null);
            notify("Sesión Cerrada", "Has salido del sistema.");
        } catch (error: any) {
            console.error("Logout Exception:", error);
            setUser(null);
        }
    };

    const addTicket = async (t: Omit<Ticket, 'id' | 'date' | 'status'>): Promise<{ success: boolean; message: string }> => {
        try {
            const { data, error } = await supabase.from('tickets').insert({
                title: t.title,
                description: t.desc,
                status: 'Pendiente',
                priority: t.priority || 'Media',
                requester_id: user?.id,
                property_id: t.propertyId
            }).select().single();

            if (error) {
                console.error("Error creating ticket:", error);
                return {
                    success: false,
                    message: `Error DB: ${error.message} ${(error as any).details || ''}`
                };
            }

            if (data) {
                const newTicket: Ticket = {
                    ...t,
                    id: data.id,
                    date: new Date(data.created_at).toLocaleDateString(),
                    status: data.status,
                    messages: []
                };
                setTickets(prev => [newTicket, ...prev]);
                notify("Nuevo Ticket Creado", `Ticket #${data.id} registrado exitosamente.`);
                return { success: true, message: "Ticket creado exitosamente." };
            }
            return { success: false, message: "No se recibieron datos de confirmación." };
        } catch (err: any) {
            console.error(err);
            return { success: false, message: err.message || "Error inesperado." };
        }
    };


    const updateTicketStatus = (id: number, status: Ticket['status']) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        notify("Actualización de Ticket", `El ticket #${id} cambió a estado: ${status}`);
    };

    const updateTicketPriority = (id: number, priority: Ticket['priority']) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, priority } : t));
        notify("Prioridad Actualizada", `El ticket #${id} ahora tiene prioridad: ${priority}`);
    };

    const assignTicket = async (id: string | number, userId: string | number | undefined) => {
        // Optimistic Update
        setTickets(prev => prev.map(t => t.id === id ? { ...t, assignedTo: userId } : t));
        const assignee = users.find(u => u.id === userId);
        notify("Ticket Asignado", `Ticket #${id} asignado a ${assignee?.name || 'Nadie'}.`);

        // Persist to Supabase
        const { error } = await supabase.from('tickets').update({
            assigned_to: userId
        }).eq('id', id);

        if (error) {
            console.error("Error assigning ticket:", error);
            notify("Error", "No se pudo guardar la asignación en la base de datos.");
            // Revert optimistic update could be here, but keeping simple
        }
    };

    const addMessageToTicket = async (id: number, msg: { sender: string; role: string; text: string }) => {
        const newMessage = {
            ...msg,
            id: Date.now(),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        // 1. Optimistic Update
        const targetTicket = tickets.find(t => t.id === id);
        const updatedMessages = [...(targetTicket?.messages || []), newMessage];

        setTickets(prev => prev.map(t => t.id === id ? { ...t, messages: updatedMessages } : t));

        // 2. Persist to Supabase
        const { error } = await supabase.from('tickets').update({
            messages: updatedMessages
        }).eq('id', id);

        if (error) {
            console.error("Error saving message", error);
            notify("Error", "No se pudo guardar el mensaje.");
        }
    };

    const addDocument = async (d: Omit<Document, 'id' | 'date'> & { file?: File }) => {
        try {
            let publicUrl = d.fileUrl; // Fallback or existing URL

            // 1. Upload File if present
            if (d.file) {
                const fileExt = d.file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('project_files')
                    .upload(filePath, d.file);

                if (uploadError) {
                    console.error("Error uploading file:", uploadError);
                    notify("Error", "Fallo al subir el archivo físico.");
                    return;
                }

                // 2. Get Public URL
                const { data: publicUrlData } = supabase.storage
                    .from('project_files')
                    .getPublicUrl(filePath);

                publicUrl = publicUrlData.publicUrl;
            }

            // 3. Insert Record
            const { data, error } = await supabase.from('documents').insert({
                name: d.name,
                type: d.type,
                target: d.target,
                size: d.size,
                url: publicUrl
            }).select().single();

            if (error) {
                console.error("Error creating document record:", error);
                notify("Error", "Fallo al guardar referencia del documento.");
                return;
            }

            if (data) {
                const newDoc: Document = {
                    ...d,
                    id: data.id,
                    date: new Date(data.created_at).toLocaleDateString(),
                    fileUrl: data.url
                };
                setDocuments(prev => [newDoc, ...prev]);
                notify("Documento Registrado", `Se ha guardado ${newDoc.name} y el archivo está en la nube.`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteDocument = async (id: string | number) => {
        try {
            const { error } = await supabase.from('documents').delete().eq('id', id);
            if (error) {
                notify("Error", "No se pudo eliminar el documento.");
                return;
            }
            setDocuments(prev => prev.filter(d => d.id !== id));
            notify("Documento Eliminado", "El archivo ha sido eliminado correctamente.");
        } catch (err) {
            console.error(err);
        }
    };

    // ... addProperty restore
    const addProperty = async (p: Omit<Property, 'id'>) => {
        try {
            const { data, error } = await supabase.from('properties').insert({
                name: p.name,
                address: p.address,
                type: p.type,
                status: p.status,
                listing_type: p.listingType,
                rent: p.rent,
                sq_meters: p.sqMeters,
                rooms: p.rooms,
                bathrooms: p.bathrooms,
                parking: p.parking,
                description: p.description,
                owner_id: p.owner_id // Use the selected owner ID
            }).select().single();

            if (error) {
                console.error("Error creating property:", error);
                notify("Error", "No se pudo crear la propiedad.");
                return;
            }

            if (data) {
                const newProp: Property = { ...p, id: data.id };
                setProperties(prev => [newProp, ...prev]);
                notify("Propiedad Agregada", `${newProp.name} guardada en base de datos.`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // ... addProperty (ya implementado) -> Remove duplicate comment/stub if any


    const updatePropertyStatus = async (id: number | string, status: Property['status']) => {
        const { error } = await supabase.from('properties').update({ status }).eq('id', id);
        if (error) {
            notify("Error", "No se pudo actualizar el estado.");
            return;
        }
        setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    };

    const addVisit = async (v: Omit<Visit, 'id'>): Promise<{ success: boolean; message: string }> => {
        try {
            const { data, error } = await supabase.from('visits').insert({
                property_id: v.propertyId,
                visitor_name: v.visitorName,
                // advisor: v.advisor, // Column does not exist in DB
                date: v.date.toISOString(),
                status: v.status
            }).select().single();

            if (error) {
                console.error("Error agendando visita:", error);
                return { success: false, message: error.message || "Error al agendar visita." };
            }

            if (data) {
                const newVisit: Visit = {
                    id: data.id,
                    propertyId: data.property_id,
                    visitorName: data.visitor_name,
                    advisor: data.advisor,
                    date: new Date(data.date),
                    status: data.status,
                    propertyName: v.propertyName
                };
                setVisits(prev => [...prev, newVisit]);
                notify("Visita Agendada", `Visita para ${v.propertyName} programada.`);
                return { success: true, message: "Visita agendada correctamente." };
            }
            return { success: false, message: "No se recibieron datos de confirmación." };
        } catch (err: any) {
            console.error(err);
            return { success: false, message: err.message || "Error inesperado." };
        }
    };

    const updateVisitFeedback = async (id: string | number, feedback: string) => {
        const { error } = await supabase.from('visits').update({
            feedback: feedback,
            status: 'Realizada'
        }).eq('id', id);

        if (error) {
            notify("Error", "No se pudo guardar el feedback.");
            return;
        }
        setVisits(prev => prev.map(v => v.id === id ? { ...v, feedback, status: 'Realizada' } : v));
        notify("Feedback Registrado", "Se ha guardado el feedback de la visita.");
    };

    const updateVisit = async (id: string | number, updates: Partial<Visit>) => {
        try {
            // Map local updates to Supabase columns
            const dbUpdates: any = {};
            if (updates.date) dbUpdates.date = updates.date.toISOString();
            if (updates.status) dbUpdates.status = updates.status;
            // if (updates.advisor) dbUpdates.advisor = updates.advisor; // Column missing
            if (updates.visitorName) dbUpdates.visitor_name = updates.visitorName;
            if (updates.propertyId) dbUpdates.property_id = updates.propertyId;
            // Add other fields as necessary

            const { error } = await supabase.from('visits').update(dbUpdates).eq('id', id);

            if (error) {
                console.error("Error updating visit:", error);
                notify("Error", "No se pudo actualizar la visita.");
                return;
            }

            // Update local state
            setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
            notify("Visita Actualizada", "Los cambios han sido guardados.");

        } catch (err) {
            console.error("Error in updateVisit:", err);
        }
    };

    // --- Financial Requests / Approvals ---

    const addFinanceRequest = async (r: Omit<FinanceRequest, 'id' | 'date' | 'status'>) => {
        try {
            const { data, error } = await supabase.from('finance_requests').insert({
                title: r.title,
                description: r.desc,
                amount: r.cost, // Mapeo a columna 'amount'
                status: 'Pendiente',
                requester_id: user?.id
            }).select().single();

            if (error) {
                console.error("Error creando solicitud:", error);
                notify("Error", "No se pudo enviar la solicitud.");
                return;
            }

            if (data) {
                const newRequest: FinanceRequest = {
                    ...r,
                    id: data.id,
                    date: new Date(data.created_at).toLocaleDateString(),
                    status: 'Pendiente'
                };
                setFinanceRequests(prev => [newRequest, ...prev]);
                notify("Solicitud Enviada", `Nueva solicitud registrada exitosamente.`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateFinanceRequestStatus = async (id: string | number, status: string, reason?: string) => {
        const { error } = await supabase.from('finance_requests').update({
            status: status,
            rejection_reason: reason
        }).eq('id', id);

        if (error) {
            notify("Error", "No se pudo actualizar la solicitud.");
            return;
        }

        setFinanceRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any, rejectionReason: reason || "" } : r));
        notify("Estado Actualizado", `La solicitud #${id} ha sido marcada como ${status}.`);
    };

    const addPayment = async (p: Omit<Payment, 'id' | 'status'>): Promise<{ success: boolean; message: string }> => {
        try {
            const { data, error } = await supabase.from('payments').insert({
                amount: p.amount,
                period: p.period,
                date: p.date,
                status: 1, // 1=Pagado
                tenant_id: p.tenant_id || user?.id
            }).select().single();

            if (error) {
                console.error("Error saving payment:", error);
                return { success: false, message: `Error DB: ${error.message}` };
            }

            if (data) {
                const newPayment: Payment = {
                    ...p,
                    id: data.id,
                    status: 1,
                    tenant_id: data.tenant_id
                };
                setPayments(prev => [newPayment, ...prev]);
                notify("Pago Registrado", `Pago de ${p.period} registrado exitosamente.`);
                return { success: true, message: "Pago registrado." };
            }
            return { success: false, message: "No data returned." };
        } catch (err: any) {
            console.error(err);
            return { success: false, message: err.message };
        }
    };

    const addUser = async (u: Omit<User, 'id'>) => {
        try {
            // Call Edge Function 'invite-user' to securely invite user and create profile
            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email: u.email,
                    role: u.role,
                    full_name: u.name,
                    policy_number: u.policyNumber,
                    permissions: u.permissions
                }
            });

            if (error) {
                console.error("Error invoking invite-user:", error);
                // Fallback: Show error toast but maybe keep local optimistic update if needed?
                // No, better to show error.
                notify("Error al crear usuario", "No se pudo enviar la invitación. Intente nuevamente.");
                return;
            }

            if (data?.success) {
                // Optimistic UI update or fetch from profiles?
                // Let's add to local state since profiles might take a split second.
                // We use the ID returned by the function.
                const newUser: User = {
                    ...u,
                    id: data.user.id,
                    permissions: u.permissions || []
                };
                setUsers(prev => [...prev, newUser]);
                notify("Usuario Invitado", `Se ha enviado un correo de invitación a ${u.email}.`);
            } else {
                notify("Error", data?.error || "Error desconocido al invitar usuario.");
            }

        } catch (err: any) {
            console.error(err);
            notify("Error Sistema", err.message);
        }
    };

    const updateProfile = (userId: string | number, updates: Partial<User>) => {
        // Update Local State for immediate UI change
        setUser(prev => prev && prev.id === userId ? { ...prev, ...updates } : prev);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

        // Persist to localStorage to survive refresh (since DB column might be missing)
        try {
            const stored = localStorage.getItem('sikai_user_updates');
            const data = stored ? JSON.parse(stored) : {};
            // Use a consistent ID key. If user.id is mock (1), it might conflict if we don't handle it well.
            // But for this session it works.
            data[userId] = { ...(data[userId] || {}), ...updates };
            localStorage.setItem('sikai_user_updates', JSON.stringify(data));
        } catch (e) {
            console.error("Failed to persist locally", e);
        }
    };


    return (
        <StoreContext.Provider value={{
            user, loading, login, logout, users, addUser,
            tickets, addTicket, updateTicketStatus, updateTicketPriority, assignTicket, addMessageToTicket,
            documents, addDocument, deleteDocument,
            properties, addProperty, updatePropertyStatus,
            visits, addVisit, updateVisitFeedback,
            financeRequests, addFinanceRequest, updateFinanceRequestStatus,
            payments, addPayment,
            requestNotificationPermission
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error("useStore must be used within a StoreProvider");
    return context;
};
