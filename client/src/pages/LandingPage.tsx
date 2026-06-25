import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import ThreeBackground from '../components/ThreeBackground';

interface StockPreset {
  ticker: string;
  name: string;
  verdict: 'INVEST' | 'PASS' | 'HOLD';
  score: number;
  logs: string[];
}

const STOCK_PRESETS: Record<string, StockPreset> = {
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    verdict: 'INVEST',
    score: 91,
    logs: [
      '[Planner] Initialized analysis for NVIDIA Corporation...',
      '[Planner] Resolved company to ticker NVDA (NASDAQ).',
      '[Research] Running parallel crawlers...',
      '[Tool: yahooFinance] Current Price: $127.40 | P/E: 67.2 | Rev Growth: +125.0%',
      '[Tool: ratioCalculator] Calculated metrics. Debt-to-Equity: 0.17 | Operating Margin: 62.1%',
      '[Tool: sentimentTool] Crawling news. Sentiment Index: 0.88 (Highly Bullish)',
      '[Tool: riskScorer] Assessing risk score. Risk factor evaluated at 0.35 (Low/Moderate)',
      '[Tool: moatAnalyser] Strong competitive advantage identified: CUDA ecosystem lock-in & GPU leadership.',
      '[Tool: secEdgar] Parsed 10-Q filing. Found R&D expenditure increase of 38% YoY.',
      '[Synthesis] Aggregating factor scorecards...',
      '[Synthesis] Fundamentals: 92/100, Growth: 98/100, Valuation: 42/100, Sentiment: 94/100, Moat: 97/100',
      '[Verdict] Final consensus reached. Generating investment recommendation...'
    ]
  },
  TECHM: {
    ticker: 'TECHM',
    name: 'Tech Mahindra Ltd',
    verdict: 'PASS',
    score: 53,
    logs: [
      '[Planner] Initialized analysis for Tech Mahindra Ltd...',
      '[Planner] Resolved company to ticker TECHM (NSE).',
      '[Research] Running parallel crawlers...',
      '[Tool: yahooFinance] Current Price: ₹1,480.00 | P/E: 32.5 | Rev Growth: +4.8%',
      '[Tool: ratioCalculator] Calculated metrics. Debt-to-Equity: 0.12 | Operating Margin: 11.2%',
      '[Tool: sentimentTool] Crawling news. Sentiment Index: 0.52 (Neutral)',
      '[Tool: riskScorer] Assessing risk score. Risk factor evaluated at 0.62 (Moderate/High due to client concentration)',
      '[Tool: moatAnalyser] Weak/Moderate moat. Intense competition in IT services from Tier-1 peers.',
      '[Tool: secEdgar] Parsed annual reports. Noted talent attrition rates decreased to 14.2%.',
      '[Synthesis] Aggregating factor scorecards...',
      '[Synthesis] Fundamentals: 62/100, Growth: 51/100, Valuation: 58/100, Sentiment: 55/100, Moat: 48/100',
      '[Verdict] Final consensus reached. Generating investment recommendation...'
    ]
  },
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    verdict: 'INVEST',
    score: 82,
    logs: [
      '[Planner] Initialized analysis for Apple Inc...',
      '[Planner] Resolved company to ticker AAPL (NASDAQ).',
      '[Research] Running parallel crawlers...',
      '[Tool: yahooFinance] Current Price: $214.30 | P/E: 31.8 | Rev Growth: +5.2%',
      '[Tool: ratioCalculator] Calculated metrics. Debt-to-Equity: 1.45 | Operating Margin: 30.7%',
      '[Tool: sentimentTool] Crawling news. Sentiment Index: 0.74 (Bullish)',
      '[Tool: riskScorer] Assessing risk score. Risk factor evaluated at 0.42 (Low/Moderate)',
      '[Tool: moatAnalyser] Extreme competitive advantage: Ecosystem lock-in, hardware premium, and Services growth.',
      '[Tool: secEdgar] Parsed 10-K filing. Found cash reserves of $162.3B.',
      '[Synthesis] Aggregating factor scorecards...',
      '[Synthesis] Fundamentals: 89/100, Growth: 68/100, Valuation: 55/100, Sentiment: 82/100, Moat: 95/100',
      '[Verdict] Final consensus reached. Generating investment recommendation...'
    ]
  }
};

