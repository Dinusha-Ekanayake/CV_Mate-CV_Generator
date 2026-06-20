import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'], action: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
  { keys: ['Ctrl', 'P'], action: 'Print / PDF' },
  { keys: ['Ctrl', 'E'], action: 'Export JSON' },
  { keys: ['Ctrl', 'D'], action: 'Download PDF' },
  { keys: ['Ctrl', 'W'], action: 'Export DOCX' },
  { keys: ['?'], action: 'Show shortcuts' },
  { keys: ['Escape'], action: 'Close modal' },
];

const KeyboardShortcuts = ({ onUndo, onRedo, onPrint, onExport, onDownloadPdf, onDocx }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.contentEditable === 'true';

      if (e.key === '?' && !isTyping) { setShowModal(v => !v); return; }
      if (e.key === 'Escape') { setShowModal(false); return; }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); onUndo?.(); return; }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); onRedo?.(); return; }
        if (e.key === 'p') { e.preventDefault(); onPrint?.(); return; }
        if (e.key === 'e' && !e.shiftKey) { e.preventDefault(); onExport?.(); return; }
        if (e.key === 'd') { e.preventDefault(); onDownloadPdf?.(); return; }
        if (e.key === 'w') { e.preventDefault(); onDocx?.(); return; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo, onPrint, onExport, onDownloadPdf, onDocx]);

  if (!showModal) return null;

  return (
    <div className="shortcuts-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
      <div className="shortcuts-modal">
        <div className="shortcuts-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} /> Keyboard Shortcuts
          </span>
          <button className="shortcuts-close" onClick={() => setShowModal(false)}><X size={16} /></button>
        </div>
        <div className="shortcuts-list">
          {SHORTCUTS.map(s => (
            <div key={s.action} className="shortcut-row">
              <span className="shortcut-action">{s.action}</span>
              <div className="shortcut-keys">
                {s.keys.map((k, i) => (
                  <span key={i}>
                    <kbd className="kbd">{k}</kbd>
                    {i < s.keys.length - 1 && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="shortcuts-hint">Press <kbd className="kbd">?</kbd> anywhere to toggle this panel</p>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
