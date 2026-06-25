import React from 'react';

interface Risk {
  title: string;
  severity: string;
  description: string;
}

interface RiskPanelProps {
  risks: Risk[];
}

const RiskPanel: React.FC<RiskPanelProps> = ({ risks }) => {
  if (risks.length === 0) return null;

  const getBadgeClass = (severity: string) => {
    const s = severity?.toLowerCase() ?? '';
    if (s === 'high' || s === 'critical') return 'high';
    if (s === 'medium' || s === 'moderate') return 'medium';
    return 'low';
  };

  return (
    <div className="animate-fade-in-up delay-3">
      <div className="section-header">
        <span className="icon">⚠️</span>
        <h2>Risk Assessment</h2>
      </div>
      <div className="section-divider" />
      {risks.map((risk, i) => (
        <div className="risk-card" key={i}>
          <div className="risk-card-header">
            <span className="risk-card-title">{risk.title}</span>
            <span className={`risk-badge ${getBadgeClass(risk.severity)}`}>
              {risk.severity}
            </span>
          </div>
          <div className="risk-desc">{risk.description}</div>
        </div>
      ))}
    </div>
  );
};

export default RiskPanel;
