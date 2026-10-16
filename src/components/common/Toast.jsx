import { useState, useEffect, useCallback } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const colors = {
    success: '#34B97A',
    error: '#EF4444',
    info: 'var(--accent)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-card)',
        border: `1px solid ${colors[type]}`,
        borderLeftWidth: 4,
        borderRadius: 'var(--radius-sm)',
        padding: '12px 20px',
        fontSize: 14,
        fontWeight: 500,
        color: 'var(--text-primary)',
        boxShadow: '0 8px 30px var(--shadow-lg)',
        zIndex: 2000,
        animation: 'fadeInUp 0.3s ease',
        maxWidth: '90vw',
      }}
    >
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);
  const closeToast = useCallback(() => setToast({ message: '', type: 'success' }), []);
  return { toast, showToast, closeToast, ToastEl: <Toast {...toast} onClose={closeToast} /> };
}
