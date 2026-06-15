import React, { useState } from 'react';
import './MarkdownToolbar.css';

const MarkdownToolbar = ({ value, onChange }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const insertMarkdown = (syntax) => {
    const newText = value ? `${value} ${syntax}` : syntax;
    onChange(newText);
  };

  const handleAiEnhance = async (e) => {
    e.preventDefault();
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      alert("OpenAI API key is missing. Please check your .env file.");
      return;
    }

    setIsEnhancing(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert CV and resume writer for software engineers. The user will provide a rough draft of a job responsibility or project description. Rewrite it into a single, highly professional, ATS-optimized bullet point using strong action verbs and quantifying metrics. Do not include introductory text. If the user provides empty text, generate an impressive, generic placeholder bullet point for a software engineer. Return ONLY the bullet point text."
            },
            {
              role: "user",
              content: value || "Generate an impressive software engineering bullet point."
            }
          ],
          temperature: 0.7,
          max_tokens: 60
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      let suggestion = data.choices[0].message.content.trim();
      
      // Remove leading dash if AI included it, since we'll append it
      if (suggestion.startsWith('- ')) {
        suggestion = suggestion.substring(2);
      }

      // If there's already text, append the new bullet point on a new line
      const newText = value 
        ? `${value}\n- ${suggestion}` 
        : `- ${suggestion}`;
        
      onChange(newText);
    } catch (error) {
      console.error("Failed to enhance text with AI:", error);
      alert(`OpenAI API Error: ${error.message}\n\nPlease check your API key quota and billing plan.`);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="md-toolbar">
      <button type="button" className="md-btn" onClick={() => insertMarkdown('**bold**')} title="Bold">B</button>
      <button type="button" className="md-btn italic" onClick={() => insertMarkdown('*italic*')} title="Italic">I</button>
      <button type="button" className="md-btn" onClick={() => insertMarkdown('[text](url)')} title="Link">🔗</button>
      <div className="md-divider"></div>
      <button 
        type="button" 
        className={`md-btn ai-enhance-btn ${isEnhancing ? 'enhancing' : ''}`} 
        onClick={handleAiEnhance} 
        disabled={isEnhancing}
        title="AI Enhance (Rewrite with GPT)"
      >
        {isEnhancing ? '⏳ Enhancing...' : '🪄 Enhance'}
      </button>
    </div>
  );
};

export default MarkdownToolbar;
