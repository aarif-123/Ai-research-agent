import React, { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '../hooks/useAnalysis';

interface AgentLogProps {
  logs: LogEntry[];
}

function renderToolDataSummary(toolName: string, data: any) {
  if (!data) return <pre>No data available</pre>;

  try {
    switch (toolName) {
      case 'yahooFinance':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div>Price: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{data.price} {data.currency}</span></div>
            <div>PE Ratio: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{data.pe || 'N/A'}</span></div>
            <div>Rev Growth: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{(data.revenueGrowth * 100).toFixed(1)}%</span></div>
            <div>Debt/Equity: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{data.debtToEquity || 'N/A'}</span></div>
            <div>Gross Margin: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{(data.grossMargins * 100).toFixed(1)}%</span></div>
            <div>Free Cashflow: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{data.freeCashflow}</span></div>
          </div>
        );
      case 'ratioCalculator':
        const scores = data.overallScores || {};
        return (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Category Averages:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>Valuation: <span style={{ color: 'var(--text-primary)' }}>{scores.valuation}/100</span></div>
              <div>Profitability: <span style={{ color: 'var(--text-primary)' }}>{scores.profitability}/100</span></div>
              <div>Health: <span style={{ color: 'var(--text-primary)' }}>{scores.financialHealth}/100</span></div>
              <div>Growth: <span style={{ color: 'var(--text-primary)' }}>{scores.growth}/100</span></div>
            </div>
          </div>
        );
      case 'sentimentTool':
        return (
          <div>
            <div>Sentiment: <span style={{ color: data.overallSentiment > 0.1 ? 'var(--accent-invest)' : data.overallSentiment < -0.1 ? 'var(--accent-pass)' : 'var(--accent-hold)', fontWeight: 600 }}>{data.sentimentLabel} ({data.overallSentiment})</span></div>
            <div style={{ fontStyle: 'italic', marginTop: 4, color: 'var(--text-secondary)' }}>"{data.summary}"</div>
          </div>
        );
      case 'riskScorer':
        return (
          <div>
            <div>Overall Risk Level: <span style={{ color: 'var(--accent-pass)', fontWeight: 600 }}>{data.overallRiskLevel}</span></div>
            <div style={{ marginTop: 4 }}>Risks Identified: <span style={{ color: 'var(--text-primary)' }}>{data.risks?.length || 0}</span></div>
          </div>
        );
      case 'moatAnalyser':
        return (
          <div>
            <div>Moat Rating: <span style={{ color: 'var(--accent-invest)', fontWeight: 600 }}>{data.moatRating} (Score: {data.moatScore}/100)</span></div>
            <div>Trend: <span style={{ color: 'var(--text-primary)' }}>{data.moatTrend}</span></div>
            <div style={{ fontStyle: 'italic', marginTop: 4, color: 'var(--text-secondary)' }}>"{data.summary}"</div>
          </div>
        );
      case 'competitorMap':
        const comps = data.competitors?.map((c: any) => `${c.name} (${c.ticker})`).join(', ');
        return (
          <div>
            <div>Market Position: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{data.marketPosition}</span></div>
            <div style={{ marginTop: 4, fontSize: '0.7rem' }}>Competitors: <span style={{ color: 'var(--text-primary)' }}>{comps || 'None found'}</span></div>
          </div>
        );
      case 'tavilySearch':
        return (
          <div>
            <div>Articles Found: <span style={{ color: 'var(--text-primary)' }}>{data.resultCount}</span></div>
            <div style={{ fontStyle: 'italic', marginTop: 4, color: 'var(--text-secondary)' }}>"{data.answer || 'Latest news results retrieved.'}"</div>
          </div>
        );
      case 'secEdgar':
        return (
          <div>
            <div>Resolved CIK: <span style={{ color: 'var(--text-primary)' }}>{data.cik}</span></div>
            <div>Recent filings fetched: <span style={{ color: 'var(--text-primary)' }}>{data.totalFilings || 0}</span></div>
          </div>
        );
      default:
        return (
          <pre style={{ margin: 0, fontSize: '0.65rem' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        );
    }
  } catch (err) {
    return <pre>Error parsing log data</pre>;
  }
}

const AgentLog: React.FC<AgentLogProps> = ({ logs }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="agent-log">
      <div className="agent-log-header">
        <span className="dot dot-red" />
        <span className="dot dot-yellow" />
        <span className="dot dot-green" />
        <span className="title">Agent Log (Click completed nodes to inspect)</span>
      </div>
      <div className="agent-log-body" ref={bodyRef}>
        {logs.length === 0 ? (
          <div className="log-empty">Waiting for analysis...</div>
        ) : (
          logs.map((log, i) => {
            const hasData = !!log.data;
            const isExpanded = !!expandedIndices[i];

            return (
              <div key={i} style={{ marginBottom: 4 }}>
                <div
                  className={`log-line ${hasData ? 'log-line-header' : ''}`}
                  onClick={hasData ? () => toggleExpand(i) : undefined}
                >
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-node">{log.node}</span>
                  <span className="log-arrow">→</span>
                  <span className={`log-msg${log.isError ? ' error' : ''}`}>
                    {log.message}
                  </span>
                  {hasData && (
                    <span className="log-toggle-icon">
                      {isExpanded ? '▼ collapse' : '▶ inspect'}
                    </span>
                  )}
                </div>
                {hasData && isExpanded && (
                  <div className="log-details-box">
                    {renderToolDataSummary(log.node, log.data)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AgentLog;
