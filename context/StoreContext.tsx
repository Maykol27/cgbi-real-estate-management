import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TicketService } from '../src/services/ticketService';
import { useToast } from './ToastContext';

// --- Types ---
import { User, Ticket, Document, Property, Visit, FinanceRequest, Payment } from '../src/types';

export interface Notification {
    id: string;
    created_at: string;
    user_id: string;
    title: string;
    body: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    link?: string;
    metadata?: any;
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
    addProperty: (p: Omit<Property, 'id'> & { imageFile?: File }) => void;
    updatePropertyStatus: (id: string | number, status: Property['status']) => void;
    updateProperty: (id: string | number, updates: Partial<Property> & { imageFile?: File }) => void;

    visits: Visit[];
    addVisit: (v: Omit<Visit, 'id'>) => Promise<{ success: boolean; message: string }>;
    updateVisitFeedback: (id: string | number, feedback: string) => void;
    updateVisit: (id: string | number, updates: Partial<Visit>) => void; // Added for full updates

    financeRequests: FinanceRequest[];
    addFinanceRequest: (r: Omit<FinanceRequest, 'id' | 'date' | 'status'>) => void;
    updateFinanceRequestStatus: (id: string | number, status: string, reason?: string) => void;

    payments: Payment[];
    addPayment: (p: Omit<Payment, 'id'> & { status?: number }) => Promise<{ success: boolean; message: string }>;

    // Users
    addUser: (u: Omit<User, 'id'>) => void;
    updateProfile: (userId: string | number, updates: Partial<User>) => void; // New method for generic profile updates
    updateUserStatus: (userId: string | number, status: 'Al Día' | 'Pendiente de Pago' | 'En Mora') => Promise<void>;
    deleteUser: (userId: string | number) => Promise<{ success: boolean; message: string }>;
    uploadAvatar: (userId: string, file: File) => Promise<{ success: boolean; url?: string; message?: string }>; // New method

    // Notifications
    notifications: Notification[];
    markNotificationAsRead: (id: string) => Promise<void>;
    fetchNotifications: () => Promise<void>;

