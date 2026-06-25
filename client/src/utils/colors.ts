export type VerdictDecision = 'INVEST' | 'PASS' | 'HOLD' | 'STREAMING' | 'IDLE';

export const verdictColors: Record<VerdictDecision, string> = {
  INVEST: 'hsl(145, 65%, 48%)',
  PASS: 'hsl(0, 72%, 55%)',
  HOLD: 'hsl(40, 90%, 55%)',
  STREAMING: 'hsl(210, 90%, 60%)',
  IDLE: 'hsl(220, 10%, 45%)',
};

export const verdictGlow: Record<VerdictDecision, string> = {
  INVEST: '0 0 60px hsla(145, 65%, 48%, 0.5), 0 0 120px hsla(145, 65%, 48%, 0.2)',
  PASS: '0 0 60px hsla(0, 72%, 55%, 0.5), 0 0 120px hsla(0, 72%, 55%, 0.2)',
  HOLD: '0 0 60px hsla(40, 90%, 55%, 0.5), 0 0 120px hsla(40, 90%, 55%, 0.2)',
  STREAMING: '0 0 40px hsla(210, 90%, 60%, 0.4), 0 0 80px hsla(210, 90%, 60%, 0.15)',
  IDLE: '0 0 20px hsla(220, 10%, 45%, 0.2)',
};

export const verdictBg: Record<VerdictDecision, string> = {
  INVEST: 'radial-gradient(circle, hsla(145, 65%, 48%, 0.15) 0%, transparent 70%)',
  PASS: 'radial-gradient(circle, hsla(0, 72%, 55%, 0.15) 0%, transparent 70%)',
  HOLD: 'radial-gradient(circle, hsla(40, 90%, 55%, 0.15) 0%, transparent 70%)',
  STREAMING: 'radial-gradient(circle, hsla(210, 90%, 60%, 0.1) 0%, transparent 70%)',
  IDLE: 'radial-gradient(circle, hsla(220, 10%, 45%, 0.05) 0%, transparent 70%)',
};

export function getScoreColor(score: number): string {
  if (score < 40) return 'hsl(0, 72%, 55%)';
  if (score < 65) return 'hsl(40, 90%, 55%)';
  return 'hsl(145, 65%, 48%)';
}

export function getToneColor(tone: string): string {
  const t = tone?.toLowerCase() ?? '';
  if (t === 'positive' || t === 'bullish') return 'hsl(145, 65%, 48%)';
  if (t === 'negative' || t === 'bearish') return 'hsl(0, 72%, 55%)';
  return 'hsl(40, 90%, 55%)';
}
