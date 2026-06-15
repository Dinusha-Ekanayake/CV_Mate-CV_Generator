import React from 'react';
import './MarkdownToolbar.css';

const aiSuggestions = [
  "Architected scalable microservices using Docker and Kubernetes, reducing deployment time by 40%.",
  "Engineered a high-performance REST API with Node.js, supporting 10k+ concurrent requests.",
  "Spearheaded the migration to React 18, improving frontend rendering speeds by 25%.",
  "Developed a machine learning pipeline in Python that increased prediction accuracy by 15%.",
  "Optimized database queries in PostgreSQL, cutting query latency from 500ms to 50ms.",
  "Led a team of 4 engineers to deliver a critical payment gateway integration 2 weeks ahead of schedule."
];

const MarkdownToolbar = ({ value, onChange }) => {
  const insertMarkdown = (syntax) => {
    // A simple implementation that appends the syntax
    const newText = value ? `${value} ${syntax}` : syntax;
    onChange(newText);
  };

  const handleAiEnhance = (e) => {
    e.preventDefault(); // Prevent form submission if any
    const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
    const newText = value ? `${value}\n- ${randomSuggestion}` : `- ${randomSuggestion}`;
    onChange(newText);
  };

  return (
    <div className="md-toolbar">
      <button type="button" className="md-btn" onClick={() => insertMarkdown('**bold**')} title="Bold">B</button>
      <button type="button" className="md-btn italic" onClick={() => insertMarkdown('*italic*')} title="Italic">I</button>
      <button type="button" className="md-btn" onClick={() => insertMarkdown('[text](url)')} title="Link">🔗</button>
      <div className="md-divider"></div>
      <button type="button" className="md-btn ai-enhance-btn" onClick={handleAiEnhance} title="AI Enhance (Suggest bullet point)">
        🪄 Enhance
      </button>
    </div>
  );
};

export default MarkdownToolbar;