    // Notification Helper
    requestNotificationPermission: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- State (initialized empty) ---
    const { showToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [financeRequests, setFinanceRequests] = useState<FinanceRequest[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isInitializing, setIsInitializing] = useState(false);

    // Ref to track user without triggering re-renders in effects with stale closures
    const userRef = React.useRef<User | null>(null);

    const uploadAvatar = async (userId: string, file: File): Promise<{ success: boolean; url?: string; message?: string }> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `avatars/${userId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('project_files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('project_files').getPublicUrl(filePath);

            // Auto update profile with new URL
            await updateProfile(userId, { photoUrl: data.publicUrl });

            return { success: true, url: data.publicUrl };
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            return { success: false, message: error.message };
        }
    };

    // Auto-refresh data periodically to keep UI in sync
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // --- Notifications Logic (Hoisted for fetchAllData) ---
    const fetchNotifications = async () => {
        try {
            // Use userRef for latest state or fallback
            const currentUserId = userRef.current?.id || supabase.auth.getUser().then(({ data }) => data.user?.id);
            if (!currentUserId) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', await currentUserId) // await in case it's a promise
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (data) setNotifications(data as Notification[]);
        } catch (err) {
            console.warn("Safe Warning: Failed to fetch notifications", err);
        }
    };

    const markNotificationAsRead = async (id: string) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        } catch (e) { console.error(e); }
    };

    // --- CONSOLIDATED Data Fetching Function (Refactored for Stability) ---
    const fetchAllData = async () => {
        try {
            console.log("📥 Fetching all data from Supabase (Parallel)...");
            // Use current state users if available for logging
            const { data: auth } = await supabase.auth.getUser();
            console.log("🚀 StoreContext v2.8.2 - Fetching Data...");

            // 1. Fetch Profile first to determine Role and Name for filtering
            let userRole = user?.role;
            let userName = user?.name;
            const userId = auth.user?.id;

            if (userId) {
                // Always fetch profile to ensure we have the latest Role and Name
                const { data, error } = await supabase.from('profiles').select('role, full_name').eq('id', userId).single();
                if (data) {
                    userRole = data.role;
                    userName = data.full_name;
                } else {
                    console.warn("⚠️ No se pudo obtener el perfil del usuario:", error);
                }
            }

            console.log('👮 Usuario Actual:', userId, 'Rol:', userRole, 'Nombre:', userName);

            // 2. Prepare Dynamic Queries based on Role
            let ticketsQuery = supabase.from('tickets').select('*');
            let visitsQuery = supabase.from('visits').select('*');
            let financeQuery = supabase.from('finance_requests').select('*');

            if (userRole === 'Colaborador' && userId) {
                console.log('👀 Aplicando filtro de Colaborador');
                // Tickets: solo los asignados al colaborador
                ticketsQuery = ticketsQuery.eq('assigned_to', userId);

                // Finance Requests: Colaborador ve todas (para gestionar)
                // financeQuery sin filtro extra - RLS debe manejar

                // Visits: Colaborador ve todas las visitas (requerido por flujo)
                // visitsQuery sin filtro extra
            }

            // Independent Fetches using Promise.allSettled
            const results = await Promise.allSettled([
                supabase.from('profiles').select('*'),
                supabase.from('properties').select('*'),
                ticketsQuery,
                supabase.from('documents').select('*'),
                visitsQuery,
                financeQuery
            ]);

            const [
                profilesResult,
                propsResult,
                ticketsResult,
                docsResult,
                visitsResult,
                financeResult
            ] = results;

            // 1. Process Profiles
            let allUsers: User[] = [];
            if (profilesResult.status === 'fulfilled' && profilesResult.value.data) {
                allUsers = profilesResult.value.data.map((p: any) => ({
                    id: p.id,
                    name: p.full_name || p.email,
                    email: p.email,
                    role: p.role,
                    permissions: p.permissions || [],
                    financialStatus: p.financial_status || 'Al Día',
                    photoUrl: p.avatar_url,
                    phone: p.phone,
                    propertyId: p.property_id
                })) as unknown as User[];
                setUsers(allUsers);
                console.log("✅ Loaded", allUsers.length, "users");
            } else if (profilesResult.status === 'rejected' || profilesResult.value.error) {
                console.warn("⚠️ Failed to load profiles (RLS or Network):", profilesResult.status === 'rejected' ? profilesResult.reason : profilesResult.value.error);
                // Keep empty or previous state? Empty for safety.
            }

            // 2. Process Properties
            let allProperties: Property[] = [];
            if (propsResult.status === 'fulfilled' && propsResult.value.data) {
                const mappedProps = propsResult.value.data.map((p: any) => {
                    const ownerUser = allUsers.find(u => u.id === p.owner_id);
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
                        description: p.description,
                        contractEnd: p.contract_end_date,
                        image: p.image_url
                    };
                }) as Property[];
                allProperties = mappedProps;
                setProperties(mappedProps);
                console.log("✅ Loaded", mappedProps.length, "properties");
                if (mappedProps.length === 0 && (user?.role === 'Propietario' || user?.role === 'Inquilino')) {
                    console.warn('⚠️ [RLS] No se encontraron propiedades para este usuario');
                }
            } else {
                console.warn("⚠️ Failed to load properties");
            }

            // 3. Process Tickets
            if (ticketsResult.status === 'fulfilled' && ticketsResult.value.data) {
                const mappedTickets = ticketsResult.value.data.map((t: any) => {
                    const requester = allUsers.find(u => u.id === t.requester_id);
                    const prop = allProperties.find(p => p.id === t.property_id);
                    return {
                        id: t.id,
                        title: t.title,
                        desc: t.description,
                        status: t.status,
                        priority: t.priority,
                        requester: requester ? requester.name : 'Unknown',
                        requester_id: t.requester_id, // ✅ FIX: incluir para filtros por UUID
                        requesterRole: requester ? requester.role : 'Usuario',
                        date: new Date(t.created_at).toLocaleDateString(),
                        propertyId: t.property_id,
                        propertyName: prop ? prop.name : undefined,
                        messages: t.messages || [],
                        assigned_to: t.assigned_to // CRITICAL: Include assigned_to from Supabase
                    };
                }) as Ticket[];
                setTickets(mappedTickets);
                console.log(`✅ Loaded ${mappedTickets.length} tickets`);
            }

            // 4. Process Documents
            if (docsResult.status === 'fulfilled' && docsResult.value.data) {
                console.log('📄 [DOCS] Documentos obtenidos de BD:', docsResult.value.data.length);

                const mappedDocs = docsResult.value.data.map((d: any) => {
                    // Map target user ID to display name
                    let displayTarget = d.target || 'Todos';

                    // Check if target is a UUID (contains hyphens) and map to user name
                    if (displayTarget && displayTarget.includes('-')) {
                        const targetUser = allUsers.find(u => u.id === displayTarget);
                        displayTarget = targetUser ? targetUser.name : displayTarget;
                    }

                    return {
                        id: d.id,
                        name: d.name,
                        type: d.type as any,
                        target: displayTarget,
                        targetId: d.target_user_id || null,
                        sharedWithId: d.target_user_id || null, // ✅ FIX: alias para filtro propietario
                        targetIds: d.target_user_ids || [],
                        date: new Date(d.created_at).toLocaleDateString(),
                        timestamp: new Date(d.created_at).getTime(),
                        size: d.size,
                        fileUrl: d.file_url || d.url, // ✅ FIX: revisar ambos campos posibles
                        createdBy: d.created_by // Track document creator
                    };
                }) as Document[];
                setDocuments(mappedDocs);
                console.log(`✅ Loaded ${mappedDocs.length} documents`);
                console.log(`📄 [RLS] Usuario ${user?.role} tiene acceso a ${mappedDocs.length} documentos`);

                // Audit log for Collaborators (RLS will filter automatically)
                if (mappedDocs.length > 0) {
                    console.log('📄 [DOCS] Documentos cargados. RLS aplicará filtros según rol del usuario.');
                }
            }

            // 5. Process Visits
            if (visitsResult.status === 'fulfilled' && visitsResult.value.data) {
                const mappedVisits = visitsResult.value.data.map((v: any) => {
                    const prop = allProperties.find(p => p.id == v.property_id);
                    return {
                        id: v.id,
                        propertyId: v.property_id,
                        propertyName: prop ? prop.name : 'Propiedad Desconocida',
                        visitorName: v.visitor_name,
                        advisor: v.advisor,
                        date: new Date(v.date),
                        status: v.status,
                        feedback: v.feedback
                    };
                }) as Visit[];
                setVisits(mappedVisits);
                console.log("✅ Loaded", mappedVisits.length, "visits");
            }

            // 6. Process Finance (Critical Fix: If this fails, app should not crash)
            if (financeResult.status === 'fulfilled' && financeResult.value.data) {
                const mappedFin = financeResult.value.data.map((f: any) => {
                    const requester = allUsers.find(u => u.id === f.requester_id);
                    return {
                        id: f.id,
                        title: f.title,
                        desc: f.description,
                        cost: f.cost,
                        status: f.status,
                        requester: requester ? requester.name : 'Unknown',
                        date: new Date(f.created_at).toLocaleDateString(),
                        rejectionReason: f.rejection_reason,
                        propertyId: f.property_id,
                        attachmentUrl: f.attachment_url || null // ✅ FIX: incluir adjunto
                    };
                }) as FinanceRequest[];
                setFinanceRequests(mappedFin);
                console.log("✅ Loaded", mappedFin.length, "finance requests");
            } else {
                console.warn("ℹ️ Finance data could not be loaded (likely 403 RLS or empty). Setting empty.");
                setFinanceRequests([]); // Safe fallback for Colaborador
            }

            console.log("✅ All data fetch attempts completed.");

            // Fetch notifications if user is logged in
            const currentUserId = userRef.current?.id;
            if (currentUserId) {
                const { data: notifs } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (notifs) {
                    setNotifications(notifs as Notification[]);
                }
            }

        } catch (error) {
            console.error("❌ Critical error in fetchAllData:", error);
        }
    };


    // --- Actions ---
    const notify = (title: string, body: string) => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            // Try Service Worker first for better mobile support
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, {
                        body,
                        icon: '/logo-cgbi.jpeg',
                        badge: '/favicon-96x96.png', // Android small icon
                        vibrate: [200, 100, 200]
                    } as any);
                }).catch(() => {
                    // Fallback
                    new Notification(title, { body, icon: '/logo-cgbi.jpeg' });
                });
            } else {
                new Notification(title, { body, icon: '/logo-cgbi.jpeg' });
            }
        }
    };



    // --- CONSOLIDATED Supabase Auth Integration ---
    useEffect(() => {
        console.log("🔄 Initializing auth and data loading...");
        setIsInitializing(true);
        setLoading(true);

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn("⚠️ Initialization timed out. Forcing loading false.");
                setLoading(false);
                setIsInitializing(false);
            }
        }, 15000);

        // 1. Initial Session Check
        supabase.auth.getSession()
            .then(async ({ data: { session } }) => {
                if (session?.user) {
                    console.log("✅ Existing session found for:", session.user.email);

                    // --- SWR PATTERN: Try to load from Cache first ---
                    const cachedProfileStr = localStorage.getItem('cgbi_user_profile');
                    if (cachedProfileStr) {
                        try {
                            const cachedProfile = JSON.parse(cachedProfileStr);
                            if (cachedProfile.id === session.user.id) {
                                console.log("⚡ Hydrating User from Cache (Instant Load)");
                                setUser(cachedProfile);
                                // Don't set loading false yet if you want to show spinner until "fresh" data, 
                                // BUT the user wants F5 to be seamless. So:
                                setLoading(false);
                            }
                        } catch (e) {
                            console.error("Error parsing cached profile", e);
                            localStorage.removeItem('cgbi_user_profile');
                        }
                    }

                    // Background Revalidate / Fetch Fresh Data
                    try {
                        await fetchProfile(session.user.id);
                        await fetchAllData();
                    } catch (err) {
                        console.error("Error fetching initial data (Background):", err);
                    }
                } else {
                    console.log("ℹ️ No existing session found");
                }
            })
            .catch((error) => {
                console.error("❌ Error during initialization:", error);
            })
            .finally(() => {
                clearTimeout(safetyTimeout);
                setLoading(false);
                setIsInitializing(false);
                console.log("✅ Initialization complete");
            });

        // 2. Auth State Listener (Optimized with useRef to avoid stale closures)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔔 Auth state changed:", event);

            // IGNORE EVENTS:
            if (event === 'INITIAL_SESSION') return;
            if (event === 'TOKEN_REFRESHED') return;

            if (event === 'SIGNED_IN') {
                // FIX: Use ref to check current user
                if (session?.user?.id === userRef.current?.id) {
                    console.log("✅ Same user session detected (Ref check) - Skipping full reload.");
                    return;
                }

                if (session?.user) {
                    console.log(`🟢 Usuario nuevo logueado: ${session.user.email}`);

                    // --- SWR LOGIC FOR SIGNED_IN EVENT ---
                    const cachedProfileStr = localStorage.getItem('cgbi_user_profile');
                    let isCached = false;

                    if (cachedProfileStr) {
                        try {
                            const cached = JSON.parse(cachedProfileStr);
                            if (cached.id === session.user.id) {
                                console.log("⚡ (SIGNED_IN) Hydrating from Cache");
                                setUser(cached);
                                userRef.current = cached; // Update ref immediately
                                setLoading(false); // UI Ready immediately
                                isCached = true;
                            }
                        } catch (e) { console.error("Cache parse error", e); }
                    }

                    if (!isCached) {
                        setLoading(true); // Only block UI if no cache
                    }

                    // Background or Foreground Fetch
                    const loadFreshData = async () => {
                        try {
                            await fetchProfile(session.user.id);
                            await fetchAllData();
                        } catch (e) {
                            console.error("Sign-in data fetch error", e);
                        } finally {
                            if (!isCached) setLoading(false);
                        }
                    };

                    if (isCached) {
                        loadFreshData(); // Background
                    } else {
                        await loadFreshData(); // Foreground
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('🔴 Sesión cerrada correctamente.');
                // Cleanup Local State
                setUser(null);
                userRef.current = null; // Update Ref
                setUsers([]);
                setProperties([]);
                setTickets([]);
                setDocuments([]);
                setVisits([]);
                setFinanceRequests([]);
                setPayments([]);
                localStorage.removeItem('cgbi_user_profile'); // Clear Cache
                setLoading(false);
            }
        });

        return () => {
            console.log("🔄 Cleaning up auth subscription");
            subscription.unsubscribe();
        };

    }, []);

    // --- REALTIME SUBSCRIPTION (New) ---
    useEffect(() => {
        if (!user) return; // Only listen if logged in, RLS will handle security but good practice

        console.log("📡 Connecting to Supabase Realtime...", user.role);

        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tickets' },
                (payload) => {
                    console.log('🔔 Realtime Ticket Event:', payload);
                    const { eventType, new: newRecord, old: oldRecord } = payload;

                    // 1. STATE SYNC
                    if (eventType === 'INSERT') {
                        // Cast newRecord to Ticket type roughly
                        const t = newRecord as any;
                        const newTicket: Ticket = {
                            id: t.id,
                            title: t.title,
                            desc: t.description,
                            status: t.status,
                            priority: t.priority,
                            requester: 'Usuario (Sync)',
                            requesterRole: 'Inquilino',
                            date: new Date(t.created_at).toLocaleDateString(),
                            propertyId: t.property_id,
                            assigned_to: t.assigned_to, // ✅ FIX: Incluir assigned_to
                            messages: t.messages || []
                        };

                        setTickets(prev => {
                            if (prev.find(x => x.id === newTicket.id)) return prev;
                            // ✅ FIX: Si es Colaborador, solo agregar si este ticket le está asignado
                            if (userRef.current?.role === 'Colaborador') {
                                if (String(t.assigned_to) !== String(userRef.current?.id)) return prev;
                            }
                            return [newTicket, ...prev];
                        });

                        // NOTIFICATION: New Ticket
                        if (user.role === 'Administrador' || user.role === 'Admin') {
                            if (t.requester_id !== user.id) {
                                notify("Nuevo Ticket", `Se ha creado un nuevo ticket: ${t.title}`);
                            }
                        }
                        // ✅ FIX: Notificar al colaborador asignado específicamente
                        if (user.role === 'Colaborador' && String(t.assigned_to) === String(user.id)) {
                            notify("Ticket Asignado", `Se te ha asignado un nuevo ticket: ${t.title}`);
                        }
                    }
                    else if (eventType === 'UPDATE') {
                        setTickets(prev => prev.map(t => t.id === newRecord.id ? {
                            ...t,
                            ...newRecord,
                            desc: newRecord.description || t.desc,
                            propertyId: newRecord.property_id || t.propertyId,
                            status: newRecord.status,
                            priority: newRecord.priority,
                            messages: newRecord.messages
                        } : t));

                        // NOTIFICATION: Ticket Updates & Messages
                        const isMyTicket = newRecord.requester_id === user.id;
                        const isAdmin = user.role === 'Admin' || user.role === 'Colaborador';

                        // A. Status Change
                        if (isMyTicket && newRecord.status !== oldRecord.status) {
                            notify("Actualización de Ticket", `Tu ticket "${newRecord.title}" ahora está: ${newRecord.status}`);
                        }

                        // B. New Messages (Check length difference)
                        const oldMsgs = oldRecord.messages || [];
                        const newMsgs = newRecord.messages || [];
                        if (newMsgs.length > oldMsgs.length) {
                            const lastMsg = newMsgs[newMsgs.length - 1];
                            // Notify if I am NOT the sender
                            const iAmSender = lastMsg.sender === user.name || (lastMsg.role === 'Admin' && isAdmin);

                            if (!iAmSender) {
                                // If I am the requester (Tenant/Owner) OR I am Admin handling it
                                if (isMyTicket || isAdmin) {
                                    notify("Nuevo Mensaje", `Nuevo mensaje en ticket #${newRecord.id}: "${lastMsg.text.substring(0, 30)}..."`);
                                }
                            }
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'finance_requests' },
                (payload) => {
                    console.log('💰 Realtime Finance Event:', payload);
                    const { eventType, new: newRecord } = payload;

                    if (eventType === 'INSERT') {
                        const r = newRecord as any;
                        const newReq: FinanceRequest = {
                            id: r.id,
                            title: r.title,
                            desc: r.description,
                            cost: r.cost,
                            status: r.status,
                            requester: 'Admin (Sync)',
                            date: new Date(r.created_at).toLocaleDateString(),
                            propertyId: r.property_id
                        };

                        setFinanceRequests(prev => {
                            if (prev.find(x => x.id === newReq.id)) return prev;
                            return [newReq, ...prev];
                        });

                        // Notify Owner (Approval Needed)
                        const isForMyProperty = properties.some(p => String(p.id) === String(r.property_id));
                        if ((user.role === 'Propietario' || user.role === 'Owner') && isForMyProperty) {
                            notify("Aprobación Requerida", `Nueva solicitud de gasto: ${r.title}`);
                        }
                    }
                    else if (eventType === 'UPDATE') {
                        setFinanceRequests(prev => prev.map(r => r.id === newRecord.id ? {
                            ...r,
                            ...newRecord,
                            desc: newRecord.description || r.desc,
                            propertyId: newRecord.property_id || r.propertyId,
                            rejectionReason: newRecord.rejection_reason || r.rejectionReason,
                            status: newRecord.status
                        } : r));
                        if ((user.role === 'Analista' || user.role === 'Admin') && newRecord.requester_id === user.id) {
                            notify("Solicitud Actualizada", `Solicitud "${newRecord.title}" ha sido ${newRecord.status}`);
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments' },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    // NOTIFICATION: Payment Verified (For Tenant)
                    if (eventType === 'UPDATE' && newRecord.status === 1 && oldRecord.status !== 1) {
                        if (user.id === newRecord.tenant_id) {
                            notify("Pago Aprobado", `Tu pago del periodo ${newRecord.period} ha sido verificado.`);
                        }
                    }
                    // Sync State (Simplified)
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        // Optimizing: only refetch or update if relevant, but simplistic refresh is safer for consistency
                        if (user.role === 'Admin' || user.role === 'Colaborador' || user.id === newRecord.tenant_id) {
                            // Fetching single item or refreshing list would be ideal. 
                            // For now, let's just let the user know. 
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'documents' },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    
                    if (eventType === 'INSERT') {
                        const doc = newRecord as any;
                        const newDoc: Document = {
                            id: doc.id,
                            name: doc.name,
                            type: doc.type,
                            target: doc.target,
                            targetId: doc.target_user_id,
                            targetIds: doc.target_user_ids || [],
                            date: new Date(doc.created_at).toLocaleDateString(),
                            timestamp: new Date(doc.created_at).getTime(),
                            size: doc.size,
                            fileUrl: doc.url,
                            createdBy: doc.created_by
                        };

                        // NOTIFICATION: New Document
                        const isForMe = doc.target === user.name || (doc.target_user_ids && doc.target_user_ids.includes(user.id));
                        const isGlobal = doc.target === 'Todos' || doc.target === 'All';
                        const isRoleBased = (user.role === 'Propietario' && (doc.target === 'Propietarios' || doc.target === 'Owner')) ||
                            (user.role === 'Inquilino' && (doc.target === 'Inquilinos' || doc.target === 'Tenant'));

                        if (isForMe || isGlobal || isRoleBased) {
                            if (doc.created_by !== user.id) {
                                notify("Nuevo Documento", `Se ha compartido un nuevo archivo: ${doc.name}`);
                                setDocuments(prev => [newDoc, ...prev]);
                            }
                        }
                    } else if (eventType === 'UPDATE') {
                        setDocuments(prev => prev.map(d => d.id === newRecord.id ? { 
                            ...d, 
                            name: newRecord.name || d.name,
                            fileUrl: newRecord.url || d.fileUrl
                        } : d));
                    } else if (eventType === 'DELETE') {
                        setDocuments(prev => prev.filter(d => d.id !== oldRecord.id));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'properties' },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    console.log('🏠 Realtime Property Event:', payload);
                    
                    if (eventType === 'INSERT') {
                        const p = newRecord as any;
                        // For a new property, try to find owner by scanning current users, though it might just say ID if users array not ready
                        const newProp: Property = {
                            id: p.id,
                            name: p.name,
                            address: p.address,
                            type: p.type,
                            status: p.status,
                            listingType: p.listing_type,
                            rent: p.rent,
                            owner: 'Cargando...', // Name sync handled by full fetch or UI component using owner_id
                            owner_id: p.owner_id,
                            sqMeters: p.sq_meters,
                            rooms: p.rooms,
                            bathrooms: p.bathrooms,
                            parking: p.parking,
                            description: p.description,
                            contractEnd: p.contract_end_date,
                            image: p.image_url
                        };
                        setProperties(prev => {
                            if (prev.find(x => x.id === newProp.id)) return prev;
                            return [newProp, ...prev];
                        });
                    } else if (eventType === 'UPDATE') {
                        setProperties(prev => prev.map(p => p.id === newRecord.id ? {
                            ...p,
                            name: newRecord.name || p.name,
                            status: newRecord.status || p.status,
                            rent: newRecord.rent || p.rent,
                            listingType: newRecord.listing_type || p.listingType,
                            image: newRecord.image_url || p.image,
                            address: newRecord.address || p.address,
                            owner_id: newRecord.owner_id || p.owner_id
                        } : p));
                    } else if (eventType === 'DELETE') {
                        setProperties(prev => prev.filter(p => p.id !== oldRecord.id));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles' },
                (payload) => {
                    const { new: newRecord } = payload;
                    setUsers(prev => prev.map(u => u.id === newRecord.id ? {
                        ...u,
                        financialStatus: newRecord.financial_status || u.financialStatus,
                        role: newRecord.role || u.role,
                        photoUrl: newRecord.avatar_url || u.photoUrl,
                        name: newRecord.full_name || u.name,
                        phone: newRecord.phone || u.phone
                    } : u));
                    
                    // Update current user locally if it's me
                    if (user && user.id === newRecord.id) {
                        setUser(prev => prev ? {
                            ...prev,
                            financialStatus: newRecord.financial_status || prev.financialStatus,
                            role: newRecord.role || prev.role,
                            photoUrl: newRecord.avatar_url || prev.photoUrl,
                            name: newRecord.full_name || prev.name,
                            phone: newRecord.phone || prev.phone
                        } : prev);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'visits' },
                (payload) => {
                    const { eventType, new: newRecord } = payload;

                    if (eventType === 'INSERT') {
                        // NOTIFICATION: New Visit (For Owner)
                        const isMyProperty = properties.some(p => String(p.id) === String(newRecord.property_id));
                        if ((user.role === 'Propietario' || user.role === 'Owner') && isMyProperty) {
                            notify("Nueva Visita", `Se ha agendado una visita para el ${new Date(newRecord.date).toLocaleDateString()}.`);
                            // Add to state
                            const newVisit: Visit = {
                                id: newRecord.id,
                                propertyId: newRecord.property_id,
                                visitorName: newRecord.visitor_name,
                                advisor: newRecord.advisor,
                                date: new Date(newRecord.date),
                                status: newRecord.status,
                                propertyName: 'Cargando...', // Would need fetch
                                feedback: newRecord.feedback
                            };
                            setVisits(prev => [...prev, newVisit]);
                        }
                    }
                    else if (eventType === 'UPDATE') {
                        // NOTIFICATION: Visit Feedback (For Owner)
                        const isMyProperty = properties.some(p => String(p.id) === String(newRecord.property_id));
                        if ((user.role === 'Propietario' || user.role === 'Owner') && isMyProperty) {
                            if (newRecord.feedback && newRecord.feedback !== (payload.old as any).feedback) {
                                notify("Resultado de Visita", `Feedback disponible: "${newRecord.feedback.substring(0, 40)}..."`);
                            }
                        }
                        setVisits(prev => prev.map(v => v.id === newRecord.id ? {
                            ...v,
                            ...newRecord,
                            visitorName: newRecord.visitor_name || v.visitorName,
                            propertyId: newRecord.property_id || v.propertyId,
                            date: new Date(newRecord.date)
                        } : v));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    // Only process matches for current user (RLS should handle filter, but double check)
                    const newNotif = payload.new as Notification;
                    if (newNotif.user_id === user.id) {
                        console.log("🔔 Nueva Notificación Persistente:", newNotif);
                        setNotifications(prev => [newNotif, ...prev]);
                        notify(newNotif.title, newNotif.body);
                    }
                }
            )
            .subscribe();

        return () => {
            console.log("🔕 Disconnecting Realtime...");
            supabase.removeChannel(channel);
        };
    }, [user, properties]); // Re-run if user or properties list changes (important for owner check)
    const fetchProfile = async (userId: string): Promise<User | undefined> => {
        console.log("StoreContext: fetchProfile START", userId);
        try {
            // Safety Timeout Promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout fetching profile")), 15000)
            );

            // Fetch Logic
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            console.log("StoreContext: fetchProfile DB Result", { data, error });

            if (data) {
                const loadedUser: User = {
                    id: data.id,
                    name: data.full_name,
                    role: data.role as any,
                    email: data.email,
                    permissions: data.permissions,
                    financialStatus: data.financial_status || 'Al Día',
                    photoUrl: data.avatar_url,
                    phone: data.phone
                };

                console.log("StoreContext: Setting User State & Caching", loadedUser);
                setUser(loadedUser);
                localStorage.setItem('cgbi_user_profile', JSON.stringify(loadedUser)); // CACHE UPDATE

                let paymentsQuery = supabase.from('payments').select('*');
                // Ensure Admin (role 'Admin' or 'Administrador') and Colaborador see ALL payments
                if (data.role !== 'Administrador' && data.role !== 'Admin' && data.role !== 'Colaborador') {
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
                console.error("Error fetching profile:", error.message || error);
            }
        } catch (error: any) {
            console.error("Fetch profile exception:", error.message || error);
        }

        // If we are here, fetch failed.
        // If we have a user in state (from cache), return THAT instead of undefined to pretend success
        if (userRef.current && userRef.current.id === userId) {
            console.warn("Using cached user state due to fetch failure.");
            return userRef.current;
        }

        console.log("StoreContext: fetchProfile END (Returning undefined)");
        return undefined;
    };

    const login = async (email: string, password?: string): Promise<User | null> => {
        console.log("StoreContext: login START", email);
        try {
            if (password) {
                // 2. Auth Call
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
                console.log("StoreContext: signInWithPassword Result", { authData, authError });

                if (authError) {
                    // Capture and display Supabase error
                    console.error("Supabase Auth Error:", authError.message);
                    notify("Error de Autenticación", authError.message);
                    return null;
                }


                if (authData?.user) {
                    // Request notifications on successful login
                    requestNotificationPermission();

                    // Fetch profile immediately to get the role
                    const profile = await fetchProfile(authData.user.id);
                    console.log("StoreContext: Profile Fetched in Login", profile);
                    if (profile) {
                        return profile;
                    }
                }
            }
        } catch (error: any) {
            console.error("Login Exception:", error);

            // EMERGENCY CHECK: Did we actually log in despite the timeout/error?
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log("⚠️ Timeout captured, but Session IS VALID. Recovering...");
                const profile = await fetchProfile(session.user.id);
                // Request notifications on successful login
                requestNotificationPermission();
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
        localStorage.removeItem('cgbi_user_profile'); // Ensure cache is cleared
    };

    const addTicket = async (t: Omit<Ticket, 'id' | 'date' | 'status'>): Promise<{ success: boolean; message: string }> => {
        try {
            console.log('🚀 Intentando crear Ticket:', t);
            const { data, error } = await supabase.from('tickets').insert({
                title: t.title,
                description: t.desc,
                status: 'Pendiente',
                priority: t.priority || 'Media',
                requester_id: user?.id,
                property_id: t.propertyId || null,
                assigned_to: t.assigned_to || null // ✅ FIX: Guardar assigned_to en Supabase
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


    const updateTicketStatus = async (id: number, status: Ticket['status']) => {
        showToast("Guardando cambios...", "info");
        // 1. Service Call
        console.log('🚀 Updating Ticket Status:', id, status);
        const [success, error] = await TicketService.updateStatus(id, status);

        if (!success) {
            console.error("Error updating ticket status:", error);
            alert("Error al actualizar ticket: " + error?.message);
            notify("Error", "No se pudo actualizar el ticket.");
            return;
        }

        // 2. Local State Update ONLY if success
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        showToast("Estado actualizado", "success");
        notify("Actualización de Ticket", `El ticket #${id} cambió a estado: ${status}`);
    };

    const updateTicketPriority = async (id: number, priority: Ticket['priority']) => {
        showToast("Actualizando prioridad...", "info");
        // 1. Service Call
        const [success, error] = await TicketService.updatePriority(id, priority);

        if (!success) {
            console.error("Error updating ticket priority:", error);
            alert("Error al actualizar prioridad: " + error?.message);
            return;
        }

        setTickets(prev => prev.map(t => t.id === id ? { ...t, priority } : t));
        notify("Prioridad Actualizada", `El ticket #${id} ahora tiene prioridad: ${priority}`);
    };

    const assignTicket = async (id: string | number, userId: string | number | undefined) => {
        showToast("Asignando colaborador...", "info");
        console.log('🔄 [STORE] assignTicket called - ticketId:', id, 'collaboratorId:', userId);

        // Optimistic Update - FIXED: Use assigned_to (snake_case) to match Supabase schema
        setTickets(prev => prev.map(t => t.id === id ? { ...t, assigned_to: userId } : t));
        const assignee = users.find(u => u.id === userId);
        notify("Ticket Asignado", `Ticket #${id} asignado a ${assignee?.name || 'Nadie'}.`);

        // Persist to Supabase
        const { error } = await supabase.from('tickets').update({
            assigned_to: userId || null
        }).eq('id', id);

        if (error) {
            console.error("❌ [STORE] Error assigning ticket:", error);
            notify("Error", "No se pudo guardar la asignación en la base de datos.");
            // Revert optimistic update
            setTickets(prev => prev.map(t => t.id === id ? { ...t, assigned_to: null } : t));
        } else {
            console.log('✅ [STORE] Ticket assigned successfully to collaborator:', userId);
            showToast("Asignación guardada", "success");
        }
    };

    const addMessageToTicket = async (id: number, msg: { sender: string; role: string; text: string }) => {
        showToast("Enviando mensaje...", "info");
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
        } else {
            // Notificación persistente
            try {
                const { data: ticketData } = await supabase.from('tickets').select('requester_id, assigned_to').eq('id', id).single();
                if (ticketData) {
                    const currentUserId = user?.id;
                    const recipients = [];
                    
                    if (currentUserId === ticketData.requester_id) {
                        if (ticketData.assigned_to) recipients.push(ticketData.assigned_to);
                    } else {
                        recipients.push(ticketData.requester_id);
                    }

                    for (const targetId of recipients) {
                        if (targetId && targetId !== currentUserId) {
                            await supabase.from('notifications').insert({
                                user_id: targetId,
                                title: `Nuevo mensaje en Ticket #${id}`,
                                body: `El usuario ${user?.name || 'Alguien'} ha respondido en el ticket.`,
                                type: 'info',
                                is_read: false
                            });
                        }
                    }
                }
            } catch (notifyErr) {
                console.error("Error creating persistent notification:", notifyErr);
            }
        }
    };

    const addDocument = async (d: Omit<Document, 'id' | 'date'> & { file?: File }) => {
        try {
            showToast("Subiendo documento...", "info");
            console.log("📄 Creating document:", d.name);
            let publicUrl = d.fileUrl;

            // 1. Upload File if present
            if (d.file) {
                const fileExt = d.file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('project_files')
                    .upload(filePath, d.file);

                if (uploadError) {
                    console.error("❌ Error uploading file:", uploadError);
                    notify("Error", `Fallo al subir el archivo: ${uploadError.message}`);
                    return;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('project_files')
                    .getPublicUrl(filePath);
                publicUrl = publicUrlData.publicUrl;
            }

            // 2. Logic to determine target_user_ids for RLS
            let targetIds: (string | number)[] = [];
            if (d.targetId) {
                targetIds = [d.targetId];
            } else {
                // Group Logic: Populate IDs based on target group
                if (d.target === 'Inquilinos') {
                    targetIds = users.filter(u => u.role === 'Inquilino').map(u => u.id);
                } else if (d.target === 'Propietarios') {
                    targetIds = users.filter(u => u.role === 'Propietario').map(u => u.id);
                } else if (d.target === 'Todos' || d.target === 'General') {
                    // "Todos" usually implies public or all users. 
                    // We add all relevant users (Tenant/Owner) just to be safe with RLS
                    targetIds = users.filter(u => u.role === 'Inquilino' || u.role === 'Propietario').map(u => u.id);
                }
            }

            // 3. Insert Record
            const { data, error } = await supabase.from('documents').insert({
                name: d.name,
                type: d.type,
                target: d.target, // "Todos", "Inquilinos", "Propietarios" para display
                size: d.size,
                url: publicUrl,
                file_url: publicUrl, // ✅ FIX: Guardar en ambos campos
                created_by: user?.id,
                target_user_id: d.targetId || null, // ✅ FIX: UUID único para propietario específico
                target_user_ids: targetIds.length > 0 ? targetIds : null // Array para grupos
            }).select().single();

            console.log('📡 [DB_RESPONSE] Documento registrado:', data);

            if (error) {
                console.error("❌ Error creating document:", error);
                notify("Error", `No se pudo guardar el documento: ${error.message}`);
                return;
            }

            if (data) {
                console.log("✅ Document created successfully:", data.id);
                const newDoc: Document = {
                    ...d,
                    id: data.id,
                    date: new Date(data.created_at).toLocaleDateString(),
                    timestamp: new Date(data.created_at).getTime(),
                    fileUrl: data.file_url || data.url, // ✅ FIX: leer ambos campos
                    targetId: data.target_user_id || d.targetId || null, // ✅ FIX
                    sharedWithId: data.target_user_id || d.targetId || null,
                    targetIds: targetIds
                };
                setDocuments(prev => [newDoc, ...prev]);
                // Refetch all data to ensure it appears for all users
                await fetchAllData();
                
                // ✅ Insert internal notifications for recipients
                try {
                    const notifyIds = targetIds.length > 0 ? targetIds : (d.targetId ? [d.targetId] : []);
                    for (const targetId of notifyIds) {
                        if (targetId && targetId !== user?.id) {
                            await supabase.from('notifications').insert({
                                user_id: targetId,
                                title: 'Nuevo Documento',
                                body: `Se ha compartido un nuevo archivo: ${newDoc.name}`,
                                type: 'info',
                                is_read: false
                            });
                        }
                    }
                } catch (notifErr) {
                    console.error("Error creating document notifications", notifErr);
                }

                notify("Documento Registrado", `${newDoc.name} guardado exitosamente.`);
            }
        } catch (err: any) {
            console.error("❌ Exception in addDocument:", err);
            notify("Error", err.message || "Error inesperado al agregar documento.");
        }
    };

    const deleteDocument = async (id: string | number) => {
        try {
            showToast("Eliminando documento...", "info");
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

    const addProperty = async (p: Omit<Property, 'id'> & { imageFile?: File }) => {
        try {
            showToast("Creando propiedad...", "info");
            console.log("🏠 Creating property:", p.name);
            console.log('🚀 Iniciando Carga Propiedad. Payload:', p);
            let publicUrl = p.image; // Use blob URL or empty initially if no file

            // 1. Upload logic (New)
            if (p.imageFile) {
                const file = p.imageFile;
                console.log('Iniciando subida para propiedad (nueva):', p.name);

                const fileExt = file.name.split('.').pop();
                const fileName = `properties/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('project_files')
                    .upload(fileName, file, { upsert: true });

                if (uploadError) {
                    console.log('Error de subida:', uploadError);
                    notify("Error de Imagen", "La propiedad se creará, pero falló la subida de la imagen.");
                } else {
                    const { data: urlData } = supabase.storage.from('project_files').getPublicUrl(fileName);
                    publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Cache Busting
                    console.log('URL generada:', publicUrl);
                }
            }

            if (!p.owner_id) {
                notify("Error", "Debe seleccionar un propietario para la propiedad.");
                return;
            }

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
                owner_id: p.owner_id,
                image_url: publicUrl, // Fixed: Use correct DB column name
                contract_end_date: p.contractEnd
            }).select().single();

            if (error) {
                console.error("❌ Error creating property:", error);
                notify("Error", `No se pudo crear la propiedad: ${error.message}`);
                return;
            }

            if (data) {
                console.log("✅ Property created successfully:", data.id);
                const newProp: Property = { ...p, id: data.id, image: publicUrl };
                setProperties(prev => [newProp, ...prev]);
                // Refetch to ensure data appears for all users
                await fetchAllData();
                notify("Propiedad Agregada", `${newProp.name} creada exitosamente.`);
            }
        } catch (err: any) {
            console.error("❌ Exception in addProperty:", err);
            notify("Error", err.message || "Error inesperado al agregar propiedad.");
        }
    };

    const updateProperty = async (id: string | number, updates: Partial<Property> & { imageFile?: File }) => {
        try {
            showToast("Guardando cambios en propiedad...", "info");
            console.log('🏗️ Updating Property:', id, updates);
            console.log('🚀 Iniciando Edición Propiedad. ID:', id, 'Updates:', updates);
            let publicUrl = updates.image;

            // 1. Upload logic (Update)
            if (updates.imageFile) {
                const file = updates.imageFile;
                console.log('Iniciando subida para propiedad (update):', id);

                const fileExt = file.name.split('.').pop();
                const fileName = `properties/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('project_files')
                    .upload(fileName, file, { upsert: true });

                if (uploadError) {
                    console.log('Error de subida:', uploadError);
                    notify("Error de Imagen", "No se pudo actualizar la imagen.");
                    // We keep the old URL if upload fails? Or just don't update it.
                    // The updates.image might contain a blob URL that is useless for DB.
                    // If upload fails, we should NOT save the blob URL to DB.
                    // So we revert `publicUrl` to undefined or keep it as matches current state?
                    // Ideally we check if we have an old image.
                } else {
                    const { data: urlData } = supabase.storage.from('project_files').getPublicUrl(fileName);
                    publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Cache Busting
                    console.log('URL generada:', publicUrl);
                }
            }

            // Convert to DB Columns
            // We need to map camelCase (frontend) to snake_case (DB) if necessary, 
            // BUT looking at 'addProperty', it seems DB columns are:
            // name, address, type, status, listing_type, rent, sq_meters, rooms, bathrooms, parking, description, owner_id, image
            // We need to construct the update object carefully.

            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.type !== undefined) dbUpdates.type = updates.type;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.listingType !== undefined) dbUpdates.listing_type = updates.listingType;
            if (updates.rent !== undefined) dbUpdates.rent = updates.rent;
            if (updates.sqMeters !== undefined) dbUpdates.sq_meters = updates.sqMeters;
            if (updates.rooms !== undefined) dbUpdates.rooms = updates.rooms;
            if (updates.bathrooms !== undefined) dbUpdates.bathrooms = updates.bathrooms;
            if (updates.parking !== undefined) dbUpdates.parking = updates.parking;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.owner_id !== undefined) dbUpdates.owner_id = updates.owner_id;
            if (updates.contractEnd !== undefined) dbUpdates.contract_end_date = updates.contractEnd;

            // Only update image if we have a valid publicUrl (from successful upload) OR if explicitly clearing it (passing null?)
            // Usually we pass 'undefined' if NO change.
            if (publicUrl && publicUrl.startsWith('http')) {
                dbUpdates.image_url = publicUrl; // Fixed: Use correct DB column name
            }


            console.log('Datos enviados a Supabase:', dbUpdates); // DIAGNOSTIC LOG

            const { data, error } = await supabase.from('properties').update(dbUpdates).eq('id', id).select(); // Added select() to see response

            console.log('Respuesta DB:', data, 'Error DB:', error); // DIAGNOSTIC LOG

            if (error) {
                console.error("❌ Error updating property:", error);
                alert('Error al guardar en BD: ' + error.message); // VISIBLE ALERT
                notify("Error", `No se pudo actualizar: ${error.message}`);
                return;
            }

            // Optimistic Update / State Update
            setProperties(prev => prev.map(p => {
                if (p.id === id) {
                    return {
                        ...p,
                        ...updates,
                        image: (publicUrl && publicUrl.startsWith('http')) ? publicUrl : (p.image || publicUrl)
                        // Fallback logic: If new URL is valid (http), use it. 
                        // If not (e.g. upload failed), stick to old image. 
                        // Note: updates.image might be a blob URL for optimistic preview, but here we want the REAL one for state if confirmed,
                        // BUT `fetchAllData` will fix it eventually.
                    };
                }
                return p;
            }));

            notify("Propiedad Actualizada", "Los cambios han sido guardados.");

        } catch (err: any) {
            console.error("❌ Exception in updateProperty:", err);
            notify("Error", err.message || "Error inesperado al actualizar.");
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
            showToast("Agendando visita...", "info");
            console.log("📅 Creating visit for property:", v.propertyId);
            console.log('🚀 Agendando Visita. Fecha:', v.date, 'Propiedad:', v.propertyId);

            const { data, error } = await supabase.from('visits').insert({
                property_id: v.propertyId,
                visitor_name: v.visitorName,
                advisor: v.advisor || null, // ✅ FIX: Guardar advisor en Supabase
                date: v.date.toISOString(),
                status: v.status,
                feedback: v.feedback || null
            }).select().single();

            if (error) {
                console.error("❌ Error creating visit:", error);
                notify("Error", `No se pudo agendar la visita: ${error.message}`);
                return { success: false, message: error.message || "Error al agendar visita." };
            }

            if (data) {
                console.log("✅ Visit created successfully:", data.id);
                
                // Notificar a los administradores si el creador es un colaborador
                if (user?.role === 'Colaborador') {
                    try {
                        // ✅ FIX: Tabla correcta es 'profiles', no 'users'
                        const { data: adminUsers } = await supabase.from('profiles').select('id').in('role', ['Admin', 'Administrador']);
                        if (adminUsers && adminUsers.length > 0) {
                            for (const admin of adminUsers) {
                                await supabase.from('notifications').insert({
                                    user_id: admin.id,
                                    title: 'Nueva Visita Programada',
                                    body: `El colaborador ${user.name} ha programado una visita para el inmueble ${v.propertyName}.`,
                                    type: 'info',
                                    is_read: false
                                });
                            }
                        }
                    } catch (notifyErr) {
                        console.error("Error creating persistent notification for visit:", notifyErr);
                    }
                }

                // ✅ FIX: Notificar al asesor asignado (Colaborador) cuando Admin agenda una visita
                if (v.advisor && (user?.role === 'Admin' || user?.role === 'Administrador')) {
                    try {
                        // Buscar el perfil del asesor por nombre
                        const { data: advisorProfile } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('full_name', v.advisor)
                            .single();

                        if (advisorProfile?.id) {
                            await supabase.from('notifications').insert({
                                user_id: advisorProfile.id,
                                title: '📅 Visita Asignada',
                                body: `Se te ha asignado una visita para el inmueble ${v.propertyName} el ${v.date.toLocaleDateString('es-ES')}.`,
                                type: 'info',
                                is_read: false
                            });
                        }
                    } catch (notifyErr) {
                        console.error("Error notifying advisor for visit:", notifyErr);
                    }
                }

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
                // Refetch to ensure data appears for all users
                await fetchAllData();
                notify("Visita Agendada", `Visita para ${v.propertyName} programada.`);
                return { success: true, message: "Visita agendada correctamente." };
            }
            return { success: false, message: "No se recibieron datos de confirmación." };
        } catch (err: any) {
            console.error("❌ Exception in addVisit:", err);
            notify("Error", err.message || "Error inesperado al agendar visita.");
            return { success: false, message: err.message || "Error inesperado." };
        }
    };

    const deleteVisit = async (id: string | number): Promise<{ success: boolean; message: string }> => {
        try {
            showToast("Eliminando visita...", "info");
            const { error } = await supabase.from('visits').delete().eq('id', id);

            if (error) {
                console.error("❌ Error deleting visit:", error);
                notify("Error", "No se pudo eliminar la visita.");
                return { success: false, message: error.message };
            }

            setVisits(prev => prev.filter(v => v.id !== id));
            notify("Visita Eliminada", "El evento ha sido eliminado correctamente.");
            return { success: true, message: "Visita eliminada." };
        } catch (err: any) {
            console.error("❌ Exception in deleteVisit:", err);
            notify("Error", err.message || "Error al eliminar visita.");
            return { success: false, message: err.message };
        }
    };

    const updateVisitFeedback = async (id: string | number, feedback: string) => {
        // Now mostly redundant if updateVisit works, but kept for compatibility
        const { error } = await supabase.from('visits').update({
            feedback: feedback
        }).eq('id', id);

        if (error) {
            console.error("❌ Error saving feedback:", error);
            notify("Error", "No se pudo guardar el feedback.");
            return;
        }
        setVisits(prev => prev.map(v => v.id === id ? { ...v, feedback } : v)); // Status not forced to realized here necessarily? Or should be?
        notify("Feedback Registrado", "Se ha guardado el feedback de la visita.");
    };

    const updateVisit = async (id: string | number, updates: Partial<Visit>) => {
        try {
            showToast("Actualizando visita...", "info");
            console.log('🚀 Updating Visit:', id, updates);
            // Map local updates to Supabase columns
            const dbUpdates: any = {};
            if (updates.date) dbUpdates.date = updates.date.toISOString();
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.advisor !== undefined) dbUpdates.advisor = updates.advisor || null; // Fix: allow clearing advisor
            if (updates.visitorName) dbUpdates.visitor_name = updates.visitorName;
            if (updates.propertyId) dbUpdates.property_id = updates.propertyId;
            if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback; // Fix feedback update

            const { error } = await supabase.from('visits').update(dbUpdates).eq('id', id);

            if (error) {
                console.error("Error updating visit:", error);
                notify("Error", "No se pudo actualizar la visita.");
                return;
            }

            // Update local state
            setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
            showToast("Visita actualizada", "success");
            notify("Visita Actualizada", "Los cambios han sido guardados.");

        } catch (err) {
            console.error("Error in updateVisit:", err);
        }
    };

    // --- Financial Requests / Approvals ---

    const addFinanceRequest = async (r: Omit<FinanceRequest, 'id' | 'date' | 'status'>) => {
        try {
            showToast("Enviando solicitud financiera...", "info");
            console.log("💰 Creating finance request:", r.title);

            const { data, error } = await supabase.from('finance_requests').insert({
                title: r.title,
                description: r.desc,
                cost: r.cost,
                status: 'Pendiente',
                requester_id: user?.id,
                property_id: r.propertyId || null,
                attachment_url: r.attachmentUrl || null // ✅ FIX: Guardar adjunto en DB
            }).select().single();

            if (error) {
                console.error("❌ Error creating finance request:", error);
                notify("Error", `No se pudo enviar la solicitud: ${error.message}`);
                return;
            }

            if (data) {
                console.log("✅ Finance request created successfully:", data.id);
                const newRequest: FinanceRequest = {
                    ...r,
                    id: data.id,
                    date: new Date(data.created_at).toLocaleDateString(),
                    status: 'Pendiente'
                };
                setFinanceRequests(prev => [newRequest, ...prev]);
                // Refetch to ensure data appears for all users
                await fetchAllData();
                notify("Solicitud Enviada", "Nueva solicitud registrada exitosamente.");
            }
        } catch (err: any) {
            console.error("❌ Exception in addFinanceRequest:", err);
            notify("Error", err.message || "Error inesperado al crear solicitud.");
        }
    };

    const updateFinanceRequestStatus = async (id: string | number, status: string, reason?: string) => {
        showToast("Actualizando estado de aprobación...", "info");
        const { error } = await supabase.from('finance_requests').update({
            status: status,
            rejection_reason: reason
        }).eq('id', id);

        if (error) {
            console.error("Error updating finance status:", error);
            alert("Error al actualizar solicitud: " + error.message);
            notify("Error", "No se pudo actualizar la solicitud.");
            return;
        }

        setFinanceRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any, rejectionReason: reason || "" } : r));
        notify("Estado Actualizado", `La solicitud #${id} ha sido marcada como ${status}.`);
    };

    const addPayment = async (p: Omit<Payment, 'id'> & { status?: number }): Promise<{ success: boolean; message: string }> => {
        try {
            const finalStatus = p.status !== undefined ? p.status : 1;
            const { data, error } = await supabase.from('payments').insert({
                amount: p.amount,
                period: p.period,
                date: p.date,
                status: finalStatus,
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
                    status: finalStatus,
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

    const addUser = async (u: Omit<User, 'id'> & { propertyId?: string | number, policyNumber?: string }) => {
        try {
            console.log('🚀 Intentando registrar usuario:', u.email, u.role);

            // CRITICAL: Role Mapper - Convert Spanish UI values to technical database enums
            const roleMap: Record<string, string> = {
                'Inquilino': 'Inquilino',      // Standard
                'Arrendatario': 'Inquilino',   // Old Spanish term -> Fixed
                'Propietario': 'Propietario',  // Standard
                'Owner': 'Propietario',        // English -> Fixed
                'Administrador': 'Admin',      // Spanish -> Fixed
                'Admin': 'Admin',              // Standard
                'Colaborador': 'Colaborador',  // Standard
                'Collaborator': 'Colaborador'  // English -> Fixed
            };

            const technicalRole = roleMap[u.role] || u.role;
            console.log(`🔄 [ROLE_MAPPER] ${u.role} → ${technicalRole}`);

            if (technicalRole !== u.role) {
                console.warn(`⚠️ [ROLE_MAPPER] Corrigiendo rol no estándar: "${u.role}" → "${technicalRole}"`);
            }

            // Call Edge Function 'invite-user' to securely invite user and create profile
            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email: u.email,
                    role: technicalRole, // Use mapped role
                    full_name: u.name,
                    policy_number: u.policyNumber,
                    property_id: u.propertyId, // Add property ID
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
                setUsers(prev => [...prev, newUser]); // ✅ FIX: Solo una llamada (eliminado duplicado)

                // If Property ID is provided (Tenant Check-in), update Profile and Property Record
                if (u.propertyId) {
                    console.log(`🏠 Linking Property #${u.propertyId} to new Tenant ${data.user.id}`);
                    
                    // 1. Guardar explícitamente el property_id en el perfil del inquilino (Fallback robusto por si la Edge Function falla en el upsert)
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ property_id: u.propertyId })
                        .eq('id', data.user.id);
                        
                    if (profileError) {
                        console.error("⚠️ Error guardando property_id en profiles:", profileError);
                    }

                    // 2. Actualizar el estado de la propiedad a 'Occupied' (Alquilado) SIN cambiar el owner_id (el owner es el Propietario, no el Inquilino)
                    const { error: propError } = await supabase
                        .from('properties')
                        .update({
                            status: 'Occupied'
                            // IMPORTANTE: NO se debe reescribir el owner_id aquí porque le quitaría la propiedad al verdadero dueño.
                        })
                        .eq('id', u.propertyId);

                    if (propError) {
                        console.error("⚠️ Error linking property:", propError);
                        notify("Advertencia", "Usuario creado pero no se pudo cambiar el estado de la propiedad.");
                    } else {
                        // Update local property state
                        setProperties(prev => prev.map(p => p.id === u.propertyId ? { ...p, status: 'Occupied' } : p));
                    }
                }


                notify("Usuario Invitado", `Se ha enviado un correo de invitación a ${u.email}.`);
            } else {
                notify("Error", data?.error || "Error desconocido al invitar usuario.");
            }

        } catch (err: any) {
            console.error(err);
            notify("Error Sistema", err.message);
        }
    };

    const deleteUser = async (userId: string | number): Promise<{ success: boolean; message: string }> => {
        try {
            console.log("Invoking manage-users to delete:", userId);
            const { data, error } = await supabase.functions.invoke('manage-users', {
                body: { action: 'delete', userId: userId }
            });

            if (error) {
                console.error("Delete user error invoke:", error);
                return { success: false, message: error.message || "Error de conexión con el servidor." };
            }

            if (data?.error) {
                console.error("Delete user error data:", data.error);
                return { success: false, message: data.error };
            }

            // Success
            setUsers(prev => prev.filter(u => u.id !== userId));
            notify("Usuario Eliminado", "El usuario ha sido eliminado correctamente.");
            return { success: true, message: "Eliminado correctamente" };
        } catch (err: any) {
            console.error("Delete user exception:", err);
            return { success: false, message: err.message };
        }
    };

    const updateProfile = async (userId: string | number, updates: Partial<User>) => {
        try {
            const dbUpdates: any = {};
            if (updates.permissions) dbUpdates.permissions = updates.permissions;
            if (updates.name) dbUpdates.full_name = updates.name;
            if (updates.role) dbUpdates.role = updates.role;
            if (updates.phone) dbUpdates.phone = updates.phone;
            if (updates.photoUrl) dbUpdates.avatar_url = updates.photoUrl;

            if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
                if (error) throw error;
            }

            // Update Local State for immediate UI change
            setUser(prev => prev && prev.id === userId ? { ...prev, ...updates } : prev);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

            notify("Perfil Actualizado", "Los cambios han sido guardados correctamente.");
        } catch (err: any) {
            console.error("Error updating profile:", err);
            notify("Error", "No se pudo actualizar el perfil en la base de datos.");
        }
    };


    const updateUserStatus = async (userId: string | number, status: 'Al Día' | 'Pendiente de Pago' | 'En Mora') => {
        try {
            const { data, error } = await supabase.from('profiles').update({ financial_status: status }).eq('id', userId).select();
            if (error) {
                console.error("Error updating user status:", error);
                notify("Error", "No se pudo actualizar el estado del usuario.");
                return;
            }
            if (!data || data.length === 0) {
                console.warn("Silent failure updating user status (possibly blocked by RLS permissions).");
                notify("Alerta de Permisos", "No se guardaron los cambios debido a restricciones de seguridad (RLS).");
                return;
            }
            showToast("Estado actualizado correctamente", "success");
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, financialStatus: status } : u));
            notify("Estado Actualizado", `El estado del usuario ahora es: ${status}`);
        } catch (err) {
            console.error(err);
        }
    };



    // --- Notifications ---
    const requestNotificationPermission = async () => {
        try {
            if (!("Notification" in window)) {
                console.log("This browser does not support desktop notifications");
                return;
            }

            if (Notification.permission === "granted") {
                console.log("Notification permission already granted.");
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                console.log("Notification permission granted.");
                try {
                    new Notification("Sikai CX", {
                        body: "Notificaciones activadas correctamente.",
                        icon: "/sikai-icon.png"
                    });
                } catch (e) {
                    // Ignore error if new Notification fails on mobile
                }
            }
        } catch (error) {
            console.warn("Notification permission request failed (safely handled):", error);
        }
    };

    return (
        <StoreContext.Provider value={{
            user, loading, login, logout, users, addUser, deleteUser,
            tickets, addTicket, updateTicketStatus, updateTicketPriority, assignTicket, addMessageToTicket,
            documents, addDocument, deleteDocument,
            properties, addProperty, updatePropertyStatus, updateProperty,
            visits, addVisit, updateVisit, updateVisitFeedback, deleteVisit,
            financeRequests, addFinanceRequest, updateFinanceRequestStatus,
            payments, addPayment, updateUserStatus, updateProfile, uploadAvatar,
            notifications, markNotificationAsRead, fetchNotifications,
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
