import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-zinc-700 mb-4">{icon}</div>
      <h3 className="text-zinc-300 text-sm font-semibold mb-1">{title}</h3>
      <p className="text-zinc-600 text-xs max-w-[240px] mb-5">{description}</p>
      {action}
    </div>
  );
}
