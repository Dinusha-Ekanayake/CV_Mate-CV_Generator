import { useState, useRef } from 'react';
import {
  X, Sparkles, Loader, AlertCircle, ChevronDown, ChevronRight,
  Cpu, Users, Briefcase, Copy, Check, RefreshCw
} from 'lucide-react';
import './InterviewPrepModal.css';

const OR_BASE    = 'https://openrouter.ai/api/v1/chat/completions';
const OR_MODEL   = 'google/gemini-2.5-flash';
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
        temperature: 0.75,
        max_tokens: 2048
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

// ── Build the prediction prompt ──────────────────────────────────────
function buildPrompt(cvData, jd) {
  const { personal, summary, experience, projects, skills, education } = cvData;

  const expLines = (experience || [])
    .filter(e => !e.hidden).slice(0, 5)
    .map(e => `- ${e.role} at ${e.company}${e.dates ? ` (${e.dates})` : ''}`)
    .join('\n');

  const projLines = (projects || [])
    .filter(p => !p.hidden).slice(0, 4)
    .map(p => `- ${p.name}${p.tech ? ` [${p.tech}]` : ''}`)
    .join('\n');

  const skillList = (Array.isArray(skills) ? skills : [])
    .filter(s => !s.hidden && s.items)
    .map(s => `${s.category}: ${s.items}`)
    .join('; ');

  const eduLines = (education || [])
    .filter(e => !e.hidden).slice(0, 2)
    .map(e => `- ${e.degree} at ${e.institution}${e.dates ? ` (${e.dates})` : ''}`)
    .join('\n');

  return `You are a senior technical recruiter with 15+ years of experience conducting interviews. Analyse the candidate's CV and predict the most likely interview questions a recruiter or hiring panel would ask.

CANDIDATE PROFILE:
Name: ${personal.name || 'Candidate'}
Title: ${personal.title || 'Professional'}
${summary ? `Summary: ${summary.replace(/<[^>]+>/g, ' ').slice(0, 300)}` : ''}

EXPERIENCE:
${expLines || 'Not provided'}

EDUCATION:
${eduLines || 'Not provided'}

PROJECTS:
${projLines || 'Not provided'}

SKILLS: ${skillList || 'Not provided'}
${jd.trim() ? `\nTARGET JOB DESCRIPTION:\n${jd.slice(0, 2500)}` : ''}

Generate exactly 12 high-quality interview questions grouped into 3 categories. For each question, also provide a short "Why asked" hint (1 sentence explaining what the interviewer is probing for).

Respond in this exact JSON format (no markdown, no code fences, raw JSON only):
{
  "role": "<inferred job title / role being applied for>",
  "technical": [
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" }
  ],
  "behavioural": [
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" }
  ],
  "roleSpecific": [
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" },
    { "q": "<question>", "hint": "<why asked>" }
  ]
}

Rules:
- Technical: probe specific technologies, frameworks, system design decisions visible in the CV
- Behavioural: STAR-format questions about real situations from their experience and projects
- Role-specific: questions about domain knowledge, processes, and culture fit for this type of role
- Make questions feel genuinely tailored to THIS candidate — not generic
- hints should be short (under 15 words), practical, direct
- Output raw JSON only`;
}

