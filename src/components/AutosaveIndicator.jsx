import { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';

const AutosaveIndicator = ({ profilesState }) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip the initial mount to avoid showing "Saved" on first load
    if (isFirst.current) { isFirst.current = false; return; }
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timerRef.current);
  }, [profilesState]);

  return (
    <div className={`autosave-indicator no-print ${visible ? 'autosave-visible' : ''}`}>
      <CheckCircle size={13} />
      <span>Saved</span>
    </div>
  );
};

export default AutosaveIndicator;
