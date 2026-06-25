import React from 'react';

interface KeyMetricsProps {
  metrics: Record<string, string | number>;
}

const KeyMetrics: React.FC<KeyMetricsProps> = ({ metrics }) => {
  const entries = Object.entries(metrics);
  if (entries.length === 0) return null;

  const formatLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

  return (
    <div className="animate-fade-in-up delay-2" style={{ width: '100%', maxWidth: 640 }}>
      <div className="section-header">
        <span className="icon">📈</span>
        <h2>Key Metrics</h2>
      </div>
      <div className="section-divider" />
      <div className="metrics-grid">
        {entries.map(([key, value]) => (
          <div className="metric-card" key={key}>
            <div className="metric-value">{value}</div>
            <div className="metric-label">{formatLabel(key)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyMetrics;
