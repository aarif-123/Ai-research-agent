import React, { useState, useEffect, useRef } from 'react';
import { useAnalysis, type AnalysisState } from './hooks/useAnalysis';
import type { LogEntry } from './hooks/useAnalysis';
import LandingPage from './pages/LandingPage';

const HISTORY_KEY = 'investment_agent_history';

interface HistoryItem {
  timestamp: number;
  dateStr: string;
  state: AnalysisState;
}

/* ── helpers ── */
function getScoreColor(score: number): string {
  if (score < 40) return 'var(--crimson)';
  if (score < 65) return 'var(--amber)';
  return 'var(--emerald)';
}

function getScoreGradient(score: number): string {
  if (score < 40) return 'linear-gradient(90deg, var(--crimson), #cc2040)';
  if (score < 65) return 'linear-gradient(90deg, var(--amber), #cc8800)';
  return 'linear-gradient(90deg, var(--emerald), #00bb62)';
}

function getTonePillClass(tone?: string): string {
  const t = tone?.toLowerCase() ?? '';
  if (t === 'positive' || t === 'bullish') return 'positive';
  if (t === 'negative' || t === 'bearish') return 'negative';
  return 'neutral';
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

/* ═══════════════════════════════════════════
   PIPELINE STEPS (streaming progress)
═══════════════════════════════════════════ */
interface PipelineProps {
  hasTicker: boolean;
  hasScores: boolean;
  hasVerdict: boolean;
}

function PipelineSteps({ hasTicker, hasScores, hasVerdict }: PipelineProps) {
  const steps = [
    { label: 'Planner', icon: '🗺️', done: hasTicker, active: !hasTicker },
    { label: 'Research', icon: '⚡', done: hasScores, active: hasTicker && !hasScores },
    { label: 'Synthesis', icon: '📊', done: hasVerdict, active: hasScores && !hasVerdict },
    { label: 'Verdict', icon: '⚖️', done: hasVerdict, active: false },
  ];

  return (
    <div className="pipeline-card anim-fade-in-up">
      <div className="pipeline-label">Agent Pipeline — Running</div>
      <div className="pipeline-steps">
        {steps.map((step) => {
          const status = step.done ? 'done' : step.active ? 'active' : 'pending';
          return (
            <div className="pipeline-step" key={step.label}>
              <div className={`step-circle ${status}`}>
                {step.done ? '✓' : step.icon}
              </div>
              <div className={`step-name ${status}`}>{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   AGENT LOG (right sidebar)
═══════════════════════════════════════════ */


function renderLogDetails(toolName: string, data: any) {
  if (!data) return <pre>No data</pre>;
  try {
    switch (toolName) {
      case 'yahooFinance':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <span>Price: <b style={{ color: 'var(--cyan)' }}>{data.price} {data.currency}</b></span>
            <span>PE: <b style={{ color: 'var(--cyan)' }}>{data.pe || 'N/A'}</b></span>
            <span>Rev Growth: <b style={{ color: 'var(--emerald)' }}>{data.revenueGrowth ? (data.revenueGrowth * 100).toFixed(1) + '%' : 'N/A'}</b></span>
            <span>Debt/Eq: <b style={{ color: 'var(--text-1)' }}>{data.debtToEquity || 'N/A'}</b></span>
            <span>Margin: <b style={{ color: 'var(--emerald)' }}>{data.grossMargins ? (data.grossMargins * 100).toFixed(1) + '%' : 'N/A'}</b></span>
          </div>
        );
      case 'ratioCalculator':
        const s = data.overallScores || {};
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <span>Valuation: <b style={{ color: 'var(--cyan)' }}>{s.valuation}/100</b></span>
            <span>Profitability: <b style={{ color: 'var(--cyan)' }}>{s.profitability}/100</b></span>
            <span>Health: <b style={{ color: 'var(--cyan)' }}>{s.financialHealth}/100</b></span>
            <span>Growth: <b style={{ color: 'var(--cyan)' }}>{s.growth}/100</b></span>
          </div>
        );
      case 'sentimentTool':
        return (
          <div>
            <span>Sentiment: <b style={{ color: data.overallSentiment > 0 ? 'var(--emerald)' : 'var(--crimson)' }}>{data.sentimentLabel}</b></span>
            <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-3)' }}>"{data.summary}"</div>
          </div>
        );
      case 'riskScorer':
        return <div>Risk Level: <b style={{ color: 'var(--crimson)' }}>{data.overallRiskLevel}</b> · {data.risks?.length || 0} risks identified</div>;
      case 'moatAnalyser':
        return (
          <div>
            <div>Moat: <b style={{ color: 'var(--emerald)' }}>{data.moatRating}</b> ({data.moatScore}/100)</div>
            <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-3)' }}>"{data.summary}"</div>
          </div>
        );
      case 'competitorMap':
        return (
          <div>
            <div>Position: <b style={{ color: 'var(--text-1)' }}>{data.marketPosition}</b></div>
            <div style={{ marginTop: 4, fontSize: '0.62rem', color: 'var(--text-3)' }}>
              {data.competitors?.map((c: any) => `${c.name} (${c.ticker})`).join(', ')}
            </div>
          </div>
        );
      case 'tavilySearch':
        return <div>Articles: <b style={{ color: 'var(--cyan)' }}>{data.resultCount}</b> · {data.answer || 'News retrieved.'}</div>;
      case 'secEdgar':
        return <div>CIK: <b style={{ color: 'var(--cyan)' }}>{data.cik}</b> · {data.totalFilings || 0} filings</div>;
      default:
        return <pre>{JSON.stringify(data, null, 2)}</pre>;
    }
  } catch {
    return <pre>Error parsing data</pre>;
  }
}

function AgentLogPanel({ logs }: { logs: LogEntry[] }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const filteredLogs = logs.filter(log => {
    const msg = log.message;
    // Skip SYSTEM startup message
    if (log.node === 'SYSTEM' && msg.includes('Starting analysis')) return false;
    // Skip PLANNER step count and list of questions
    if (log.node === 'PLANNER' && (msg.includes('steps planned') || msg.startsWith('Step '))) return false;
    return true;
  });

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [filteredLogs]);

  return (
    <div className="agent-log">
      <div className="agent-log-topbar">
        <div className="log-traffic-lights">
          <div className="tl-dot tl-red" />
          <div className="tl-dot tl-yellow" />
          <div className="tl-dot tl-green" />
        </div>
        <div className="log-title">Agent Log</div>
        <div className="log-count">{filteredLogs.length} events</div>
      </div>
      <div className="agent-log-body" ref={bodyRef}>
        {filteredLogs.length === 0 ? (
          <div className="log-empty">Awaiting analysis…</div>
        ) : (
          filteredLogs.map((log, i) => {
            const hasData = !!log.data;
            const isExpanded = !!expanded[i];
            return (
              <div key={i} className={`log-entry ${hasData ? 'has-data' : ''}`}>
                <div
                  className="log-entry-line"
                  onClick={hasData ? () => setExpanded(p => ({ ...p, [i]: !p[i] })) : undefined}
                >
                  <span className="log-ts">[{log.time}]</span>
                  <span className="log-node-tag">{log.node}</span>
                  <span className="log-arrow-sym">→</span>
                  <span className={`log-msg${log.isError ? ' error' : ''}`}>{log.message}</span>
                  {hasData && (
                    <button className="log-inspect-btn">{isExpanded ? '▼' : '▶'}</button>
                  )}
                </div>
                {hasData && isExpanded && (
                  <div className="log-details-panel">
                    {renderLogDetails(log.node, log.data)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LOGS & STATE MODAL POPUP
   ═══════════════════════════════════════════ */
interface LogsStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'logs' | 'risks' | 'news';
  setActiveTab: (tab: 'logs' | 'risks' | 'news') => void;
  state: AnalysisState;
  newsOpen: boolean;
  setNewsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function LogsStateModal({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  state,
  newsOpen,
  setNewsOpen
}: LogsStateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span>🤖</span> {state.company ? `${state.company} (${state.ticker})` : 'Verity Agent'} Research Terminal
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Close Modal">×</button>
        </div>

        {/* Modal Tabs */}
        <div className="modal-tabs">
          <button
            onClick={() => setActiveTab('logs')}
            className={`modal-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          >
            📋 Logs <span className="tab-badge">{state.logs.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`modal-tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
          >
            🚨 Risk Flags{' '}
            <span className={`tab-badge ${state.risks.length > 0 ? 'risk-alert' : ''}`}>
              {state.risks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`modal-tab-btn ${activeTab === 'news' ? 'active' : ''}`}
          >
            📰 News & Sentiment{' '}
            <span className="tab-badge">{state.news.length}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Tab 1: Logs */}
          {activeTab === 'logs' && (
            <AgentLogPanel logs={state.logs} />
          )}

          {/* Tab 2: Risk Flags */}
          {activeTab === 'risks' && (
            <div className="risk-panel-modal">
              {state.risks.length === 0 ? (
                <div className="log-empty">No critical risk flags detected.</div>
              ) : (
                <div className="risk-list">
                  {state.risks.map((r, i) => (
                    <div className="risk-item" key={i}>
                      <span className={`risk-severity ${r.severity?.toLowerCase() ?? 'medium'}`}>
                        {r.severity ?? 'MED'}
                      </span>
                      <div className="risk-text">
                        <div className="risk-title">{r.title}</div>
                        <div className="risk-desc">{r.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: News & Sentiment */}
          {activeTab === 'news' && (
            <div className="news-panel-modal">
              {state.news.length === 0 ? (
                <div className="log-empty">Awaiting news retrieval…</div>
              ) : (
                <>
                  {state.newsSynthesis && (
                    <div className="news-synthesis-card">
                      <div className="news-synthesis-summary" style={{ fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.6' }}>
                        {state.newsSynthesis.summary}
                      </div>
                      <div className="news-signals">
                        {state.newsSynthesis.positive.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div className="news-signal-header bull" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>▲ Bullish Drivers</div>
                            <ul className="news-signal-list bull" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                              {state.newsSynthesis.positive.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {state.newsSynthesis.negative.length > 0 && (
                          <div>
                            <div className="news-signal-header bear" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>▼ Bearish Concerns</div>
                            <ul className="news-signal-list bear" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                              {state.newsSynthesis.negative.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    className="news-collapse-toggle"
                    onClick={() => setNewsOpen(o => !o)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-2)',
                      border: '1px solid var(--border-1)',
                      color: 'var(--text-1)',
                      padding: '10px 14px',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginTop: 16
                    }}
                  >
                    <span>Source Articles ({state.news.length})</span>
                    <span>{newsOpen ? '▼' : '▶'}</span>
                  </button>

                  {newsOpen && (
                    <div className="news-headlines-list" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {state.news.map((n, i) => (
                        <div className="news-headline-item" key={i} style={{ padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-2)' }}>
                          <div className="news-headline-text" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {n.url ? (
                              <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>{n.headline}</a>
                            ) : n.headline}
                          </div>
                          <div className="news-headline-meta" style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 4 }}>
                            {n.source && <span className="news-source-tag">{n.source}</span>}
                            {n.date && <span className="news-source-tag">· {n.date}</span>}
                            {n.tone && (
                              <span className={`news-tone-pill ${getTonePillClass(n.tone)}`} style={{ marginLeft: 'auto' }}>{n.tone}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
const AnalysisApp: React.FC = () => {
  const { state, analyze, reset, load } = useAnalysis();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [newsOpen, setNewsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'logs' | 'risks' | 'news'>('logs');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('VITE_API_BASE_URL') || '';
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const url = apiUrl.trim();
    if (url) {
      localStorage.setItem('VITE_API_BASE_URL', url);
    } else {
      localStorage.removeItem('VITE_API_BASE_URL');
    }
    setIsSettingsOpen(false);
  };

  // Auto-open modal on stream start
  useEffect(() => {
    if (state.phase === 'streaming') {
      setIsModalOpen(true);
      setModalTab('logs');
    }
  }, [state.phase]);

  // Load history
  useEffect(() => {
    try {
      const s = localStorage.getItem(HISTORY_KEY);
      if (s) setHistory(JSON.parse(s));
    } catch {}
  }, []);

  // Save on completion
  useEffect(() => {
    if (state.phase === 'done' && state.verdict && state.ticker) {
      setHistory(prev => {
        const filtered = prev.filter(x => x.state.ticker !== state.ticker);
        const item: HistoryItem = {
          timestamp: Date.now(),
          dateStr: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
          state,
        };
        const updated = [item, ...filtered].slice(0, 20);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [state.phase, state.verdict, state.ticker, state]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const t = query.trim();
    if (t && state.phase !== 'streaming') analyze(t);
  };

  const handleReset = () => {
    reset();
    setQuery('');
  };

  const handleExportJSON = () => {
    if (!state.verdict) return;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${state.ticker || 'analysis'}_report.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMD = () => {
    if (!state.verdict) return;
    const scoresMd = Object.entries(state.scores).map(([k, v]) => {
      const score = typeof v === 'object' ? v.value : v;
      const reason = typeof v === 'object' ? v.reason : '';
      return `- **${k.toUpperCase()}**: ${score}/100${reason ? ` — ${reason}` : ''}`;
    }).join('\n');

    const content = `# Investment Analysis: ${state.company} (${state.ticker})
Date: ${new Date().toLocaleDateString()}
Decision: **${state.verdict.decision}** (Confidence: ${state.verdict.score}/100)
Position: ${state.verdict.positionSizing || 'N/A'}

## Rationale
${state.verdict.rationale}

## Key Drivers
${state.verdict.keyWhy.map(w => `- ${w}`).join('\n')}

## Key Risks
${state.verdict.keyRisks.map(r => `- ${r}`).join('\n')}

## Factor Scores
${scoresMd}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${state.ticker || 'analysis'}_report.md`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dec = state.verdict?.decision?.toLowerCase() ?? 'hold';
  const isDone = state.phase === 'done' && !!state.verdict;
  const isStreaming = state.phase === 'streaming';

  return (
    <div className="app-shell">
      {/* ── HEADER ── */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="header-brand" style={{ cursor: 'pointer' }} onClick={() => { window.location.hash = '#/'; }}>
            <div className="header-logo">AI</div>
            <div>
              <div className="header-title">Verity Research</div>
              <div className="header-subtitle">Investment Intelligence</div>
            </div>
          </div>
        </div>
        <div className="header-right">
          {isStreaming && (
            <div className="header-badge">
              <div className="pulse-dot" />
              Analyzing
            </div>
          )}
          <button
            onClick={() => setIsSettingsOpen(prev => !prev)}
            className="btn-log-toggle"
            title="Configure Backend Connection"
            style={{ marginRight: 8, background: '#1c1c24', border: '1px solid #3c3c4e' }}
          >
            ⚙️ Connection
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`btn-log-toggle ${isStreaming ? 'pulse-glowing' : ''}`}
            title="View Agent Activity & Details"
          >
            📋 View Logs & State {state.logs.length > 0 && `(${state.logs.length})`}
          </button>
          {(isDone || isStreaming) && (
            <button className="btn-new" onClick={handleReset}>
              ＋ New Analysis
            </button>
          )}
        </div>
      </header>

      {isSettingsOpen && (
        <div className="connection-settings-bar anim-fade-in" style={{
          background: 'var(--card-bg)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}>
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '800px', flex: 1 }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>⚙️ API Server URL:</span>
            <input
              type="text"
              placeholder="e.g. http://localhost:3001 or https://xxxx.ngrok-free.app (leave blank for Auto-resolve)"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: 'var(--text-1)',
                fontSize: '13px',
                minWidth: '200px'
              }}
            />
            <button type="submit" className="export-btn" style={{ margin: 0, padding: '6px 14px' }}>Save</button>
            <button type="button" onClick={() => { setApiUrl(''); localStorage.removeItem('VITE_API_BASE_URL'); setIsSettingsOpen(false); }} className="export-btn" style={{ margin: 0, padding: '6px 14px', background: 'transparent', border: '1px solid transparent' }}>Reset</button>
          </form>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'right' }}>
            To run locally, run <code>npm run dev</code> in <code>/server</code> and open <code>http://localhost:5173</code>
          </span>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="app-body">

        {/* ── LEFT SIDEBAR — HISTORY ── */}
        <div className={`sidebar-left-wrapper ${isHistoryOpen ? 'open' : 'closed'}`}>
          <aside className="sidebar-left">
            <div className="sidebar-section-label" style={{ marginBottom: 12 }}>Past Analyses</div>
            {history.length === 0 ? (
              <div className="history-empty">No history yet.<br />Run your first analysis.</div>
            ) : (
              <ul className="history-list">
                {history.map((item) => {
                  const d = item.state.verdict?.decision?.toLowerCase() ?? 'hold';
                  const dotColor = d === 'invest' ? 'var(--emerald)' : d === 'pass' ? 'var(--crimson)' : 'var(--amber)';
                  return (
                    <li
                      key={item.state.ticker}
                      className={`history-item ${state.ticker === item.state.ticker ? 'active' : ''}`}
                      onClick={() => load(item.state)}
                    >
                      <span className="history-dot" style={{ background: dotColor }} />
                      <span className="history-ticker">{item.state.ticker}</span>
                      <span className={`history-verdict ${d}`}>{item.state.verdict?.decision}</span>
                      <span className="history-date">{item.dateStr}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {history.length > 0 && (
              <button
                className="history-clear-btn"
                onClick={() => {
                  if (window.confirm('Clear all history?')) {
                    localStorage.removeItem(HISTORY_KEY);
                    setHistory([]);
                  }
                }}
              >
                Clear History
              </button>
            )}
          </aside>
          <button
            onClick={() => setIsHistoryOpen(prev => !prev)}
            className="btn-sidebar-toggle"
            title={isHistoryOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            ☰
          </button>
        </div>

        {/* ── MAIN ── */}
        <main className="main-content">

          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className="search-wrapper">
              <span className="search-icon-label">🔍</span>
              <input
                id="company-search"
                type="text"
                className="search-input"
                placeholder="Search any company — e.g. Apple, Tesla, NVIDIA, Reliance…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={isStreaming}
                autoFocus
              />
              <button
                id="analyze-btn"
                type="submit"
                className="search-btn"
                disabled={isStreaming || !query.trim()}
              >
                {isStreaming ? (
                  <><div className="btn-spinner" /> Analyzing</>
                ) : 'Analyze →'}
              </button>
            </div>
          </form>

          {/* ── IDLE HERO ── */}
          {!state.ticker && !isStreaming && (
            <div className="hero-idle anim-fade-in-up">
              <div className="hero-icon">🤖</div>
              <div>
                <h1 className="hero-heading">AI Investment Research Agent</h1>
                <p className="hero-sub" style={{ marginTop: 10 }}>
                  Powered by LangGraph — 8 parallel research tools, multi-agent synthesis, real-time streaming.
                </p>
              </div>
              <div className="hero-chips">
                <div className="hero-chip"><span className="chip-dot" />LangGraph Agents</div>
                <div className="hero-chip"><span className="chip-dot" style={{ background: 'var(--emerald)' }} />8 Research Tools</div>
                <div className="hero-chip"><span className="chip-dot" style={{ background: 'var(--violet)' }} />Real-time SSE</div>
                <div className="hero-chip"><span className="chip-dot" style={{ background: 'var(--amber)' }} />Groq LLM</div>
              </div>
            </div>
          )}

          {/* ── STREAMING PIPELINE ── */}
          {isStreaming && (
            <PipelineSteps
              hasTicker={!!state.ticker}
              hasScores={Object.keys(state.scores).length > 0}
              hasVerdict={!!state.verdict}
            />
          )}

          {/* ── VERDICT BANNER ── */}
          {isDone && (() => {
            const score = state.verdict!.score;
            const circumference = 2 * Math.PI * 36;
            const dashOffset = circumference - (score / 100) * circumference;
            const decColor = dec === 'invest' ? 'var(--emerald)' : dec === 'pass' ? 'var(--crimson)' : 'var(--amber)';
            return (
              <div className={`verdict-banner ${dec} anim-fade-in-up`}>
                <div className="verdict-banner-inner">
                  <div className="verdict-company">
                    <div className="verdict-company-name">{state.company}</div>
                    <div className="verdict-ticker-pill">{state.ticker}</div>
                    <div className="verdict-rule-callout">
                      <span className="rule-icon">ℹ</span>
                      {dec === 'invest'
                        ? 'Score ≥ 65 with no dominant HIGH risks → INVEST'
                        : dec === 'pass'
                        ? 'Score < 45 or structural red flags → PASS'
                        : 'Score 45–64 or mixed signals → HOLD'}
                    </div>
                  </div>
                  <div className="verdict-right">
                    {/* SVG confidence ring */}
                    <div className="confidence-ring-wrap">
                      <svg width="88" height="88" viewBox="0 0 88 88">
                        <circle cx="44" cy="44" r="36" fill="none" stroke="var(--bg-3)" strokeWidth="7"/>
                        <circle
                          cx="44" cy="44" r="36" fill="none"
                          stroke={decColor}
                          strokeWidth="7"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          transform="rotate(-90 44 44)"
                          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${decColor})` }}
                        />
                        <text x="44" y="48" textAnchor="middle" fontSize="15" fontWeight="800" fill={decColor} fontFamily="Inter,sans-serif">{score}</text>
                      </svg>
                      <div className="confidence-ring-label">/ 100</div>
                    </div>
                    <div>
                      <div className={`verdict-decision-text ${dec}`}>{state.verdict!.decision}</div>
                      {state.verdict!.positionSizing && (
                        <div className="position-sizing-tag">
                          <span className="sizing-label">Rec. Position:</span> {state.verdict!.positionSizing}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── RATIONALE ── */}
          {isDone && state.verdict!.rationale && (
            <div className={`rationale-block ${dec} anim-fade-in-up delay-1`}>
              <div className="block-label"><span className="icon-sm">💡</span> Decision Rationale — Why {state.verdict!.decision}?</div>
              <p className="rationale-text">{state.verdict!.rationale}</p>
            </div>
          )}

          {/* ── WHY / RISKS ── */}
          {isDone && (state.verdict!.keyWhy?.length > 0 || state.verdict!.keyRisks?.length > 0) && (
            <div className="reasons-grid anim-fade-in-up delay-2">
              <div className="reasons-card why">
                <div className="reasons-title why">✓ Key Drivers</div>
                <ul className="reasons-list">
                  {(state.verdict!.keyWhy.length > 0
                    ? state.verdict!.keyWhy
                    : ['Strong competitive positioning.']
                  ).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
              <div className="reasons-card risks">
                <div className="reasons-title risks">⚠ Key Risks</div>
                <ul className="reasons-list">
                  {(state.verdict!.keyRisks.length > 0
                    ? state.verdict!.keyRisks
                    : ['Market volatility and macro conditions.']
                  ).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* ── COMMITTEE VOTES ── */}
          {isDone && state.verdict!.committeeVotes && (
            <div className="committee-strip anim-fade-in-up delay-3">
              <div className="block-label"><span className="icon-sm">⚖️</span> Investment Committee Votes</div>
              <div className="committee-votes">
                {[
                  { key: 'ResearchAgent', icon: '🔍', name: 'Research Agent', desc: 'Competitive Moat' },
                  { key: 'FinanceAgent', icon: '💵', name: 'Finance Agent', desc: 'Fundamentals & Ratios' },
                  { key: 'NewsAgent', icon: '📰', name: 'News Agent', desc: 'Market Sentiment' },
                  { key: 'RiskAgent', icon: '🚨', name: 'Risk Agent', desc: 'Red Flags & Leverage' },
                ].map(({ key, icon, name, desc }) => {
                  const vote = (state.verdict!.committeeVotes as any)?.[key] ?? 'HOLD';
                  const cls = vote.toLowerCase();
                  return (
                    <div className="vote-card" key={key}>
                      <div className="vote-avatar">{icon}</div>
                      <div className="vote-agent-name">{name}</div>
                      <div className="vote-agent-desc">{desc}</div>
                      <div className={`vote-chip ${cls}`}>{vote}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SCORE BREAKDOWN ── */}
          {Object.keys(state.scores).length > 0 && (
            <div className="scores-card anim-fade-in-up delay-3">
              <div className="block-label"><span className="icon-sm">📊</span> Factor Scorecard — How we reached this number</div>
              <div className="scores-legend">
                <span className="legend-item red">▌ 0–39 Weak</span>
                <span className="legend-item amber">▌ 40–64 Moderate</span>
                <span className="legend-item green">▌ 65–100 Strong</span>
              </div>
              <div className="score-rows">
                {Object.entries(state.scores).map(([key, rawVal], i) => {
                  const label = SCORE_LABELS[key.toLowerCase()] ?? key;
                  const score = typeof rawVal === 'object' ? rawVal.value : rawVal;
                  const reason = typeof rawVal === 'object' ? rawVal.reason : null;
                  const norm = Math.min(100, Math.max(0, score));
                  const color = getScoreColor(norm);
                  return (
                    <div className="score-row" key={key} style={{ animationDelay: `${i * 0.06}s` }}>
                      <div className="score-row-header">
                        <span className="score-row-label">{label}</span>
                        <span className="score-num-badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>{norm}/100</span>
                      </div>
                      <div className="score-track">
                        <div
                          className="score-fill"
                          style={{
                            width: `${norm}%`,
                            background: getScoreGradient(norm),
                            transitionDelay: `${i * 0.1}s`,
                          }}
                        />
                      </div>
                      {reason && (
                        <div className="score-justification">
                          <span className="justify-arrow">↳</span>
                          {reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Weighted average explanation */}
              {state.verdict && (
                <div className="score-aggregate-row">
                  <span className="agg-label">Overall Weighted Score</span>
                  <span className="agg-rule">
                    {state.verdict.score >= 65
                      ? `${state.verdict.score}/100 — above INVEST threshold (≥65)`
                      : state.verdict.score >= 45
                      ? `${state.verdict.score}/100 — in HOLD range (45–64)`
                      : `${state.verdict.score}/100 — below PASS threshold (<45)`}
                  </span>
                  <span className="agg-score" style={{ color: dec === 'invest' ? 'var(--emerald)' : dec === 'pass' ? 'var(--crimson)' : 'var(--amber)' }}>
                    {state.verdict.score}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── KEY METRICS ── */}
          {Object.keys(state.keyMetrics).length > 0 && (
            <div className="metrics-card anim-fade-in-up delay-4">
              <div className="block-label"><span className="icon-sm">📈</span> Key Financial Metrics</div>
              <div className="metrics-grid">
                {Object.entries(state.keyMetrics).map(([key, val]) => {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
                  return (
                    <div className="metric-item" key={key}>
                      <div className="metric-val">{val}</div>
                      <div className="metric-label">{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── EXPORT ── */}
          {isDone && (
            <div className="export-row anim-fade-in-up delay-5">
              <button className="export-btn" onClick={handleExportJSON}>📥 Export JSON</button>
              <button className="export-btn" onClick={handleExportMD}>📝 Export Report</button>
            </div>
          )}

        </main>

      </div>

      {/* Logs & State Modal */}
      <LogsStateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={modalTab}
        setActiveTab={setModalTab}
        state={state}
        newsOpen={newsOpen}
        setNewsOpen={setNewsOpen}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  if (currentHash === '#/app' || currentHash.startsWith('#/app')) {
    return <AnalysisApp />;
  }

  return <LandingPage />;
};

export default App;
