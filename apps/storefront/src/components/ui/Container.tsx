import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}

export function Container({ children, className = '', narrow }: ContainerProps) {
  return (
    <div
      className={`page-shell min-w-0 py-8 md:py-10 ${narrow ? 'max-w-4xl' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
