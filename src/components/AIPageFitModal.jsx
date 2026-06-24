import { useState } from 'react';
import {
  X, Sparkles, Loader, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, FileText, Minimize2, Maximize2
} from 'lucide-react';
import './AIPageFitModal.css';

const OR_BASE     = 'https://openrouter.ai/api/v1/chat/completions';
const OR_MODEL    = 'google/gemini-2.5-flash';
const OR_FALLBACK = 'google/gemini-1.5-flash';

async function callAI(prompt) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  if (!apiKey) throw new Error('NO_KEY');

  const models = [OR_MODEL, OR_FALLBACK];
  for (const model of models) {
    const res = await fetch(OR_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cvmate.app',
        'X-Title': 'CV Mate'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096
      })
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty AI response');
      return text;
    }

    if (res.status === 401) throw new Error('AUTH');
    if (res.status === 402) throw new Error('CREDITS');
    if (res.status === 429 && model !== OR_FALLBACK) continue;
    if (res.status >= 500 && model !== OR_FALLBACK) continue;
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
}

function friendlyErr(e) {
  switch (e.message) {
    case 'NO_KEY':     return 'Set VITE_OPENROUTER_API_KEY in your .env to enable AI.';
    case 'AUTH':       return 'Invalid API key — check VITE_OPENROUTER_API_KEY.';
    case 'CREDITS':    return 'OpenRouter credits exhausted. Top up at openrouter.ai.';
    case 'PARSE_FAIL': return 'Unexpected AI response format. Try again.';
    default:           return `AI error: ${e.message?.slice(0, 120) || 'Unknown'}`;
  }
}

// ── Strip HTML tags to plain text for the AI prompt ──────────────────
const stripHtml = (s = '') => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// ── Estimate current word count (proxy for content density) ──────────
function countWords(cvData) {
  const { summary = '', experience = [], projects = [] } = cvData;
  let words = stripHtml(summary).split(/\s+/).filter(Boolean).length;
  (experience || []).forEach(e => { words += stripHtml(e.description || '').split(/\s+/).filter(Boolean).length; });
  (projects   || []).forEach(p => { words += stripHtml(p.description || '').split(/\s+/).filter(Boolean).length; });
  return words;
}

// ── Build the rewrite prompt ──────────────────────────────────────────
function buildPrompt(cvData, targetPages) {
  const { personal, summary, experience, projects } = cvData;

  const direction = targetPages === 1 ? 'condense aggressively'
    : targetPages === 2 ? 'condense moderately'
    : targetPages <= 3 ? 'keep roughly the same length or expand slightly'
    : 'expand with more detail';

  // Serialise only the narrative fields the AI should rewrite
  const expPayload = (experience || []).filter(e => !e.hidden).map(e => ({
    id: e.id,
    company: e.company,
    role: e.role,
    description: stripHtml(e.description || '')
  }));

  const projPayload = (projects || []).filter(p => !p.hidden).map(p => ({
    id: p.id,
    name: p.name,
    description: stripHtml(p.description || '')
  }));

  return `You are an expert CV editor. Rewrite the candidate's narrative content so the CV fits naturally on exactly ${targetPages} A4 page${targetPages > 1 ? 's' : ''}.

TARGET: ${targetPages} page${targetPages > 1 ? 's' : ''} — ${direction}.

RULES:
- Rewrite ONLY the summary, experience descriptions, and project descriptions
- Do NOT change: company names, job titles, dates, locations, skills, education, certifications, or any other structured field
- For condensing: trim filler words, merge related bullets, remove less-impactful points — keep strongest achievements with metrics
- For expanding: add relevant context, elaborate on impact/scope/tech choices, unpack bullet points into richer descriptions
- Keep the professional tone and all factual claims
- Experience descriptions: keep bullet format with "- " prefix per line, no HTML
- Project descriptions: keep as HTML <ul><li>...</li></ul> with concise but complete entries
- Summary: plain text, no HTML, no bullet points

Output ONLY raw JSON in this exact shape — no markdown, no explanation:
{
  "summary": "<rewritten plain-text summary>",
  "experience": [
    { "id": "<exact id>", "description": "<rewritten bullets with - prefix>" }
  ],
  "projects": [
    { "id": "<exact id>", "description": "<rewritten HTML <ul><li>…</li></ul>>" }
  ]
}

CANDIDATE:
Name: ${personal?.name || 'Candidate'}
Title: ${personal?.title || 'Professional'}

CURRENT SUMMARY:
${stripHtml(summary) || '(none)'}

CURRENT EXPERIENCE:
${JSON.stringify(expPayload, null, 2)}

CURRENT PROJECTS:
${JSON.stringify(projPayload, null, 2)}`;
}

