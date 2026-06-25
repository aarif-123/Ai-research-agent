import React, { useState } from 'react';
import { getToneColor } from '../utils/colors';

interface NewsItem {
  headline: string;
  source?: string;
  date?: string;
  tone?: string;
  url?: string;
}

interface NewsSynthesis {
  positive: string[];
  negative: string[];
  summary: string;
}

interface NewsPanelProps {
  news: NewsItem[];
  newsSynthesis?: NewsSynthesis | null;
}

const NewsPanel: React.FC<NewsPanelProps> = ({ news, newsSynthesis }) => {
  const [isHeadlinesOpen, setIsHeadlinesOpen] = useState(false);

  if (news.length === 0) return null;

  const getToneBg = (tone: string) => {
    const t = tone?.toLowerCase() ?? '';
    if (t === 'positive' || t === 'bullish')
      return { background: 'hsla(145, 65%, 48%, 0.12)', color: 'hsl(145, 65%, 48%)' };
    if (t === 'negative' || t === 'bearish')
      return { background: 'hsla(0, 72%, 55%, 0.12)', color: 'hsl(0, 72%, 55%)' };
    return { background: 'hsla(40, 90%, 55%, 0.12)', color: 'hsl(40, 90%, 55%)' };
  };

  return (
    <div className="animate-fade-in-up delay-4">
      <div className="section-header">
        <span className="icon">📰</span>
        <h2>News & Sentiment Synthesis</h2>
      </div>
      <div className="section-divider" />

      {/* Synthesized news highlights */}
      {newsSynthesis && (
        <div className="news-synthesis-card">
          <div className="news-synthesis-summary">
            {newsSynthesis.summary}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {newsSynthesis.positive.length > 0 && (
              <div className="news-signal-column">
                <div className="news-signal-title positive">▲ Bullish Indicators</div>
                <ul className="news-signal-list positive">
                  {newsSynthesis.positive.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {newsSynthesis.negative.length > 0 && (
              <div className="news-signal-column" style={{ marginTop: '4px' }}>
                <div className="news-signal-title negative">▼ Bearish Indicators</div>
                <ul className="news-signal-list negative">
                  {newsSynthesis.negative.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible raw headlines */}
      <div style={{ marginTop: '12px' }}>
        <button
          onClick={() => setIsHeadlinesOpen(!isHeadlinesOpen)}
          style={{
            width: '100%',
            background: 'hsla(220, 15%, 20%, 0.3)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            padding: '8px 12px',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'background var(--transition-fast)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'hsla(220, 15%, 25%, 0.4)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'hsla(220, 15%, 20%, 0.3)'}
        >
          <span>Source Headlines ({news.length})</span>
          <span>{isHeadlinesOpen ? '▼' : '▶'}</span>
        </button>

        {isHeadlinesOpen && (
          <div style={{ marginTop: '8px', padding: '0 4px' }}>
            {news.map((item, i) => {
              const toneStyle = getToneBg(item.tone ?? 'neutral');
              return (
                <div className="news-item" key={i}>
                  <div
                    className="news-stripe"
                    style={{ background: getToneColor(item.tone ?? 'neutral') }}
                  />
                  <div className="news-content">
                    <div className="news-headline" style={{ fontSize: '0.78rem' }}>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.headline}
                        </a>
                      ) : (
                        item.headline
                      )}
                    </div>
                    <div className="news-meta">
                      {item.source && (
                        <span className="news-source">{item.source}</span>
                      )}
                      {item.date && <span>· {item.date}</span>}
                      {item.tone && (
                        <span className="news-tone" style={toneStyle}>
                          {item.tone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPanel;
