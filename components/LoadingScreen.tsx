import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';

export const LoadingScreen: React.FC = () => {
    const { loading } = useStore();
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        if (loading) {
            setShouldRender(true);
            // Small delay to allow render before fading in (if necessary), or just show immediately
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            // Start fade out
            setIsVisible(false);
            // Wait for transition to finish before removing from DOM
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 500); // 500ms matches transition duration
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark transition-opacity duration-500 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div className="relative flex items-center justify-center">
                {/* Pulse Ring */}
                <div className="absolute w-32 h-32 rounded-full border-4 border-primary/30 animate-pulse-ring"></div>
                <div className="absolute w-32 h-32 rounded-full border-4 border-primary/30 animate-pulse-ring" style={{ animationDelay: '1s' }}></div>

                {/* Main Logo Container */}
                <div className="relative z-10 w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center p-4 animate-breathe border-4 border-white dark:border-gray-800">
                    <img
                        src="/sikai-logo.png"
                        alt="CGBI Loading"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            <h2 className="mt-8 text-xl font-medium tracking-widest text-primary font-outfit uppercase animate-pulse">
                Cargando
            </h2>
        </div>
    );
};
