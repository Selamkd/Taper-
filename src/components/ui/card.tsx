import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
}

export default function Card({ children, glow, className = "", ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-border-subtle bg-surface-1 p-5
        ${glow ? "shadow-lg shadow-accent-glow border-accent-dim/20" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
