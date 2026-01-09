import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export const DebugConnection: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const clearStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
        addLog("STORAGE CLEARED. Refresca la página.");
        alert("Almacenamiento limpio. Por favor recarga la página ahora.");
    };

    const runTests = async () => {
        setLogs([]);
        addLog("Iniciando pruebas de diagnóstico V4...");

        const url = 'https://eqfsekdvzdklhhcqifuk.supabase.co';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZnNla2R2emRrbGhoY3FpZnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk1ODIsImV4cCI6MjA4MzIxNTU4Mn0.QWoxJOtjhJcKC7QBkjAof0D7kXFmiGlMjoHD-ZQD0PI';

        // 1. Check Internet (Fetch to a public CDN usually allow-listed or similar)
        try {
            addLog("Test 1: Ping Supabase URL (Raw Fetch no-cors)...");
            const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            addLog(`Test 1 OK: Request sent (Opaque response).`);
        } catch (e: any) {
            addLog(`Test 1 FALLÓ: ${e.message}`);
        }

        // 1.5 Manual REST Fetch (Better URL)
        try {
            // Trying a simpler endpoint like Swagger/Docs or just root REST
            addLog("Test 1.5: Manual REST Fetch (Table: properties)...");
            const restUrl = `${url}/rest/v1/properties?select=count`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(restUrl, {
                method: 'GET',
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const text = await res.text();
                addLog(`Test 1.5 OK: Status ${res.status}. Data length: ${text.length}`);
            } else {
                addLog(`Test 1.5 FAILED HTTP: ${res.status} ${res.statusText}`);
            }
        } catch (e: any) {
            if (e.name === 'AbortError') addLog("Test 1.5 TIMEOUT: Bloqueo de Headers confirmado.");
            else addLog(`Test 1.5 EXCEPCIÓN: ${e.message}`);
        }

        // 2. Check Supabase Client Select (Shared Instance)
        try {
            addLog("Test 2: Supabase Client Select (Shared Instance)...");
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT 10s - CLIENTE BLOQUEADO")), 10000));

            // Try a pure select, NO Auth involved first if possible (though client inits auth by default)
            const request = supabase.from('properties').select('count', { count: 'exact', head: true });

            // @ts-ignore
            const result = await Promise.race([request, timeout]);
            const { count, error } = result as any;

            if (error) {
                addLog(`Test 2 ERROR Supabase: ${JSON.stringify(error)}`);
            } else {
                addLog(`Test 2 ÉXITO: Connected. Count: ${count}`);
            }
        } catch (e: any) {
            addLog(`Test 2 FALLÓ: ${e.message}`);
            if (e.message.includes("TIMEOUT")) {
                addLog("--> POSIBLE CAUSA: Token corrupto en LocalStorage o bloqueo de WebSocket/Client.");
            }
        }

        // 3. Check Auth Config
        try {
            addLog("Test 3: Auth Session...");
            const { data } = await supabase.auth.getSession();
            addLog(`Test 3 Session: ${data.session?.user?.email || 'Ninguna'}`);
        } catch (e: any) {
            addLog(`Test 3 ERROR: ${e.message}`);
        }

        // 4. Check Isolated Client
        try {
            addLog("Test 4: Isolated Supabase Client (No LocalStorage)...");
            const tempClient = createClient(url, anonKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT 10s - CLIENTE AISLADO BLOQUEADO")), 10000));
            const request = tempClient.from('properties').select('count', { count: 'exact', head: true });

            // @ts-ignore
            const result = await Promise.race([request, timeout]);
            // @ts-ignore
            const { count, error } = result;

            if (error) {
                addLog(`Test 4 ERROR Supabase: ${JSON.stringify(error)}`);
            } else {
                addLog(`Test 4 ÉXITO: Connected. Count: ${count}`);
            }

        } catch (e: any) {
            addLog(`Test 4 FALLÓ: ${e.message}`);
        }

        addLog("Diagnóstico finalizado.");
    };

    useEffect(() => {
        runTests();
    }, []);

    return (
        <div className="p-8 bg-white min-h-screen font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Panel de Diagnóstico de Conexión</h1>
            <div className="flex gap-4 mb-4">
                <button
                    onClick={runTests}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Re-ejecutar Pruebas
                </button>
                <button
                    onClick={clearStorage}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    Limpiar Cache / Storage
                </button>
            </div>
            <div className="bg-gray-100 p-4 rounded border border-gray-300 h-96 overflow-auto">
                {logs.map((log, i) => (
                    <div key={i} className="mb-1 border-b border-gray-200 pb-1">{log}</div>
                ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
                <p>Si todas las pruebas fallan, verifica tu conexión a internet.</p>
                <p>Si Test 1 falla, es bloqueo de red.</p>
                <p>Si Test 1.5 pasa pero Test 2 falla, es probable issue con cache de sesión (Intenta Test 4).</p>
                <p>Si Test 4 pasa, usa el botón "Limpiar Cache / Storage".</p>
            </div>
        </div>
    );
};
