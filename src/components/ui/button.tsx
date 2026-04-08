"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent-dim text-white hover:bg-accent border-accent-dim/50 shadow-md shadow-accent-glow",
  secondary:
    "bg-surface-3 text-zinc-300 hover:bg-surface-4 border-border",
  ghost:
    "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-surface-2 border-transparent",
  danger:
    "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", loading, disabled, children, className = "", ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5
          text-sm font-semibold transition-all duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variantStyles[variant]} ${className}
        `}
        {...(props as any)}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
