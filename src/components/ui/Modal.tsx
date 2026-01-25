import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    zIndex?: number;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    zIndex = 50,
    maxWidth
}) => {
    // 🔍 DEBUGGING: Log every render
    useEffect(() => {
        console.log('🎭 [MODAL.TSX] Component Rendered', { isOpen, title, zIndex });
        console.log('🎭 [MODAL.TSX] document.body exists?', !!document.body);
    });

    useEffect(() => {
        if (isOpen) {
            console.log('🟢 [MODAL.TSX] MODAL SHOULD BE VISIBLE NOW', { title });
            // Debug: Check if Portal mounted
            setTimeout(() => {
                const portals = document.body.querySelectorAll('[role="dialog"]');
                console.log('🔍 [MODAL.TSX] Dialogs in body:', portals.length, portals);
            }, 100);
        } else {
            console.log('🔴 [MODAL.TSX] MODAL CLOSED', { title });
        }
    }, [isOpen, title]);

    if (!isOpen) {
        console.log('⚠️ [MODAL.TSX] Early return - isOpen=false');
        return null;
    }

    const sizeMap = {
        sm: '400px',
        md: '600px',
        lg: '900px',
        xl: '1200px'
    };

    const widthValue = maxWidth || sizeMap[size];

    console.log('✅ [MODAL.TSX] Creating Portal NOW', { title, widthValue, zIndex });

    // 🚨 FORCE VISIBILITY TEST - Using ONLY inline styles, NO Tailwind
    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: zIndex,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                overflow: 'auto',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    maxWidth: widthValue,
                    width: '100%',
                    padding: '24px',
                    position: 'relative',
                    border: '3px solid #ff0000', // 🚨 RED BORDER for debugging
                    minHeight: '300px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Debug Header */}
                <div style={{
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#111827',
                        margin: 0
                    }}>
                        {title || 'Modal Title'}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: '2px solid #ff0000',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            color: '#6b7280',
                            padding: 0
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{ color: '#000' }}>
                    {children || <p style={{ color: '#ff0000', fontWeight: 'bold' }}>NO CHILDREN PROVIDED</p>}
                </div>

                {/* Debug Info */}
                <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    border: '2px solid #f59e0b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                }}>
                    <strong>DEBUG:</strong> isOpen={String(isOpen)} | zIndex={zIndex} | size={size}
                </div>
            </div>
        </div>,
        document.body
    );
};
