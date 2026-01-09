import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const DebugConnection: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runTests = async () => {
        setLogs([]);
        addLog("Iniciando pruebas de diagnóstico V2...");

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

        // 1.5 Manual REST Fetch
        try {
            addLog("Test 1.5: Manual REST Fetch (con Headers)...");
            const restUrl = `${url}/rest/v1/users?select=count`;

            // Timeout wrapper for fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(restUrl, {
                method: 'GET',
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                addLog(`Test 1.5 OK : Status ${res.status}`);
            } else {
                addLog(`Test 1.5 ERROR HTTP: ${res.status} ${res.statusText}`);
            }
        } catch (e: any) {
            if (e.name === 'AbortError') addLog("Test 1.5 TIMEOUT: La petición con Headers se quedó colgada.");
            else addLog(`Test 1.5 EXCEPCIÓN: ${e.message}`);
        }

        // 2. Check Supabase Client Select
        try {
            addLog("Test 2: Supabase Client Select...");
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT 5s")), 5000));
            const request = supabase.from('users').select('*', { count: 'exact', head: true });

            // @ts-ignore
            const result = await Promise.race([request, timeout]);
            const { count, error } = result as any;

            if (error) {
                addLog(`Test 2 ERROR Supabase: ${error.message}`);
            } else {
                addLog(`Test 2 ÉXITO: Connected. Count: ${count}`);
            }
        } catch (e: any) {
            addLog(`Test 2 FALLÓ: ${e.message}`);
        }

        // 3. Check Auth Config
        try {
            addLog("Test 3: Auth Config Verification...");
            const { data } = await supabase.auth.getSession();
            addLog(`Test 3 Session: ${data.session ? 'Activa' : 'Ninguna'}`);
        } catch (e: any) {
            addLog(`Test 3 ERROR: ${e.message}`);
        }

        addLog("Diagnóstico finalizado. Si Test 1 pasa pero 1.5 falla, es un bloqueo de Headers/CORS.");
    };

    useEffect(() => {
        runTests();
    }, []);

    return (
        <div className="p-8 bg-white min-h-screen font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Panel de Diagnóstico de Conexión</h1>
            <button
                onClick={runTests}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
            >
                Re-ejecutar Pruebas
            </button>
            <div className="bg-gray-100 p-4 rounded border border-gray-300 h-96 overflow-auto">
                {logs.map((log, i) => (
                    <div key={i} className="mb-1 border-b border-gray-200 pb-1">{log}</div>
                ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
                <p>Si todas las pruebas fallan, verifica tu conexión a internet.</p>
                <p>Si Test 1 falla, es bloqueo de red.</p>
                <p>Si Test 1 pasa pero Test 2 falla, es configuración de Supabase (RLS/Key).</p>
            </div>
        </div>
    );
};
