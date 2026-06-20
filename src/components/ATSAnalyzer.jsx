import { useMemo, useState } from 'react';
import './ATSAnalyzer.css';

const actionVerbs = [
  'developed', 'led', 'engineered', 'optimized', 'increased', 'reduced',
  'architected', 'built', 'created', 'designed', 'implemented', 'managed',
  'automated', 'spearheaded', 'delivered', 'improved', 'integrated', 'resolved',
  'launched', 'coordinated', 'collaborated', 'analyzed', 'mentored', 'deployed',
  'established', 'accelerated', 'streamlined', 'drove', 'generated', 'achieved',
];

const commonKeywords = [
  'agile', 'scrum', 'rest', 'api', 'cloud', 'aws', 'azure', 'gcp', 'docker',
  'kubernetes', 'ci/cd', 'git', 'react', 'node', 'python', 'java', 'typescript',
  'sql', 'nosql', 'machine learning', 'ai', 'data science', 'microservices',
  'testing', 'typescript', 'postgresql', 'mongodb', 'redis', 'linux',
];

const ATSAnalyzer = ({ cvData }) => {
  const [showKeywords, setShowKeywords] = useState(false);

  const analysis = useMemo(() => {
    let summaryText = cvData.summary || '';
    let expText = '';
    let projText = '';

    (cvData.experience || []).forEach(exp => {
      if (!exp.hidden && exp.description) expText += exp.description + ' ';
    });
    (cvData.projects || []).forEach(proj => {
      if (!proj.hidden && proj.description) projText += proj.description + ' ';
    });

    const allText = summaryText + ' ' + expText + ' ' + projText;
    const lowerText = allText.toLowerCase();

    // Action verbs
    let verbCount = 0;
    actionVerbs.forEach(verb => {
      const matches = lowerText.match(new RegExp(`\\b${verb}\\b`, 'g'));
      if (matches) verbCount += matches.length;
    });

    // Metrics
    const metricRegex = /\b\d+%|\$\d+|\b\d{1,3}(,\d{3})*(\.\d+)?\b/g;
    const metricCount = (allText.match(metricRegex) || []).length;

    // Word counts
    const wordCount = (text) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const summaryWords = wordCount(summaryText);
    const expWords = wordCount(expText);
    const projWords = wordCount(projText);
    const totalWords = wordCount(allText);

    // Section completeness
    const hasEmail = !!(cvData.personal?.email);
    const hasPhone = !!(cvData.personal?.phone);
    const hasLinkedIn = !!(cvData.personal?.linkedin);
    const hasSkills = Array.isArray(cvData.skills) && cvData.skills.some(s => !s.hidden && s.items);
    const hasEducation = (cvData.education || []).some(e => !e.hidden);
    const hasExperience = (cvData.experience || []).some(e => !e.hidden);
    const contactScore = [hasEmail, hasPhone, hasLinkedIn].filter(Boolean).length;

    // Missing common keywords
    const foundKeywords = commonKeywords.filter(kw => lowerText.includes(kw));
    const missingKeywords = commonKeywords.filter(kw => !lowerText.includes(kw));

    // Scoring
    let score = 40; // base
    if (totalWords >= 100) score += 10;
    if (totalWords >= 200) score += 5;
    score += Math.min(verbCount * 2, 20); // up to 20 for verbs
    score += Math.min(metricCount * 4, 20); // up to 20 for metrics
    score += contactScore * 3; // up to 9 for contact info
    if (hasSkills) score += 5;
    if (hasEducation) score += 3;
    if (hasExperience) score += 5;
    if (score > 100) score = 100;
    if (score < 0) score = 0;
    if (totalWords === 0) score = 0;

    // Per-section scores (0-100)
    const sectionScore = (text, verbs, metrics, targetWords) => {
      let s = 0;
      const w = wordCount(text);
      if (w >= targetWords * 0.5) s += 30;
      if (w >= targetWords) s += 20;
      s += Math.min(verbs * 5, 30);
      s += Math.min(metrics * 10, 20);
      return Math.min(s, 100);
    };

    const expVerbCount = actionVerbs.reduce((n, v) => n + (expText.toLowerCase().match(new RegExp(`\\b${v}\\b`, 'g')) || []).length, 0);
    const projVerbCount = actionVerbs.reduce((n, v) => n + (projText.toLowerCase().match(new RegExp(`\\b${v}\\b`, 'g')) || []).length, 0);
    const expMetrics = (expText.match(metricRegex) || []).length;
    const projMetrics = (projText.match(metricRegex) || []).length;

    return {
      score, verbCount, metricCount, totalWords, summaryWords, expWords, projWords,
      hasEmail, hasPhone, hasLinkedIn, hasSkills, hasEducation, hasExperience,
      contactScore, foundKeywords, missingKeywords,
      sectionScores: {
        summary: summaryWords > 20 ? Math.min(50 + Math.round(summaryWords / 3), 100) : Math.round(summaryWords * 2),
        experience: sectionScore(expText, expVerbCount, expMetrics, 150),
        projects: sectionScore(projText, projVerbCount, projMetrics, 100),
      }
    };
  }, [cvData]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (analysis.score / 100) * circumference;

  const SectionBar = ({ label, score }) => (
    <div className="ats-section-bar">
      <div className="ats-section-bar-header">
        <span>{label}</span>
        <span style={{ color: getScoreColor(score) }}>{score}%</span>
      </div>
      <div className="ats-mini-track">
        <div className="ats-mini-fill" style={{ width: `${score}%`, background: getScoreColor(score) }} />
      </div>
    </div>
  );

  const ContactCheck = ({ ok, label }) => (
    <span className={`ats-contact-check ${ok ? 'ok' : 'missing'}`}>
      {ok ? '✓' : '✗'} {label}
    </span>
  );

  return (
    <div className="ats-analyzer glass-panel">
      <div className="ats-header">
        <h3 className="ats-title">ATS Impact Score</h3>
        <span className="ats-badge" style={{ backgroundColor: getScoreColor(analysis.score) + '22', color: getScoreColor(analysis.score) }}>
          {analysis.score >= 80 ? 'Excellent' : analysis.score >= 50 ? 'Needs Work' : 'Weak'}
        </span>
      </div>

      <div className="ats-body">
        <div className="ats-gauge-container">
          <svg className="ats-gauge" width="80" height="80">
            <circle cx="40" cy="40" r="36" className="ats-gauge-bg" />
            <circle cx="40" cy="40" r="36" className="ats-gauge-fill"
              style={{ strokeDasharray: circumference, strokeDashoffset, stroke: getScoreColor(analysis.score) }} />
          </svg>
          <div className="ats-score-text">{analysis.score}</div>
        </div>

        <div className="ats-stats">
          <div className="ats-stat">
            <span className="ats-stat-label">Action Verbs</span>
            <span className={`ats-stat-val ${analysis.verbCount >= 5 ? 'good' : 'bad'}`}>{analysis.verbCount}</span>
          </div>
          <div className="ats-stat">
            <span className="ats-stat-label">Metrics (%, $)</span>
            <span className={`ats-stat-val ${analysis.metricCount >= 3 ? 'good' : 'bad'}`}>{analysis.metricCount}</span>
          </div>
          <div className="ats-stat">
            <span className="ats-stat-label">Word Count</span>
            <span className="ats-stat-val neutral">{analysis.totalWords}</span>
          </div>
        </div>
      </div>

      {/* Section Breakdown */}
      <div className="ats-section-breakdown">
        <div className="ats-breakdown-label">Section Breakdown</div>
        <SectionBar label="Summary" score={analysis.sectionScores.summary} />
        <SectionBar label="Experience" score={analysis.sectionScores.experience} />
        <SectionBar label="Projects" score={analysis.sectionScores.projects} />
      </div>

      {/* Contact Completeness */}
      <div className="ats-contact-row">
        <ContactCheck ok={analysis.hasEmail} label="Email" />
        <ContactCheck ok={analysis.hasPhone} label="Phone" />
        <ContactCheck ok={analysis.hasLinkedIn} label="LinkedIn" />
        <ContactCheck ok={analysis.hasSkills} label="Skills" />
        <ContactCheck ok={analysis.hasExperience} label="Experience" />
      </div>

      {/* Keywords Panel */}
      <button className="ats-keywords-toggle" onClick={() => setShowKeywords(v => !v)}>
        {showKeywords ? '▲' : '▼'} Keywords ({analysis.foundKeywords.length}/{commonKeywords.length} found)
      </button>
      {showKeywords && (
        <div className="ats-keywords-panel">
          <div className="ats-keywords-group">
            <span className="ats-kw-label found">✓ Found</span>
            <div className="ats-kw-chips">
              {analysis.foundKeywords.map(kw => (
                <span key={kw} className="ats-chip found">{kw}</span>
              ))}
            </div>
          </div>
          <div className="ats-keywords-group">
            <span className="ats-kw-label missing">✗ Missing</span>
            <div className="ats-kw-chips">
              {analysis.missingKeywords.slice(0, 12).map(kw => (
                <span key={kw} className="ats-chip missing">{kw}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="ats-tips">
        {analysis.metricCount < 3 && <div>💡 Add more numbers (e.g., "improved by 15%", "managed team of 5").</div>}
        {analysis.verbCount < 5 && <div>💡 Start bullets with strong verbs like "Architected" or "Optimized".</div>}
        {!analysis.hasLinkedIn && <div>💡 Add your LinkedIn URL to improve profile completeness.</div>}
        {!analysis.hasExperience && <div>💡 Add work experience entries to strengthen your CV.</div>}
        {analysis.score >= 80 && <div>🚀 Your resume looks impactful and ATS-ready!</div>}
      </div>
    </div>
  );
};

export default ATSAnalyzer;
