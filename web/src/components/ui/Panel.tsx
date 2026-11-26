import type { ReactNode, CSSProperties } from 'react';

interface PanelProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Panel({ children, style }: PanelProps) {
  return (
    <div style={{
      background: 'var(--white)',
      border: 'var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}
