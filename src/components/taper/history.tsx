"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Flame, Target, Calendar, TrendingDown } from "lucide-react";
import type { DoseLog } from "@/types";
import Card from "@/components/ui/card";

interface HistoryProps {
  profileId: string;
}

function adherencePct(taken: number, target: number): number {
  if (target === 0) return 100;
  return Math.min(Math.round((taken / target) * 100), 100);
}

function statusLabel(pct: number, isOver: boolean): { label: string; className: string } {
  if (isOver) return { label: "Over", className: "text-amber-400 bg-amber-500/10 border-amber-500/10" };
  if (pct >= 95) return { label: "On target", className: "text-indigo-400 bg-indigo-500/10 border-indigo-500/10" };
  if (pct >= 75) return { label: "Close", className: "text-violet-400 bg-violet-500/10 border-violet-500/10" };
  if (pct === 0) return { label: "Missed", className: "text-zinc-500 bg-zinc-500/10 border-zinc-500/10" };
  return { label: "Partial", className: "text-amber-400 bg-amber-500/10 border-amber-500/10" };
}

const SLOT_ICONS: Record<string, string> = {
  morning: "☀️",
  afternoon: "🌤",
  evening: "🌅",
  night: "🌙",
};

export default function History({ profileId }: HistoryProps) {
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/taper/logs?profileId=${profileId}`)
      .then((r) => r.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profileId]);

  const stats = useMemo(() => {
    const total = logs.length;
    const onTarget = logs.filter((l) => adherencePct(l.takenDose, l.targetDose) >= 95).length;
    let streak = 0;
    for (const log of logs) {
      if (adherencePct(log.takenDose, log.targetDose) >= 95) streak++;
      else break;
    }
    const avg = total > 0 ? logs.reduce((s, l) => s + l.takenDose, 0) / total : 0;
    return { total, onTarget, streak, avg };
  }, [logs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-border-subtle border-t-accent animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Calendar size={28} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-sm text-zinc-500">No logs yet</p>
          <p className="text-xs text-zinc-700 mt-1">Save today's dose to start tracking</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Logged", value: stats.total, icon: Calendar },
          { label: "On target", value: stats.onTarget, icon: Target },
          { label: "Streak", value: `${stats.streak}d`, icon: Flame },
          { label: "Avg dose", value: `${stats.avg.toFixed(1)}`, icon: TrendingDown },
        ].map((s) => (
          <Card key={s.label} className="!p-3">
            <s.icon size={13} className="text-zinc-600 mb-1.5" />
            <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-0.5">
              {s.label}
            </div>
            <div className="text-sm font-bold font-mono text-zinc-300">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="space-y-1">
        {logs.map((log, idx) => {
          const pct = adherencePct(log.takenDose, log.targetDose);
          const isOver = log.takenDose > log.targetDose;
          const status = statusLabel(pct, isOver);
          const isExp = expanded === log.id;
          const barWidth = isOver ? 100 : Math.min((log.takenDose / Math.max(log.targetDose, 1)) * 100, 100);

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.025, 0.3) }}
            >
              <button
                onClick={() => setExpanded(isExp ? null : log.id)}
                className={`
                  w-full text-left rounded-xl border p-3 transition-all
                  ${isExp ? "bg-surface-1 border-border rounded-b-none" : "bg-surface-0 border-border-subtle hover:border-border"}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    {new Date(log.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold font-mono text-zinc-400">
                      {log.takenDose.toFixed(1)}
                      <span className="text-zinc-600 font-normal">/{log.targetDose}mg</span>
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${status.className}`}>
                      {status.label}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-zinc-600 transition-transform ${isExp ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
                <div className="h-0.5 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.4, delay: idx * 0.02 }}
                    className={`h-full rounded-full ${
                      isOver
                        ? "bg-gradient-to-r from-indigo-500 to-amber-400"
                        : pct >= 95
                          ? "bg-gradient-to-r from-indigo-700 to-indigo-400"
                          : "bg-gradient-to-r from-indigo-700 to-violet-400"
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isExp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-surface-0 border border-t-0 border-border rounded-b-xl p-3">
                      {log.entries.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {(["morning", "afternoon", "evening", "night"] as const).map((slot) => {
                            const entry = log.entries.find((e) => e.time === slot);
                            const amount = entry?.amount ?? 0;
                            return (
                              <div
                                key={slot}
                                className={`rounded-lg border p-2 text-center ${
                                  amount > 0
                                    ? "bg-surface-1 border-border-subtle"
                                    : "bg-surface-0 border-border-subtle opacity-30"
                                }`}
                              >
                                <div className="text-sm mb-0.5">{SLOT_ICONS[slot]}</div>
                                <div className="text-[8px] font-bold uppercase tracking-wide text-zinc-600 mb-1">
                                  {slot}
                                </div>
                                <div className="text-xs font-bold font-mono text-zinc-300">
                                  {amount.toFixed(1)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600">No breakdown recorded</p>
                      )}
                      {log.notes && (
                        <div className="mt-3 p-2.5 bg-surface-1 rounded-lg border border-border-subtle">
                          <p className="text-xs text-zinc-400">{log.notes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
