import { useMemo } from 'react';

const CompletionBar = ({ cvData, compact = false }) => {
  const { pct, label } = useMemo(() => {
    const checks = [
      { done: !!cvData.personal?.name, weight: 2 },
      { done: !!cvData.personal?.email, weight: 2 },
      { done: !!cvData.personal?.phone, weight: 1 },
      { done: !!cvData.personal?.linkedin, weight: 1 },
      { done: !!cvData.personal?.title, weight: 1 },
      { done: !!cvData.summary?.trim(), weight: 3 },
      { done: (cvData.education || []).some(e => !e.hidden && e.institution), weight: 2 },
      { done: (cvData.experience || []).some(e => !e.hidden && e.company), weight: 3 },
      { done: (cvData.projects || []).some(p => !p.hidden && p.name), weight: 2 },
      { done: Array.isArray(cvData.skills) && cvData.skills.some(s => !s.hidden && s.items), weight: 2 },
    ];
    const total = checks.reduce((s, c) => s + c.weight, 0);
    const done = checks.filter(c => c.done).reduce((s, c) => s + c.weight, 0);
    const pct = Math.round((done / total) * 100);
    const label = pct < 40 ? 'Getting started' : pct < 70 ? 'Looking good!' : pct < 90 ? 'Almost there' : 'Profile complete!';
    return { pct, label };
  }, [cvData]);

  const color = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : pct < 90 ? '#3b82f6' : '#10b981';

  return (
    <div className={`completion-bar-wrap no-print${compact ? ' compact' : ''}`} title={`${label} — ${pct}%`}>
      {!compact && (
        <div className="completion-bar-header">
          <span className="completion-label">{label}</span>
          <span className="completion-pct" style={{ color }}>{pct}%</span>
        </div>
      )}
      <div className="completion-track">
        <div className="completion-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

export default CompletionBar;
