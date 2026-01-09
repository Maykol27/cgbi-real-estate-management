import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const DebugConnection: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runTests = async () => {
        setLogs([]);
        addLog("Iniciando pruebas de diagnóstico...");

        // 1. Check Internet (Fetch to a public CDN usually allow-listed or similar)
        // Note: Generic fetch might fail CORS, so we test Supabase Health endpoint
        try {
            addLog("Test 1: Ping Supabase URL (Raw Fetch)...");
            const url = 'https://eqfsekdvzdklhhcqifuk.supabase.co'; // Base URL
            const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            // no-cors means we won't see status, but if it doesn't throw, we reached it.
            addLog(`Test 1 OK: Request sent (Opaque response).`);
        } catch (e: any) {
            addLog(`Test 1 FALLÓ: ${e.message}`);
        }

        // 2. Check Supabase Client Select
        try {
            addLog("Test 2: Supabase Client Select ('users' table)...");
            const start = Date.now();
            const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const time = Date.now() - start;

            if (error) {
                addLog(`Test 2 ERROR Supabase: ${error.message} (Code: ${error.code})`);
            } else {
                addLog(`Test 2 ÉXITO: Conectado en ${time}ms. Users count: ${count}`);
            }
        } catch (e: any) {
            addLog(`Test 2 EXCEPCIÓN: ${e.message}`);
        }

        // 3. Check Auth Config
        try {
            addLog("Test 3: Auth Config Verification...");
            const { data } = await supabase.auth.getSession();
            addLog(`Test 3 Session: ${data.session ? 'Activa' : 'Ninguna'}`);
        } catch (e: any) {
            addLog(`Test 3 ERROR: ${e.message}`);
        }

        addLog("Diagnóstico finalizado.");
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
