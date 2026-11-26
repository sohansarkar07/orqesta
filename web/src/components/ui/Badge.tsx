import type { ReactNode } from 'react';

type Variant = 'ok' | 'warn' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
}

const styles: Record<Variant, React.CSSProperties> = {
  ok:      { background: 'var(--status-ok-bg)',   color: 'var(--status-ok)',    border: '1px solid #C2D9BC' },
  warn:    { background: 'var(--status-warn-bg)',  color: 'var(--status-warn)',  border: '1px solid #D9C88C' },
  error:   { background: 'var(--status-err-bg)',   color: 'var(--status-error)', border: '1px solid #D9BCBC' },
  info:    { background: 'var(--ivory-mid)',        color: 'var(--ink-700)',      border: 'var(--border)' },
  neutral: { background: 'var(--ivory)',            color: 'var(--ink-500)',      border: 'var(--border)' },
};

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '100px',
      fontSize: '11px',
      fontWeight: 500,
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)',
      ...styles[variant],
    }}>
      {children}
    </span>
  );
}
