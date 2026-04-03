import React, {
  createContext, useContext, useState, useCallback
} from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-3), { id, message, type }]);
    const duration = type === 'error' ? 5000 : 3500;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} remove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, remove }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      zIndex: 9500
    }}>
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={() => remove(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const colors = {
    success: 'var(--green)',
    error:   'var(--red)',
    warning: '#FFB400',
    info:    'var(--cyan)'
  };
  const color = colors[toast.type] || colors.success;

  return (
    <div
      className="clip-sm"
      style={{
        background:     'var(--card-bg)',
        border:         `1px solid ${color}`,
        borderLeft:     `3px solid ${color}`,
        boxShadow:      `0 0 20px ${color}33`,
        padding:        '12px 16px',
        width:          '320px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        animation:      'toastEnter 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily:     "'Share Tech Mono', monospace",
        fontSize:       '13px',
        color:          color
      }}
    >
      <span>{toast.message}</span>
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none',
          color: 'var(--dim)', cursor: 'pointer',
          fontSize: '16px', marginLeft: '12px'
        }}
      >✕</button>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
