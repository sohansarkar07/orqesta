import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    letterSpacing: '0.01em',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
  };

  const sizes = {
    sm: { fontSize: '12px', padding: '6px 14px' },
    md: { fontSize: '14px', padding: '10px 20px' },
    lg: { fontSize: '15px', padding: '14px 28px' },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--ink-900)', color: 'var(--ivory)', border: '1px solid var(--ink-900)' },
    secondary: { background: 'var(--white)',   color: 'var(--ink-900)', border: 'var(--border)' },
    ghost:     { background: 'transparent',    color: 'var(--ink-700)', border: '1px solid transparent' },
  };

  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  );
}
