import React from 'react';
import type { AnalysisPhase } from '../hooks/useAnalysis';

interface VerdictOrbProps {
  phase: AnalysisPhase;
  decision: 'INVEST' | 'PASS' | 'HOLD' | null;
  score: number | null;
  ticker: string;
  company: string;
  positionSizing?: string;
}

const VerdictOrb: React.FC<VerdictOrbProps> = ({
  phase,
  decision,
  score,
  ticker,
  company,
  positionSizing,
}) => {
  const orbState =
    phase === 'streaming'
      ? 'streaming'
      : decision
        ? decision.toLowerCase()
        : 'idle';

  return (
    <div className="verdict-section animate-fade-in-up">
      <div className="verdict-orb-container">
        {/* Outer pulsing ring */}
        <div className={`verdict-orb-ring ${orbState}`} />

        {/* Main orb */}
        <div className={`verdict-orb ${orbState}`}>
          {phase === 'streaming' ? (
            <>
              <span className="verdict-streaming-text">Analyzing</span>
              <span className="verdict-score-label" style={{ marginTop: 4 }}>
                {company || '...'}
              </span>
            </>
          ) : score !== null ? (
            <>
              <span className="verdict-score">{score}</span>
              <span className="verdict-score-label">/ 100</span>
            </>
          ) : (
            <>
              <span
                className="verdict-score"
                style={{ fontSize: '2rem', opacity: 0.3 }}
              >
                ?
              </span>
              <span className="verdict-score-label">Awaiting</span>
            </>
          )}
        </div>
      </div>

      {/* Decision label */}
      {decision && (
        <div className={`verdict-decision ${decision.toLowerCase()}`}>
          {decision}
        </div>
      )}

      {/* Ticker */}
      {ticker && <div className="verdict-ticker">{ticker}{company ? ` · ${company}` : ''}</div>}

      {/* Position Sizing */}
      {positionSizing && (
        <div className="position-sizing">{positionSizing}</div>
      )}
    </div>
  );
};

export default VerdictOrb;