const CODE_TEMPLATES = {
  curl: `curl -X POST https://api.veritylabs.ai/v1/analyze \\
  -H "Authorization: Bearer verity_live_pk_8f29" \\
  -H "Content-Type: application/json" \\
  -d '{
    "companyName": "NVIDIA",
    "riskTolerance": "moderate",
    "includeSecEdgar": true
  }'`,
  python: `import requests

url = "https://api.veritylabs.ai/v1/analyze"
headers = {
    "Authorization": "Bearer verity_live_pk_8f29",
    "Content-Type": "application/json"
}
payload = {
    "companyName": "NVIDIA",
    "riskTolerance": "moderate",
    "includeSecEdgar": True
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
  node: `import fetch from 'node-fetch';

const url = 'https://api.veritylabs.ai/v1/analyze';
const options = {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer verity_live_pk_8f29',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyName: 'NVIDIA',
    riskTolerance: 'moderate',
    includeSecEdgar: true
  })
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error(err));`
};

export default function LandingPage() {
  const [activePreset, setActivePreset] = useState<string>('NVDA');
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [simulatingStep, setSimulatingStep] = useState<number>(0); // 0: Idle, 1: Planner, 2: Research, 3: Synthesis, 4: Finished
  const [apiTab, setApiTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState<boolean>(false);
  
  // Role path state
  const [activeRole, setActiveRole] = useState<'retail' | 'analyst' | 'fund'>('retail');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  // Start simulated demo
  const triggerSimulation = (presetKey: string) => {
    setActivePreset(presetKey);
    setSimulatedLogs([]);
    setSimulatingStep(1);
    
    const preset = STOCK_PRESETS[presetKey];
    let logIndex = 0;
    
    // Clear any active interval/timeout
    const interval = setInterval(() => {
      if (logIndex < preset.logs.length) {
        const nextLog = preset.logs[logIndex];
        setSimulatedLogs(prev => [...prev, nextLog]);
        
        // Dynamic step indicators based on index
        if (logIndex === 0) setSimulatingStep(1); // Planner
        else if (logIndex === 2) setSimulatingStep(2); // Research
        else if (logIndex === 9) setSimulatingStep(3); // Synthesis
        
        logIndex++;
      } else {
        clearInterval(interval);
        setSimulatingStep(4); // Finished
      }
    }, 450);
  };

  useEffect(() => {
    triggerSimulation('NVDA');
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_TEMPLATES[apiTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setFormSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setFormSubmitted(false), 5000);
    }
  };

  return (
    <div className="app-shell" style={{ overflowY: 'auto' }}>
      <ThreeBackground />
      {/* HEADER */}
      <header className="header">
        <a href="#/" className="header-brand">
          <div style={{
            width: '30px', height: '30px',
            background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px', fontWeight: 800,
            color: '#fff', boxShadow: '0 0 16px rgba(0,200,255,0.4)'
          }}>⚖</div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            VERITY <span style={{ color: 'var(--cyan)' }}>AI</span>
          </span>
        </a>
        <nav className="desktop-nav">
          <a href="#features" className="footer-link-a" style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>Features</a>
          <a href="#how-it-works" className="footer-link-a" style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>How it Works</a>
          <a href="#pricing" className="footer-link-a" style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>Pricing</a>
          <a href="#docs" className="footer-link-a" style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>Docs & API</a>
          <a href="#faq" className="footer-link-a" style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>FAQ</a>
        </nav>
        <button 
          onClick={() => { window.location.hash = '#/app'; }} 
          className="btn-primary" 
          style={{ padding: '9px 20px', fontSize: '0.85rem', fontWeight: 700 }}
          data-track="header-cta"
        >
          Launch App →
        </button>
      </header>

      <section className="landing-section hero-sec" style={{ position: 'relative' }}>
        <div className="glow-orb glow-orb-cyan"></div>
        <div className="glow-orb glow-orb-violet"></div>
        <div className="landing-container" style={{ position: 'relative' }}>
          {/* Floating Glass Badges */}
          <div className="floating-glass-badge badge-left">
            <span style={{ color: 'var(--emerald)' }}>●</span> Verity Verdict: INVEST
          </div>
          <div className="floating-glass-badge badge-right">
            <span style={{ color: 'var(--cyan)' }}>●</span> Confidence: 91% (NVDA)
          </div>
          <div className="floating-glass-badge badge-bottom-left">
            <span style={{ color: 'var(--violet)' }}>●</span> SEC Edgar: Parsed
          </div>
          <div className="hero-badge">
            🚀 1-Click Autonomous Stock Intelligence
          </div>
          <h1 className="hero-title">
            Get Actionable Investment Decisions in <span>60 Seconds</span>
          </h1>
          <p className="hero-subtitle">
            An autonomous LangGraph research agent running 8 parallel crawlers. Synthesizes news, financials, competitive moats, and SEC Edgar reports to render instant consensus verdicts.
          </p>
          <div className="hero-ctas">
            <button 
              onClick={() => { window.location.hash = '#/app'; }} 
              className="btn-primary"
              data-track="hero-cta-main"
            >
              Start Free Trial (₹0)
            </button>
            <a href="#how-it-works" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              How It Works
            </a>
          </div>
          <div className="hero-microcopy">
            <div className="microcopy-item">🛡️ No Credit Card Required</div>
            <div className="microcopy-item">⚡ Ultra-low India Latency</div>
            <div className="microcopy-item">💸 Pricing in INR</div>
          </div>

          {/* Stats Row */}
          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <div className="hero-stat-val">8</div>
              <div className="hero-stat-lbl">Research Tools</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <div className="hero-stat-val">60s</div>
              <div className="hero-stat-lbl">Avg. Analysis Time</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <div className="hero-stat-val">7</div>
              <div className="hero-stat-lbl">Factor Scorecard</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <div className="hero-stat-val">∞</div>
              <div className="hero-stat-lbl">Markets Covered</div>
            </div>
          </div>
        </div>

        {/* ── LIVE ANALYSIS PREVIEW ── */}
        <div className="landing-container" style={{ marginTop: '56px' }}>
          {/* Ticker Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Try a live demo →</span>
            {(['NVDA', 'AAPL', 'TECHM'] as const).map(key => (
              <button
                key={key}
                onClick={() => triggerSimulation(key)}
                style={{
                  padding: '7px 18px', borderRadius: 'var(--r-full)',
                  border: `1px solid ${activePreset === key ? 'var(--cyan)' : 'rgba(255,255,255,0.08)'}`,
                  background: activePreset === key ? 'rgba(0,200,255,0.1)' : 'rgba(255,255,255,0.02)',
                  color: activePreset === key ? 'var(--cyan)' : 'var(--text-2)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '0.04em',
                  boxShadow: activePreset === key ? '0 0 16px rgba(0,200,255,0.15)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >{key}</button>
            ))}
          </div>

          {/* Main 3-panel Analysis Card */}
          <div style={{
            background: 'rgba(6,21,37,0.85)', border: '1px solid rgba(0,200,255,0.18)',
            borderRadius: '20px', overflow: 'hidden', backdropFilter: 'blur(24px)',
            boxShadow: '0 0 80px rgba(0,200,255,0.07), 0 24px 80px rgba(0,0,0,0.5)',
          }}>
            {/* Header Bar */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(0,200,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,28,50,0.8)' }}>
              <div style={{ display: 'flex', gap: '7px' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', boxShadow: '0 0 6px rgba(255,95,87,0.5)' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', display: 'inline-block', boxShadow: '0 0 6px rgba(254,188,46,0.5)' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', display: 'inline-block', boxShadow: '0 0 6px rgba(40,200,64,0.5)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', boxShadow: '0 0 8px var(--emerald)', animation: 'pulse-dot 2s ease infinite' }} />
                verity-agent · {STOCK_PRESETS[activePreset].name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {simulatingStep < 4 ? `⏳ Analyzing...` : `✓ Complete`}
              </div>
            </div>

            {/* Three Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', minHeight: '380px' }}>

              {/* COL 1: Verdict + Pipeline */}
              <div style={{ padding: '28px 24px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>Final Verdict</div>
                <div style={{
                  fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
                  color: STOCK_PRESETS[activePreset].verdict === 'INVEST' ? 'var(--emerald)' : STOCK_PRESETS[activePreset].verdict === 'PASS' ? 'var(--crimson)' : 'var(--amber)',
                  textShadow: STOCK_PRESETS[activePreset].verdict === 'INVEST' ? '0 0 40px rgba(0,240,130,0.5)' : STOCK_PRESETS[activePreset].verdict === 'PASS' ? '0 0 40px rgba(255,45,85,0.5)' : '0 0 40px rgba(255,183,0,0.5)',
                  opacity: simulatingStep === 4 ? 1 : 0.2, transition: 'opacity 0.6s ease',
                }}>
                  {simulatingStep === 4 ? STOCK_PRESETS[activePreset].verdict : '- -'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '24px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)' }}>{activePreset}</span>
                  <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.18)', color: 'var(--cyan)' }}>
                    {simulatingStep === 4 ? `${STOCK_PRESETS[activePreset].score}% confidence` : '…'}
                  </span>
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>Agent Pipeline</div>
                {[{ id: 1, icon: '🗺️', label: 'Ticker Resolution' }, { id: 2, icon: '⚡', label: '8 Parallel Crawlers' }, { id: 3, icon: '⚖️', label: 'Synthesis & Voting' }].map(step => (
                  <div key={step.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '6px',
                    borderRadius: '8px',
                    background: simulatingStep === step.id ? 'rgba(0,200,255,0.06)' : simulatingStep > step.id ? 'rgba(0,240,130,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${simulatingStep === step.id ? 'rgba(0,200,255,0.3)' : simulatingStep > step.id ? 'rgba(0,240,130,0.2)' : 'rgba(255,255,255,0.04)'}`,
                    transition: 'all 0.3s ease',
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>{simulatingStep > step.id ? '✓' : step.icon}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 500, color: simulatingStep === step.id ? 'var(--cyan)' : simulatingStep > step.id ? 'var(--emerald)' : 'var(--text-3)' }}>{step.label}</span>
                    {simulatingStep === step.id && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', animation: 'pulse-dot 1.2s ease infinite' }} />}
                  </div>
                ))}
              </div>

              {/* COL 2: 7-Factor Scorecard */}
              <div style={{ padding: '28px 24px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '14px' }}>7-Factor Scorecard</div>
                {(() => {
                  const isNVDA = activePreset === 'NVDA'; const isAAPL = activePreset === 'AAPL';
                  return [
                    { label: 'Fundamentals', val: isNVDA ? 92 : isAAPL ? 89 : 62 },
                    { label: 'Growth',       val: isNVDA ? 98 : isAAPL ? 68 : 51 },
                    { label: 'Valuation',    val: isNVDA ? 42 : isAAPL ? 55 : 58 },
                    { label: 'Sentiment',    val: isNVDA ? 94 : isAAPL ? 82 : 55 },
                    { label: 'Moat',         val: isNVDA ? 97 : isAAPL ? 95 : 48 },
                    { label: 'Risk',         val: isNVDA ? 65 : isAAPL ? 72 : 38 },
                    { label: 'Management',   val: isNVDA ? 88 : isAAPL ? 84 : 60 },
                  ].map(f => {
                    const c = f.val >= 75 ? 'var(--emerald)' : f.val >= 50 ? 'var(--amber)' : 'var(--crimson)';
                    const bg = f.val >= 75 ? 'rgba(0,240,130,0.1)' : f.val >= 50 ? 'rgba(255,183,0,0.1)' : 'rgba(255,45,85,0.1)';
                    return (
                      <div key={f.label} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 500 }}>{f.label}</span>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: c, background: bg, padding: '1px 7px', borderRadius: '5px' }}>
                            {simulatingStep === 4 ? f.val : '--'}
                          </span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '99px', background: `linear-gradient(90deg,${c},${c}88)`, width: simulatingStep === 4 ? `${f.val}%` : '0%', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 6px ${c}` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
                <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--cyan)' }}>{simulatingStep === 4 ? STOCK_PRESETS[activePreset].score : '--'}</span>
                </div>
              </div>

              {/* COL 3: Committee + Metrics */}
              <div style={{ padding: '28px 24px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>Committee Votes</div>
                {(() => {
                  const v = STOCK_PRESETS[activePreset].verdict;
                  const votes = v === 'INVEST'
                    ? [['📈 Growth Investor','INVEST','var(--emerald)'],['💡 Value Strategist','INVEST','var(--emerald)'],['🛡️ Risk Officer','HOLD','var(--amber)'],['🔍 Quant Analyst','INVEST','var(--emerald)'],['🌐 Macro Analyst','INVEST','var(--emerald)']]
                    : v === 'PASS'
                    ? [['📈 Growth Investor','PASS','var(--crimson)'],['💡 Value Strategist','PASS','var(--crimson)'],['🛡️ Risk Officer','PASS','var(--crimson)'],['🔍 Quant Analyst','HOLD','var(--amber)'],['🌐 Macro Analyst','PASS','var(--crimson)']]
                    : [['📈 Growth Investor','HOLD','var(--amber)'],['💡 Value Strategist','INVEST','var(--emerald)'],['🛡️ Risk Officer','PASS','var(--crimson)'],['🔍 Quant Analyst','HOLD','var(--amber)'],['🌐 Macro Analyst','HOLD','var(--amber)']];
                  return votes.map(([agent, verdict, color], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '6px', opacity: simulatingStep === 4 ? 1 : 0.25, transform: `translateX(${simulatingStep === 4 ? 0 : 8}px)`, transition: `all 0.4s ease ${i * 0.07}s` }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-2)' }}>{agent}</span>
                      <span style={{ fontSize: '0.63rem', fontWeight: 800, padding: '2px 8px', borderRadius: '5px', background: color === 'var(--emerald)' ? 'rgba(0,240,130,0.1)' : color === 'var(--crimson)' ? 'rgba(255,45,85,0.1)' : 'rgba(255,183,0,0.1)', color, border: `1px solid ${color === 'var(--emerald)' ? 'rgba(0,240,130,0.22)' : color === 'var(--crimson)' ? 'rgba(255,45,85,0.22)' : 'rgba(255,183,0,0.22)'}` }}>{verdict}</span>
                    </div>
                  ));
                })()}
                <div style={{ marginTop: '16px', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>Key Metrics</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                  {(activePreset === 'NVDA'
                    ? [{l:'Price',v:'$127.40'},{l:'P/E Ratio',v:'67.2x'},{l:'Rev Growth',v:'+125%'},{l:'Op. Margin',v:'62.1%'}]
                    : activePreset === 'AAPL'
                    ? [{l:'Price',v:'$214.30'},{l:'P/E Ratio',v:'31.8x'},{l:'Rev Growth',v:'+5.2%'},{l:'Op. Margin',v:'30.7%'}]
                    : [{l:'Price',v:'₹1,480'},{l:'P/E Ratio',v:'32.5x'},{l:'Rev Growth',v:'+4.8%'},{l:'Op. Margin',v:'11.2%'}]
                  ).map((m, i) => (
                    <div key={i} style={{ padding: '9px', borderRadius: '8px', background: 'linear-gradient(135deg,rgba(10,28,50,0.9),rgba(15,37,64,0.7))', border: '1px solid rgba(0,200,255,0.1)', opacity: simulatingStep === 4 ? 1 : 0.25, transition: `opacity 0.4s ease ${i*0.08}s` }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--cyan)' }}>{m.v}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Strip */}
            <div style={{ borderTop: '1px solid rgba(0,200,255,0.08)', background: 'rgba(6,18,33,0.9)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {['8 Parallel Crawlers','SEC Edgar Parsed','LangGraph Powered','7 Scoring Factors'].map(tag => (
                  <span key={tag} style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: 'var(--cyan)' }}>✓</span> {tag}
                  </span>
                ))}
              </div>
              <button onClick={() => { window.location.hash = '#/app'; }} className="btn-primary" style={{ padding: '9px 24px', fontSize: '0.85rem', fontWeight: 700 }}>Try It Now — Free →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ROLE / INDUSTRY MICRO-PATHS */}

      <section className="landing-section alt-bg">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Role Micro-Paths</span>
            <h2 className="section-title">Tailored Financial Intelligence</h2>
            <p className="section-subtitle">Select your persona to see how the Verity AI Agent adapts to your constraints.</p>
          </div>

          <div className="roles-grid">
            <div 
              className={`role-card ${activeRole === 'retail' ? 'active' : ''}`}
              onClick={() => setActiveRole('retail')}
            >
              <div className="role-icon">📱</div>
              <div className="role-name">Retail Trader</div>
              <div className="role-desc">Make fast, objective choices without analysis paralysis. Filter out social media noise.</div>
            </div>
            <div 
              className={`role-card ${activeRole === 'analyst' ? 'active' : ''}`}
              onClick={() => setActiveRole('analyst')}
            >
              <div className="role-icon">📊</div>
              <div className="role-name">Equity Analyst</div>
              <div className="role-desc">Export rich factor tables, download SEC 10-K parsed chunks, and inspect crawler logic.</div>
            </div>
            <div 
              className={`role-card ${activeRole === 'fund' ? 'active' : ''}`}
              onClick={() => setActiveRole('fund')}
            >
              <div className="role-icon">💼</div>
              <div className="role-name">Portfolio Manager</div>
              <div className="role-desc">API integrations, custom committee configurations, and risk weighting overrides.</div>
            </div>
          </div>

          <div className="role-path-details">
            <div className="role-path-text">
              {activeRole === 'retail' && (
                <>
                  <h4>Simplicity & Speed for Individual Portfolios</h4>
                  <p>Get instant stock summaries, plain-english reasons for why you should buy, pass, or hold, and clean visualizations of complex valuation multiples.</p>
                  <div className="role-path-list">
                    <div className="role-path-list-item"><span>✓</span> 10 Free Analyses per day</div>
                    <div className="role-path-list-item"><span>✓</span> Sentiment scores from news & Reddit</div>
                    <div className="role-path-list-item"><span>✓</span> Simple, direct outcome verdicts</div>
                  </div>
                </>
              )}
              {activeRole === 'analyst' && (
                <>
                  <h4>Deep-Dive Analysis Tools for Equity Reports</h4>
                  <p>Drill down into specific scoring parameters. Read exactly how the SEC Edgar crawler parses R&D spendings and debt structures, saving hours of manual reading.</p>
                  <div className="role-path-list">
                    <div className="role-path-list-item"><span>✓</span> Full factor scorecard breakups</div>
                    <div className="role-path-list-item"><span>✓</span> Complete log auditing for crawlers</div>
                    <div className="role-path-list-item"><span>✓</span> Direct links to source SEC records</div>
                  </div>
                </>
              )}
              {activeRole === 'fund' && (
                <>
                  <h4>Institutional Infrastructure & APIs</h4>
                  <p>Integrate our autonomous consensus into your portfolio management tools. Customize voting thresholds and connect to corporate messaging webhooks.</p>
                  <div className="role-path-list">
                    <div className="role-path-list-item"><span>✓</span> Enterprise JSON Webhook outputs</div>
                    <div className="role-path-list-item"><span>✓</span> Custom weight presets for valuation ratios</div>
                    <div className="role-path-list-item"><span>✓</span> Dedicated high-throughput servers</div>
                  </div>
                </>
              )}
            </div>
            <div className="role-path-visual">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                {activeRole === 'retail' && (
                  <div className="comparison-side">
                    <div style={{ color: 'var(--cyan)', borderBottom: '1px solid var(--border-1)', paddingBottom: '6px', marginBottom: '8px' }}>User Setup (Retail Mode)</div>
                    <div>&gt; target_risk: Low</div>
                    <div>&gt; horizon: 3-5 Years</div>
                    <div>&gt; indicators: News + Valuations</div>
                    <div style={{ marginTop: '16px', color: 'var(--emerald)' }}>Setup complete. Ready to crawl.</div>
                  </div>
                )}
                {activeRole === 'analyst' && (
                  <div className="comparison-side">
                    <div style={{ color: 'var(--cyan)', borderBottom: '1px solid var(--border-1)', paddingBottom: '6px', marginBottom: '8px' }}>Audited Sources Loaded</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>SEC 10-K/Q</span><span style={{ color: 'var(--emerald)' }}>200 OK</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>Moat Scraper</span><span style={{ color: 'var(--emerald)' }}>100% Crawled</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>Sentiment Engine</span><span style={{ color: 'var(--emerald)' }}>92 Citations</span></div>
                    <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-3)' }}>Audit trail exported to PDF.</div>
                  </div>
                )}
                {activeRole === 'fund' && (
                  <div className="comparison-side">
                    <div style={{ color: 'var(--cyan)', borderBottom: '1px solid var(--border-1)', paddingBottom: '6px', marginBottom: '8px' }}>Consensus Weighting Config</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>Value Score</span><span>30%</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>Risk Score</span><span>40%</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>Sentiment Score</span><span>30%</span></div>
                    <div style={{ marginTop: '12px', color: 'var(--cyan)' }}>Running in headless cluster...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-section" id="how-it-works">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Mechanics</span>
            <h2 className="section-title">How the Agent Computes Decisions</h2>
            <p className="section-subtitle">We believe in transparent AI. Here is the step-by-step workflow of our agent.</p>
          </div>

          <div className="hiw-steps">
            <div className="hiw-step-card">
              <span className="hiw-step-number">01</span>
              <div className="hiw-step-header">
                <span className="hiw-step-badge">1</span>
                <span className="hiw-step-title">Ticker Resolution</span>
              </div>
              <p className="hiw-step-desc">
                Input any company name. Our Planner node queries Google/Yahoo APIs to resolve the correct legal entity, stock exchange, and ticker code in under 1 second.
              </p>
            </div>
            <div className="hiw-step-card">
              <span className="hiw-step-number">02</span>
              <div className="hiw-step-header">
                <span className="hiw-step-badge">2</span>
                <span className="hiw-step-title">8 Parallel Crawlers</span>
              </div>
              <p className="hiw-step-desc">
                Instead of sequential parsing, our agent launches parallel web workers: yahooFinance, ratioCalculator, sentimentTool, riskScorer, moatAnalyser, competitorMap, tavilySearch, and secEdgar.
              </p>
            </div>
            <div className="hiw-step-card">
              <span className="hiw-step-number">03</span>
              <div className="hiw-step-header">
                <span className="hiw-step-badge">3</span>
                <span className="hiw-step-title">Multi-Agent Voting</span>
              </div>
              <p className="hiw-step-desc">
                A simulated board committee receives the synthesis report. They evaluate 7 factors, cast independent votes, state their primary concerns, and construct the final decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-section alt-bg" id="features">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Core Features</span>
            <h2 className="section-title">Autonomous Financial Terminal</h2>
            <p className="section-subtitle">Everything you need to conduct deep stock research without manually digging through filings.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box">⚡</div>
              <h3 className="feature-title">8-Tool Concurrent Scraper</h3>
              <p className="feature-desc">Crawls multiple databases concurrently, merging unstructured text filings with structured financial metrics.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box">📚</div>
              <h3 className="feature-title">SEC Edgar Vector Search</h3>
              <p className="feature-desc">Automatically parses balance sheets, income statements, and risk disclosures from official regulatory 10-K documents.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box">📊</div>
              <h3 className="feature-title">7-Factor Scorecard</h3>
              <p className="feature-desc">Grades every target on Fundamentals, Growth, Valuation, Sentiment, Moat, Risk, and Management with detailed text justifications.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box">🗣️</div>
              <h3 className="feature-title">Committee Voting</h3>
              <p className="feature-desc">See the granular votes from five simulated analyst personas (e.g., Growth Investor, Value Fundamentalist, Skeptic Risk Officer).</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box">📡</div>
              <h3 className="feature-title">Real-Time Streaming</h3>
              <p className="feature-desc">Watch the agent think. Streams live execution logs as each crawl node initiates and returns data.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-box">🌐</div>
              <h3 className="feature-title">Developer Ready</h3>
              <p className="feature-desc">Trigger analyses programmatically via API endpoints and embed outputs directly into your custom dashboards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDY */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Analysis Case Study</span>
            <h2 className="section-title">NVIDIA vs Tech Mahindra 2025</h2>
            <p className="section-subtitle">Review how our agent evaluated two massive tech players in early 2025.</p>
          </div>

          <div className="case-study-card">
            <div className="case-study-content">
              <h4>Real Decision Scenarios (2025 Evaluations)</h4>
              <p>In early 2025, when both NVIDIA and Tech Mahindra faced significant valuation and market questions, the agent compiled parallel profiles. The synthesis node weighed Nvidia's massive margin growth against Tech Mahindra's service sector challenges to output clear, objective advice.</p>
              <div className="case-study-metrics">
                <div className="case-study-metric">
                  <div className="case-study-metric-val emerald">91%</div>
                  <div className="case-study-metric-lbl">NVDA Confidence</div>
                </div>
                <div className="case-study-metric">
                  <div className="case-study-metric-val">53%</div>
                  <div className="case-study-metric-lbl">TECHM Confidence</div>
                </div>
              </div>
            </div>
            <div className="case-study-side">
              <div className="comparison-row">
                <span className="comparison-lbl">Metric</span>
                <span className="comparison-val">NVIDIA (NVDA)</span>
                <span className="comparison-val">Tech Mahindra</span>
              </div>
              <div className="comparison-row">
                <span className="comparison-lbl">PE Ratio</span>
                <span className="comparison-val" style={{ color: 'var(--crimson)' }}>67.2</span>
                <span className="comparison-val" style={{ color: 'var(--emerald)' }}>32.5</span>
              </div>
              <div className="comparison-row">
                <span className="comparison-lbl">Revenue Growth</span>
                <span className="comparison-val" style={{ color: 'var(--emerald)' }}>+125%</span>
                <span className="comparison-val" style={{ color: 'var(--amber)' }}>+4.8%</span>
              </div>
              <div className="comparison-row">
                <span className="comparison-lbl">Operating Margin</span>
                <span className="comparison-val" style={{ color: 'var(--emerald)' }}>62.1%</span>
                <span className="comparison-val" style={{ color: 'var(--amber)' }}>11.2%</span>
              </div>
              <div className="comparison-row">
                <span className="comparison-lbl">Moat Assessment</span>
                <span className="comparison-val">CUDA Lock-in</span>
                <span className="comparison-val">Low / Services</span>
              </div>
              <div className="comparison-row">
                <span className="comparison-lbl">Final Verdict</span>
                <span className="comparison-val" style={{ color: 'var(--emerald)', fontWeight: 800 }}>INVEST</span>
                <span className="comparison-val" style={{ color: 'var(--crimson)', fontWeight: 800 }}>PASS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING (INR Focused) */}
      <section className="landing-section alt-bg" id="pricing">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Pricing</span>
            <h2 className="section-title">Choose Your Scale</h2>
            <p className="section-subtitle">No credit card required. Free tier forever. Prices displayed in INR for Indian markets.</p>
          </div>

          <div className="pricing-grid">
            {/* FREE HOBBYIST */}
            <div className="pricing-card">
              <div className="pricing-tier-name">Hobbyist</div>
              <div className="pricing-tier-desc">Perfect for retail traders managing personal portfolios.</div>
              <div className="pricing-price">
                ₹0 <span>/ month</span>
              </div>
              <div className="pricing-features-list">
                <div className="pricing-feature-item"><span className="icon">✓</span> 10 Runs per Day</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> 8 Core Crawlers</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> Sentiment & News Indexing</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> Web App UI Dashboard</div>
              </div>
              <button onClick={() => { window.location.hash = '#/app'; }} className="pricing-btn" data-track="pricing-free-cta">Start Free Now</button>
            </div>

            {/* PRO TERMINAL */}
            <div className="pricing-card popular">
              <div className="pricing-badge">Recommended</div>
              <div className="pricing-tier-name">Pro Terminal</div>
              <div className="pricing-tier-desc">Designed for active stock analysts and research writers.</div>
              <div className="pricing-price">
                ₹1,999 <span className="pricing-price-period">/ month</span>
              </div>
              <div className="pricing-features-list">
                <div className="pricing-feature-item"><span className="icon">✓</span> Unlimited Analysis Runs</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> Premium SEC filing parsed text</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> Export reports to PDF/JSON</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> Priority server queue (Low Latency)</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> Custom weights configuration</div>
              </div>
              <button onClick={() => { window.location.hash = '#/app'; }} className="pricing-btn" data-track="pricing-pro-cta">Go Pro</button>
            </div>

            {/* DEVELOPER API */}
            <div className="pricing-card">
              <div className="pricing-tier-name">Developer API</div>
              <div className="pricing-tier-desc">Integrate autonomous ratings into external applications.</div>
              <div className="pricing-price">
                ₹4,999 <span>/ month</span>
              </div>
              <div className="pricing-features-list">
                <div className="pricing-feature-item"><span className="icon">✓</span> Headless JSON API access</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> 50 requests per minute</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> Webhook support on verdict updates</div>
                <div className="pricing-feature-item"><span className="icon">✓</span> Priority developer email support</div>
              </div>
              <a href="#docs" className="pricing-btn" style={{ textDecoration: 'none' }}>View Documentation</a>
            </div>
          </div>
        </div>
      </section>

      {/* DOCS / API CORNER */}
      <section className="landing-section" id="docs">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">API Terminal</span>
            <h2 className="section-title">Developer Integration Docs</h2>
            <p className="section-subtitle">Get JSON results programmatically with two lines of code.</p>
          </div>

          <div className="docs-layout">
            <div>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--text-1)', marginBottom: '12px' }}>Request Structure</h4>
              <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                Our REST API endpoint accepts basic POST payloads. Authenticate with your Pro API key to analyze any ticker in the world. Crawlers spin up, gather the context, run consensus calculations, and return a clean structured JSON verdict.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ borderLeft: '3px solid var(--cyan)', paddingLeft: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>ENDPOINT</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-1)' }}>POST /v1/analyze</div>
                </div>
                <div style={{ borderLeft: '3px solid var(--emerald)', paddingLeft: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>LATENCY</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-1)' }}>~60s (Live Crawl)</div>
                </div>
              </div>
            </div>

            <div className="api-snippet-card">
              <div className="api-tabs">
                <button 
                  onClick={() => setApiTab('curl')} 
                  className={`api-tab-btn ${apiTab === 'curl' ? 'active' : ''}`}
                >
                  cURL
                </button>
                <button 
                  onClick={() => setApiTab('python')} 
                  className={`api-tab-btn ${apiTab === 'python' ? 'active' : ''}`}
                >
                  Python
                </button>
                <button 
                  onClick={() => setApiTab('node')} 
                  className={`api-tab-btn ${apiTab === 'node' ? 'active' : ''}`}
                >
                  Node.js
                </button>
              </div>
              <div className="api-code-body">
                <button onClick={handleCopyCode} className="copy-btn">
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <pre style={{ overflowX: 'auto', whiteSpace: 'pre', color: 'var(--text-2)' }}>
                  <code>{CODE_TEMPLATES[apiTab]}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="landing-section alt-bg" id="faq">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Common queries about the autonomous agent's mechanisms.</p>
          </div>

          <div className="faq-list">
            {[
              {
                q: "Is the analysis truly free? Why is it free?",
                a: "Yes, our basic dashboard analysis tool is completely free. We limit free tier runs to 10 queries per day to handle backend server scraping costs. If you need heavier throughput or programmatic API capabilities, you can upgrade to the Pro plan."
              },
              {
                q: "Where does the agent query financial data?",
                a: "The agent leverages Yahoo Finance for stock valuations, pricing indexes, and P/E ratios. It reads official company 10-K and 10-Q documents directly from SEC Edgar servers for regulatory disclosures and indexes global news channels via Tavily API."
              },
              {
                q: "Can this analyze Indian companies (NSE / BSE)?",
                a: "Absolutely. The planner resolves exchange formats for both global stock exchanges (NYSE, NASDAQ) and Indian stock exchanges (NSE, BSE). Simply enter the local name (e.g. 'Tech Mahindra' or 'Reliance Industries') to run the agent."
              },
              {
                q: "How does the multi-agent consensus voting work?",
                a: "The system runs a simulated corporate board using separate generative analyst personas. Each analyst weighs different factors (e.g., the Growth analyst focuses on revenue momentum, while the Risk analyst flags debt/equity ratios). A consensus decision is compiled from their scores."
              },
              {
                q: "Can I run this offline?",
                a: "No. The agent relies on active real-time crawlers to parse fresh stock news and prices, so it requires a connection to the internet."
              }
            ].map((item, idx) => (
              <div key={idx} className={`faq-item ${openFaq === idx ? 'open' : ''}`}>
                <button className="faq-question-btn" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  {item.q}
                  <span className="faq-toggle-icon">+</span>
                </button>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / SUPPORT */}
      <section className="landing-section" id="support">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Support</span>
            <h2 className="section-title">Connect With Us</h2>
            <p className="section-subtitle">Got questions, feature requests, or enterprise enquiries?</p>
          </div>

          <div className="contact-layout">
            <div className="contact-info">
              <div className="contact-card">
                <div className="contact-card-title">Hiring & Lab Sponsor</div>
                <div className="contact-card-detail">Verity AI Labs</div>
              </div>
              <div className="contact-card">
                <div className="contact-card-title">Support Email</div>
                <div className="contact-card-detail">support@veritylabs.ai</div>
              </div>
              <div className="contact-card">
                <div className="contact-card-title">API Sandbox Status</div>
                <div className="contact-card-detail" style={{ color: 'var(--emerald)' }}>Operational (100%)</div>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleContactSubmit}>
              {formSubmitted ? (
                <div style={{ textAlign: 'center', color: 'var(--emerald)', padding: '20px 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✓</div>
                  <div style={{ fontWeight: 600 }}>Message Mock Sent!</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>Thank you. We will get back to you shortly.</div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="contact-name">Name</label>
                    <input 
                      id="contact-name"
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Aarif"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-email">Email Address</label>
                    <input 
                      id="contact-email"
                      type="email" 
                      className="form-input" 
                      placeholder="e.g. aarif@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-msg">Message</label>
                    <textarea 
                      id="contact-msg"
                      className="form-textarea" 
                      placeholder="Write your request..."
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn-primary" style={{ border: 'none', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'center' }}>
                    Submit Inquiry
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <a href="#/" className="header-brand">
                <div style={{
                  width: '28px', height: '28px',
                  background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
                  borderRadius: '7px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '13px', fontWeight: 800,
                  color: '#fff', boxShadow: '0 0 12px rgba(0,200,255,0.35)', flexShrink: 0
                }}>⚖</div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                  VERITY <span style={{ color: 'var(--cyan)' }}>AI</span>
                </span>
              </a>
              <p className="footer-brand-desc">
                Building autonomous financial reasoning engines. Powered by LangGraph and 8 parallel crawler workers.
              </p>
            </div>
            <div className="footer-col">
              <h5>Product</h5>
              <ul className="footer-links">
                <li><a href="#features" className="footer-link-a">Features</a></li>
                <li><a href="#pricing" className="footer-link-a">Pricing</a></li>
                <li><a href="#docs" className="footer-link-a">Developer API</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Developers</h5>
              <ul className="footer-links">
                <li><a href="#docs" className="footer-link-a">API Reference</a></li>
                <li><a href="https://github.com/veritylabs" className="footer-link-a" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href="#how-it-works" className="footer-link-a">System Architecture</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Corporate</h5>
              <ul className="footer-links">
                <li><a href="https://veritylabs.ai/" className="footer-link-a" target="_blank" rel="noopener noreferrer">About Verity</a></li>
                <li><a href="#support" className="footer-link-a">Contact Support</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} Verity AI Labs (InsideIIM Group). All rights reserved.</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#/" className="footer-link-a">Terms of Service</a>
              <a href="#/" className="footer-link-a">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