// ── Apply AI result back onto cvData ─────────────────────────────────
function applyRewrite(cvData, rewrite) {
  const expMap = Object.fromEntries((rewrite.experience || []).map(e => [e.id, e.description]));
  const projMap = Object.fromEntries((rewrite.projects  || []).map(p => [p.id, p.description]));

  return {
    ...cvData,
    summary: rewrite.summary ?? cvData.summary,
    experience: (cvData.experience || []).map(e =>
      expMap[e.id] !== undefined ? { ...e, description: expMap[e.id] } : e
    ),
    projects: (cvData.projects || []).map(p =>
      projMap[p.id] !== undefined ? { ...p, description: projMap[p.id] } : p
    )
  };
}

// ── Diff viewer: show old vs new for a single field ──────────────────
function DiffBlock({ label, before, after }) {
  const [open, setOpen] = useState(false);
  const changed = before?.trim() !== after?.trim();
  if (!changed || !after?.trim()) return null;

  return (
    <div className="pgf-diff-block">
      <button className="pgf-diff-toggle" onClick={() => setOpen(o => !o)}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="pgf-diff-label">{label}</span>
        <span className="pgf-diff-badge">changed</span>
      </button>
      {open && (
        <div className="pgf-diff-body">
          <div className="pgf-diff-side pgf-diff-before">
            <span className="pgf-diff-side-label">Before</span>
            <p>{stripHtml(before) || '—'}</p>
          </div>
          <div className="pgf-diff-side pgf-diff-after">
            <span className="pgf-diff-side-label">After</span>
            <p>{stripHtml(after) || '—'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page count selector ───────────────────────────────────────────────
const PAGE_OPTIONS = [1, 2, 3, 4];

// ── Main modal ────────────────────────────────────────────────────────
export default function AIPageFitModal({ cvData, onClose, onApply }) {
  const [targetPages, setTargetPages] = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [rewrite, setRewrite]   = useState(null); // parsed AI result
  const [newCvData, setNewCvData] = useState(null);

  const currentWords = countWords(cvData);

  const generate = async () => {
    setLoading(true);
    setError('');
    setRewrite(null);
    setNewCvData(null);
    try {
      const raw = await callAI(buildPrompt(cvData, targetPages));
      const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const json = clean.match(/\{[\s\S]*\}/)?.[0];
      if (!json) throw new Error('PARSE_FAIL');
      const parsed = JSON.parse(json);
      setRewrite(parsed);
      setNewCvData(applyRewrite(cvData, parsed));
    } catch (e) {
      setError(friendlyErr(e));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (newCvData) { onApply(newCvData); onClose(); }
  };

  const newWords = newCvData ? countWords(newCvData) : 0;
  const wordDelta = newWords - currentWords;

  return (
    <div className="pgf-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pgf-modal" role="dialog" aria-modal="true" aria-label="AI Page Fit">

        {/* Header */}
        <div className="pgf-header">
          <div className="pgf-header-left">
            <span className="pgf-header-icon">
              <FileText size={18} />
            </span>
            <div>
              <h2 className="pgf-title">AI Page Fit</h2>
              <p className="pgf-subtitle">Rewrite CV content to hit an exact page count</p>
            </div>
          </div>
          <button className="pgf-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Page selector */}
        <div className="pgf-selector-section">
          <p className="pgf-selector-label">Target page count</p>
          <div className="pgf-page-options">
            {PAGE_OPTIONS.map(n => (
              <button
                key={n}
                className={`pgf-page-btn ${targetPages === n ? 'active' : ''}`}
                onClick={() => { setTargetPages(n); setRewrite(null); setNewCvData(null); setError(''); }}
              >
                <span className="pgf-page-num">{n}</span>
                <span className="pgf-page-label">{n === 1 ? 'page' : 'pages'}</span>
                {n === 1 && <span className="pgf-page-tag compact">Compact</span>}
                {n === 2 && <span className="pgf-page-tag standard">Standard</span>}
                {n === 3 && <span className="pgf-page-tag senior">Senior</span>}
                {n === 4 && <span className="pgf-page-tag detailed">Detailed</span>}
              </button>
            ))}
          </div>

          <div className="pgf-context-row">
            <div className="pgf-context-item">
              <span className="pgf-context-key">Current content</span>
              <span className="pgf-context-val">~{currentWords} words</span>
            </div>
            <div className="pgf-context-item">
              <span className="pgf-context-key">Strategy</span>
              <span className="pgf-context-val">
                {targetPages === 1 ? 'Condense aggressively — strongest points only'
                  : targetPages === 2 ? 'Condense moderately — keep key achievements'
                  : targetPages === 3 ? 'Balance depth and brevity'
                  : 'Expand with richer context and detail'}
              </span>
            </div>
            <div className="pgf-context-item">
              <span className="pgf-context-key">Fields rewritten</span>
              <span className="pgf-context-val">Summary, experience bullets, project descriptions</span>
            </div>
          </div>
        </div>

        {/* Generate button */}
        {!rewrite && !loading && (
          <button className="pgf-generate-btn" onClick={generate}>
            {targetPages < 3
              ? <><Minimize2 size={15} /> Condense to {targetPages} {targetPages === 1 ? 'page' : 'pages'}</>
              : <><Maximize2 size={15} /> Expand to {targetPages} pages</>
            }
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="pgf-loading">
            <Loader size={26} className="pgf-spin" />
            <div>
              <p className="pgf-loading-label">Rewriting CV content…</p>
              <p className="pgf-loading-sub">
                {targetPages < 3 ? 'Trimming to essentials' : 'Expanding with context'} · 15–25 seconds
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="pgf-error">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Preview diff */}
        {rewrite && newCvData && (
          <>
            <div className="pgf-result-banner">
              <CheckCircle size={15} color="#10b981" />
              <span>Review changes before applying</span>
              <div className="pgf-word-delta">
                <span className="pgf-word-before">{currentWords}w</span>
                <span className="pgf-arrow">→</span>
                <span className="pgf-word-after">{newWords}w</span>
                <span className={`pgf-word-change ${wordDelta < 0 ? 'less' : 'more'}`}>
                  {wordDelta > 0 ? `+${wordDelta}` : wordDelta} words
                </span>
              </div>
            </div>

            <div className="pgf-diff-scroll">
              <DiffBlock
                label="Summary"
                before={cvData.summary}
                after={rewrite.summary}
              />
              {(cvData.experience || []).filter(e => !e.hidden).map(e => {
                const after = (rewrite.experience || []).find(r => r.id === e.id)?.description;
                return (
                  <DiffBlock
                    key={e.id}
                    label={`${e.role} @ ${e.company}`}
                    before={e.description}
                    after={after}
                  />
                );
              })}
              {(cvData.projects || []).filter(p => !p.hidden).map(p => {
                const after = (rewrite.projects || []).find(r => r.id === p.id)?.description;
                return (
                  <DiffBlock
                    key={p.id}
                    label={`Project: ${p.name}`}
                    before={p.description}
                    after={after}
                  />
                );
              })}
            </div>

            <div className="pgf-actions">
              <button
                className="pgf-retry-btn"
                onClick={generate}
                disabled={loading}
              >
                <Sparkles size={13} /> Try again
              </button>
              <button className="pgf-apply-btn" onClick={handleApply}>
                <CheckCircle size={14} /> Apply to CV
              </button>
            </div>

            <p className="pgf-disclaimer">
              Only summary, experience bullets, and project descriptions are changed. All other fields are untouched.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
