import React, { useMemo } from 'react';
import './ATSAnalyzer.css';

const actionVerbs = [
  'developed', 'led', 'engineered', 'optimized', 'increased', 'reduced',
  'architected', 'built', 'created', 'designed', 'implemented', 'managed',
  'automated', 'spearheaded', 'delivered', 'improved', 'integrated', 'resolved'
];

const ATSAnalyzer = ({ cvData }) => {

  const analysis = useMemo(() => {
    let allText = '';
    
    if (cvData.summary) allText += cvData.summary + ' ';
    cvData.experience.forEach(exp => {
      if (!exp.hidden && exp.description) allText += exp.description + ' ';
    });
    cvData.projects.forEach(proj => {
      if (!proj.hidden && proj.description) allText += proj.description + ' ';
    });

    const lowerText = allText.toLowerCase();
    
    // Count Action Verbs
    let verbCount = 0;
    actionVerbs.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) verbCount += matches.length;
    });

    // Count Metrics (numbers, percentages, dollars)
    const metricRegex = /\b\d+%|\$\d+|\b\d{1,3}(,\d{3})*(\.\d+)?\b/g;
    const metricMatches = allText.match(metricRegex);
    const metricCount = metricMatches ? metricMatches.length : 0;

    // Word Count
    const wordCount = allText.trim().split(/\s+/).filter(w => w.length > 0).length;

    // Scoring Logic (Opinionated)
    let score = 50; // base score just for having something
    
    if (wordCount < 100) score -= 20;
    else if (wordCount > 150) score += 10;

    score += Math.min(verbCount * 2, 20); // up to 20 pts for action verbs
    score += Math.min(metricCount * 3, 20); // up to 20 pts for metrics

    if (score > 100) score = 100;
    if (score < 0) score = 0;
    if (wordCount === 0) score = 0;

    return {
      score,
      verbCount,
      metricCount,
      wordCount
    };
  }, [cvData]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (analysis.score / 100) * circumference;

  return (
    <div className="ats-analyzer glass-panel">
      <div className="ats-header">
        <h3 className="ats-title">ATS Impact Score</h3>
        <span className="ats-badge" style={{backgroundColor: getScoreColor(analysis.score) + '22', color: getScoreColor(analysis.score)}}>
          {analysis.score >= 80 ? 'Excellent' : analysis.score >= 50 ? 'Needs Work' : 'Weak'}
        </span>
      </div>
      
      <div className="ats-body">
        <div className="ats-gauge-container">
          <svg className="ats-gauge" width="80" height="80">
            <circle cx="40" cy="40" r="36" className="ats-gauge-bg" />
            <circle 
              cx="40" cy="40" r="36" 
              className="ats-gauge-fill" 
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                stroke: getScoreColor(analysis.score)
              }}
            />
          </svg>
          <div className="ats-score-text">{analysis.score}</div>
        </div>

        <div className="ats-stats">
          <div className="ats-stat">
            <span className="ats-stat-label">Action Verbs</span>
            <span className={`ats-stat-val ${analysis.verbCount >= 5 ? 'good' : 'bad'}`}>
              {analysis.verbCount}
            </span>
          </div>
          <div className="ats-stat">
            <span className="ats-stat-label">Metrics (%, $)</span>
            <span className={`ats-stat-val ${analysis.metricCount >= 3 ? 'good' : 'bad'}`}>
              {analysis.metricCount}
            </span>
          </div>
          <div className="ats-stat">
            <span className="ats-stat-label">Word Count</span>
            <span className="ats-stat-val neutral">{analysis.wordCount}</span>
          </div>
        </div>
      </div>
      
      <div className="ats-tips">
        {analysis.metricCount < 3 && <div>💡 Try adding more numbers (e.g., "improved by 15%").</div>}
        {analysis.verbCount < 5 && <div>💡 Start bullet points with strong verbs like "Architected" or "Optimized".</div>}
        {analysis.score >= 80 && <div>🚀 Your resume looks impactful and ATS-ready!</div>}
      </div>
    </div>
  );
};

export default ATSAnalyzer;
