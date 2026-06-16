import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateToast() {
  const [visible, setVisible] = useState(false);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      // Poll every 60 s so users on long sessions still get updates promptly.
      if (r) setInterval(() => r.update(), 60_000);
    }
  });

  useEffect(() => {
    if (needRefresh) setVisible(true);
  }, [needRefresh]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
      background: '#1e293b', border: '1px solid #334155', borderRadius: '10px',
      padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 9999, color: '#f1f5f9',
      fontSize: '0.9rem', whiteSpace: 'nowrap'
    }}>
      <span>A new version of CV Mate is available.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px',
          padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
        }}
      >
        Update now
      </button>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'transparent', color: '#64748b', border: 'none',
          cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0 4px'
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
