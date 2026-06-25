import React from 'react';

interface RationaleProps {
  rationale: string;
  decision?: string;
}

const Rationale: React.FC<RationaleProps> = ({ rationale, decision }) => {
  if (!rationale) return null;

  return (
    <div className="rationale-card glass-card animate-fade-in-up delay-3">
      <div className="section-header">
        <span className="icon">💡</span>
        <h2>Investment Rationale</h2>
        {decision && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 10px',
              borderRadius: '9999px',
              background:
                decision === 'INVEST'
                  ? 'hsla(145, 65%, 48%, 0.12)'
                  : decision === 'PASS'
                    ? 'hsla(0, 72%, 55%, 0.12)'
                    : 'hsla(40, 90%, 55%, 0.12)',
              color:
                decision === 'INVEST'
                  ? 'hsl(145, 65%, 48%)'
                  : decision === 'PASS'
                    ? 'hsl(0, 72%, 55%)'
                    : 'hsl(40, 90%, 55%)',
            }}
          >
            {decision}
          </span>
        )}
      </div>
      <div className="section-divider" />
      <p className="rationale-text">{rationale}</p>
    </div>
  );
};

export default Rationale;
