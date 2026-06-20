import { useState, useRef, useCallback } from 'react';
import { Sparkles, X, Loader, AlertCircle, Search } from 'lucide-react';
import './AIPanel.css';

// Safely get the API key from env
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || '';

const callGemini = async (prompt) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_KEY');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ── Summary Generator ──────────────────────────────────────────────
export const AISummaryButton = ({ cvData, onResult }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const { personal, experience, skills } = cvData;
      const expSummary = (experience || []).slice(0, 3).map(e => `${e.role} at ${e.company}`).join(', ');
      const skillList = (Array.isArray(skills) ? skills : []).map(s => s.items).filter(Boolean).join(', ');
      const prompt = `Write a concise, impactful professional summary (3-4 sentences, 60-80 words) for a CV.
Name: ${personal.name || 'Professional'}
Title: ${personal.title || 'Software Engineer'}
Experience: ${expSummary || 'Software development'}
Skills: ${skillList || 'Programming, problem-solving'}
Requirements:
- Start with an engaging opening about the person's field and passion
- Mention 2-3 key strengths or specializations
- End with what they bring to an employer
- Do NOT use bullet points, just flowing prose
- Do NOT include any markdown formatting, just plain text`;
      const text = await callGemini(prompt);
      onResult(text.trim());
    } catch (e) {
      setError(e.message === 'NO_KEY' ? 'Set VITE_GEMINI_API_KEY in your .env file to use AI features.' : 'AI request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="btn-ai" onClick={generate} disabled={loading} title="Generate professional summary with Gemini AI">
        {loading ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
        {loading ? 'Generating…' : 'Generate with AI'}
      </button>
      {error && <span className="ai-error"><AlertCircle size={12} /> {error}</span>}
    </div>
  );
};

// ── Bullet Enhancer ────────────────────────────────────────────────
export const AIBulletButton = ({ text, onResult }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const enhance = async () => {
    if (!text?.trim()) { setError('Add some description first.'); return; }
    setLoading(true);
    setError('');
    try {
      const prompt = `Rewrite the following work experience/project description as strong, action-verb-led bullet points optimized for ATS and recruiters.
Rules:
- Start each bullet with a strong action verb (e.g., Engineered, Optimized, Led, Spearheaded)
- Include specific metrics where plausible (%, numbers, scale)
- Keep each bullet to 1-2 lines
- Output as HTML: <ul><li>...</li></ul>
- Do NOT include any explanation, just the HTML

Original text:
${text.replace(/<[^>]+>/g, ' ')}`;
      const result = await callGemini(prompt);
      // Extract just the HTML
      const match = result.match(/<ul[\s\S]*<\/ul>/i);
      onResult(match ? match[0] : result.trim());
    } catch (e) {
      setError(e.message === 'NO_KEY' ? 'Set VITE_GEMINI_API_KEY in .env.' : 'AI request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button className="btn-ai btn-ai-sm" onClick={enhance} disabled={loading} title="Enhance bullets with AI">
        {loading ? <Loader size={12} className="spin" /> : <Sparkles size={12} />}
        {loading ? '…' : 'Enhance'}
      </button>
      {error && <span className="ai-error" style={{ fontSize: '0.68rem' }}>{error}</span>}
    </div>
  );
};

// ── Job Description Matcher Modal ──────────────────────────────────
export const JDMatcherModal = ({ cvData, onClose }) => {
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const cvText = [
        cvData.summary,
        ...(cvData.experience || []).map(e => `${e.role} ${e.description}`),
        ...(cvData.projects || []).map(p => `${p.name} ${p.tech} ${p.description}`),
        ...(Array.isArray(cvData.skills) ? cvData.skills.map(s => s.items) : [])
      ].join(' ').replace(/<[^>]+>/g, ' ').toLowerCase();

      const prompt = `You are an ATS expert. Analyze the match between a CV and a job description.

Job Description:
${jd.slice(0, 3000)}

CV Text (summarized):
${cvText.slice(0, 2000)}

Respond in this exact JSON format:
{
  "matchScore": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword3", "keyword4"],
  "topTips": ["tip1", "tip2", "tip3"]
}`;
      const text = await callGemini(prompt);
      const json = text.match(/\{[\s\S]*\}/)?.[0];
      if (!json) throw new Error('Invalid response');
      setResult(JSON.parse(json));
    } catch (e) {
      setError(e.message === 'NO_KEY' ? 'Set VITE_GEMINI_API_KEY in .env.' : 'Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ai-modal">
        <div className="ai-modal-header">
          <h2><Search size={18} /> Job Description Matcher</h2>
          <button className="ai-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="ai-modal-hint">Paste a job description to see how well your CV matches it and which keywords are missing.</p>
        <textarea
          className="ai-jd-textarea"
          placeholder="Paste the job description here…"
          value={jd}
          onChange={e => setJd(e.target.value)}
          rows={8}
        />
        <button className="btn-ai w-100" style={{ justifyContent: 'center', marginBottom: '12px' }}
          onClick={analyze} disabled={loading || !jd.trim()}>
          {loading ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
          {loading ? 'Analyzing…' : 'Analyze Match'}
        </button>
        {error && <div className="ai-error" style={{ marginBottom: '12px' }}><AlertCircle size={13} /> {error}</div>}
        {result && (
          <div className="ai-match-result">
            <div className="ai-match-score-row">
              <span className="ai-match-label">Match Score</span>
              <span className="ai-match-score" style={{ color: result.matchScore >= 70 ? '#10b981' : result.matchScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                {result.matchScore}%
              </span>
            </div>
            <div className="ai-kw-section">
              <div className="ai-kw-head">✓ Matched Keywords</div>
              <div className="ai-kw-chips">
                {result.matchedKeywords?.map(kw => <span key={kw} className="ats-chip found">{kw}</span>)}
              </div>
            </div>
            <div className="ai-kw-section">
              <div className="ai-kw-head">✗ Missing Keywords</div>
              <div className="ai-kw-chips">
                {result.missingKeywords?.map(kw => <span key={kw} className="ats-chip missing">{kw}</span>)}
              </div>
            </div>
            <div className="ai-tips-section">
              <div className="ai-kw-head">💡 Tips</div>
              <ul>
                {result.topTips?.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
