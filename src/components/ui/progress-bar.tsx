"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValues?: boolean;
  color?: "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

const colorMap = {
  accent: "from-indigo-600 to-indigo-400",
  success: "from-emerald-600 to-emerald-400",
  warning: "from-amber-600 to-amber-400",
  danger: "from-red-600 to-red-400",
};

const bgMap = {
  accent: "shadow-indigo-500/20",
  success: "shadow-emerald-500/20",
  warning: "shadow-amber-500/20",
  danger: "shadow-red-500/20",
};

export default function ProgressBar({
  value,
  max,
  label,
  showValues = true,
  color = "accent",
  size = "md",
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const height = size === "sm" ? "h-1.5" : "h-3";

  return (
    <div>
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-xs font-medium text-zinc-500">{label}</span>
          )}
          {showValues && (
            <span className="text-xs font-mono text-zinc-400">
              {value.toFixed(1)}
              <span className="text-zinc-600"> / {max}mg</span>
            </span>
          )}
        </div>
      )}
      <div className={`${height} bg-surface-3 rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className={`
            h-full rounded-full bg-gradient-to-r ${colorMap[color]}
            shadow-md ${bgMap[color]}
          `}
        />
      </div>
    </div>
  );
}
