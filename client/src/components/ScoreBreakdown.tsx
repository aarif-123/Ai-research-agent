import React from 'react';
import { getScoreColor } from '../utils/colors';

interface ScoreBreakdownProps {
  scores: Record<string, number | { value: number; reason: string }>;
}

const SCORE_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentals',
  growth: 'Growth',
  valuation: 'Valuation',
  sentiment: 'Sentiment',
  moat: 'Moat',
  risk: 'Risk',
  management: 'Management',
};

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scores }) => {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;

  return (
    <div className="score-breakdown glass-card animate-fade-in-up delay-2">
      <div className="section-header">
        <span className="icon">📊</span>
        <h2>Factor Analysis & Methodology</h2>
      </div>
      <div className="section-divider" />
      {entries.map(([key, rawVal], i) => {
        const label = SCORE_LABELS[key.toLowerCase()] || key;
        const score = typeof rawVal === 'object' ? rawVal.value : rawVal;
        const reason = typeof rawVal === 'object' ? rawVal.reason : null;
        
        const scoreNormalized = Math.min(100, Math.max(0, score));
        const color = getScoreColor(scoreNormalized);

        return (
          <div
            className="score-row-container"
            key={key}
            style={{ animation: `fadeInUp 0.3s ease-out both`, animationDelay: `${i * 0.08}s` }}
          >
            <div className="score-bar-row" style={{ marginBottom: 0 }}>
              <span className="score-bar-label">{label}</span>
              <div className="score-bar-track">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${scoreNormalized}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                    transitionDelay: `${i * 0.1}s`,
                  }}
                />
              </div>
              <span className="score-bar-value" style={{ color }}>
                {scoreNormalized}
              </span>
            </div>
            {reason && (
              <div className="score-reason-text">
                {reason}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ScoreBreakdown;
