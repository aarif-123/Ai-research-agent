import { useState, useRef, useCallback } from 'react';

/* ── Event payload types ── */
export interface PlanReadyPayload {
  ticker: string;
  company: string;
  plan: string[];
}

export interface ToolResultPayload {
  tool: string;
  status: 'success' | 'error';
  data?: Record<string, unknown>;
}

export interface SynthesisPayload {
  evidence: {
    scores?: Record<string, { value: number; reason: string }>;
    risks?: Array<{ title: string; severity: string; description: string }>;
    news?: Array<{
      headline: string;
      source?: string;
      date?: string;
      tone?: string;
      url?: string;
    }>;
    newsSynthesis?: {
      positive: string[];
      negative: string[];
      summary: string;
    };
    keyMetrics?: Record<string, string | number>;
  };
}

export interface VerdictPayload {
  verdict: {
    decision: 'INVEST' | 'PASS' | 'HOLD';
    score: number;
    rationale: string;
    positionSizing?: string;
    committeeVotes: Record<string, 'INVEST' | 'PASS' | 'HOLD'>;
    keyWhy: string[];
    keyRisks: string[];
  };
}

export interface LogEntry {
  time: string;
  node: string;
  message: string;
  isError?: boolean;
  data?: any;
}

export type AnalysisPhase = 'idle' | 'streaming' | 'done' | 'error';

export interface AnalysisState {
  phase: AnalysisPhase;
  ticker: string;
  company: string;
  plan: string[];
  logs: LogEntry[];
  scores: Record<string, { value: number; reason: string }>;
  risks: Array<{ title: string; severity: string; description: string }>;
  news: Array<{
    headline: string;
    source?: string;
    date?: string;
    tone?: string;
    url?: string;
  }>;
  newsSynthesis: {
    positive: string[];
    negative: string[];
    summary: string;
  } | null;
  keyMetrics: Record<string, string | number>;
  verdict: {
    decision: 'INVEST' | 'PASS' | 'HOLD';
    score: number;
    rationale: string;
    positionSizing?: string;
    committeeVotes: Record<string, 'INVEST' | 'PASS' | 'HOLD'>;
    keyWhy: string[];
    keyRisks: string[];
  } | null;
  error: string | null;
}

const INITIAL_STATE: AnalysisState = {
  phase: 'idle',
  ticker: '',
  company: '',
  plan: [],
  logs: [],
  scores: {},
  risks: [],
  news: [],
  newsSynthesis: null,
  keyMetrics: {},
  verdict: null,
  error: null,
};

function now(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);
  const esRef = useRef<EventSource | null>(null);

  const addLog = useCallback((node: string, message: string, isError = false, data?: any) => {
    setState((s) => ({
      ...s,
      logs: [...s.logs, { time: now(), node, message, isError, data }],
    }));
  }, []);

  const analyze = useCallback(
    (company: string) => {
      // Close any existing connection
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      // Reset state
      setState({
        ...INITIAL_STATE,
        phase: 'streaming',
        company,
      });

      const savedBase = localStorage.getItem('VITE_API_BASE_URL');
      const apiBase = savedBase !== null 
        ? savedBase 
        : (import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'http://localhost:3001'));
      const url = `${apiBase}/api/analyze?company=${encodeURIComponent(company)}`;
      const es = new EventSource(url);
      esRef.current = es;

      addLog('SYSTEM', `Starting analysis for "${company}"...`);

      es.addEventListener('plan_ready', (e: MessageEvent) => {
        try {
          const data: PlanReadyPayload = JSON.parse(e.data);
          setState((s) => ({
            ...s,
            ticker: data.ticker,
            company: data.company,
            plan: data.plan,
          }));
          addLog('PLANNER', `Ticker: ${data.ticker} — ${data.plan.length} steps planned`);
          data.plan.forEach((step, i) => {
            addLog('PLANNER', `Step ${i + 1}: ${step}`);
          });
        } catch {
          /* ignore */
        }
      });

      es.addEventListener('tool_result', (e: MessageEvent) => {
        try {
          const data: ToolResultPayload = JSON.parse(e.data);
          const isErr = data.status === 'error';
          addLog(
            data.tool,
            data.status === 'success' ? '✓ completed' : '✗ failed',
            isErr,
            data.data
          );
        } catch {
          /* ignore */
        }
      });

      es.addEventListener('synthesis_done', (e: MessageEvent) => {
        try {
          const data: SynthesisPayload = JSON.parse(e.data);
          setState((s) => ({
            ...s,
            scores: data.evidence.scores ?? {},
            risks: data.evidence.risks ?? [],
            news: data.evidence.news ?? [],
            newsSynthesis: data.evidence.newsSynthesis ?? null,
            keyMetrics: data.evidence.keyMetrics ?? {},
          }));
          addLog('SYNTHESIS', 'Evidence synthesis complete');
        } catch {
          /* ignore */
        }
      });

      es.addEventListener('verdict_final', (e: MessageEvent) => {
        try {
          const data: VerdictPayload = JSON.parse(e.data);
          setState((s) => ({
            ...s,
            verdict: data.verdict,
          }));
          addLog('VERDICT', `Decision: ${data.verdict.decision} (Score: ${data.verdict.score})`);
        } catch {
          /* ignore */
        }
      });

      es.addEventListener('done', () => {
        setState((s) => ({ ...s, phase: 'done' }));
        addLog('SYSTEM', 'Analysis complete ✓');
        es.close();
        esRef.current = null;
      });

      es.onerror = () => {
        setState((s) => ({
          ...s,
          phase: 'error',
          error: 'Connection lost. Please try again.',
        }));
        addLog('SYSTEM', 'Connection error', true);
        es.close();
        esRef.current = null;
      };
    },
    [addLog]
  );

  const reset = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  const load = useCallback((historicalState: AnalysisState) => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setState(historicalState);
  }, []);

  return { state, analyze, reset, load };
}