// ── Question card ─────────────────────────────────────────────────────
function QuestionCard({ item, index }) {
  const [copied, setCopied] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(item.q).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="iq-card">
      <div className="iq-card-top">
        <span className="iq-num">{index + 1}</span>
        <p className="iq-question">{item.q}</p>
        <button className="iq-copy" onClick={copy} title="Copy question" aria-label="Copy">
          {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
        </button>
      </div>
      {item.hint && (
        <button className="iq-hint-toggle" onClick={() => setHintOpen(o => !o)}>
          {hintOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          Why asked
        </button>
      )}
      {hintOpen && item.hint && (
        <p className="iq-hint">{item.hint}</p>
      )}
    </div>
  );
}

// ── Category section ─────────────────────────────────────────────────
const CATEGORY_META = {
  technical:    { label: 'Technical',    icon: Cpu,      color: '#60a5fa', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)'  },
  behavioural:  { label: 'Behavioural',  icon: Users,    color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)'  },
  roleSpecific: { label: 'Role-Specific',icon: Briefcase,color: '#c084fc', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)'  },
};

function CategorySection({ type, questions }) {
  const [open, setOpen] = useState(true);
  const meta = CATEGORY_META[type];
  const Icon = meta.icon;

  return (
    <div className="iq-category" style={{ '--cat-color': meta.color, '--cat-bg': meta.bg, '--cat-border': meta.border }}>
      <button className="iq-cat-header" onClick={() => setOpen(o => !o)}>
        <span className="iq-cat-icon"><Icon size={15} /></span>
        <span className="iq-cat-label">{meta.label}</span>
        <span className="iq-cat-count">{questions.length}</span>
        <span className="iq-cat-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {open && (
        <div className="iq-cat-body">
          {questions.map((item, i) => (
            <QuestionCard key={i} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Copy all questions ────────────────────────────────────────────────
function copyAll(result) {
  const lines = [
    `Interview Questions — ${result.role}`,
    '',
    '── TECHNICAL ──',
    ...result.technical.map((q, i) => `${i + 1}. ${q.q}`),
    '',
    '── BEHAVIOURAL ──',
    ...result.behavioural.map((q, i) => `${i + 1}. ${q.q}`),
    '',
    '── ROLE-SPECIFIC ──',
    ...result.roleSpecific.map((q, i) => `${i + 1}. ${q.q}`),
  ];
  navigator.clipboard.writeText(lines.join('\n'));
}

// ── Main modal ────────────────────────────────────────────────────────
export default function InterviewPrepModal({ cvData, onClose }) {
  const [jd, setJd] = useState('');
  const [showJd, setShowJd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const raw = await callAI(buildPrompt(cvData, jd));
      const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const json = clean.match(/\{[\s\S]*\}/)?.[0];
      if (!json) throw new Error('PARSE_FAIL');
      const parsed = JSON.parse(json);
      if (!parsed.technical || !parsed.behavioural || !parsed.roleSpecific) throw new Error('PARSE_FAIL');
      setResult(parsed);
    } catch (e) {
      setError(friendlyErr(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    copyAll(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="iq-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="iq-modal" role="dialog" aria-modal="true" aria-label="Interview Question Predictor">

        {/* Header */}
        <div className="iq-header">
          <div className="iq-header-left">
            <span className="iq-header-icon"><Sparkles size={18} /></span>
            <div>
              <h2 className="iq-title">Interview Question Predictor</h2>
              <p className="iq-subtitle">AI-predicted questions based on your CV</p>
            </div>
          </div>
          <button className="iq-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* JD toggle */}
        <div className="iq-jd-row">
          <button
            className={`iq-jd-toggle ${showJd ? 'active' : ''}`}
            onClick={() => setShowJd(v => !v)}
            type="button"
          >
            {showJd ? '− Hide Job Description' : '+ Add Job Description'}
            <span className="iq-jd-badge">More accurate</span>
          </button>
        </div>

        {showJd && (
          <div className="iq-jd-area">
            <label className="iq-jd-label">
              Job Description
              <span className="iq-jd-hint"> — optional, makes predictions much more targeted</span>
            </label>
            <textarea
              className="iq-jd-textarea"
              placeholder="Paste the job description here…"
              value={jd}
              onChange={e => setJd(e.target.value)}
              rows={5}
              autoFocus={showJd}
            />
          </div>
        )}

        {/* Generate button */}
        {!result && !loading && (
          <button className="iq-generate-btn" onClick={generate}>
            <Sparkles size={15} />
            Predict Interview Questions
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="iq-loading">
            <Loader size={28} className="iq-spin" />
            <div>
              <p className="iq-loading-label">Analysing your CV…</p>
              <p className="iq-loading-sub">Generating tailored questions · 15–25 seconds</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="iq-error">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <div className="iq-result-header">
              <div className="iq-result-meta">
                <span className="iq-result-role">{result.role}</span>
                <span className="iq-result-count">{(result.technical?.length || 0) + (result.behavioural?.length || 0) + (result.roleSpecific?.length || 0)} questions</span>
              </div>
              <div className="iq-result-actions">
                <button className="iq-action-btn" onClick={handleCopyAll} title="Copy all questions">
                  {copiedAll ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  {copiedAll ? 'Copied!' : 'Copy all'}
                </button>
                <button className="iq-action-btn" onClick={generate} title="Regenerate">
                  <RefreshCw size={13} /> Regenerate
                </button>
              </div>
            </div>

            <div className="iq-results-scroll">
              <CategorySection type="technical"    questions={result.technical    || []} />
              <CategorySection type="behavioural"  questions={result.behavioural  || []} />
              <CategorySection type="roleSpecific" questions={result.roleSpecific || []} />
            </div>

            <p className="iq-disclaimer">
              AI predictions — use as preparation prompts, not guarantees of actual questions.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
