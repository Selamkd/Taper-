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
  if (isOver) return { label: "Over", className: "text-amber-400" };
  if (pct >= 95) return { label: "On target", className: "text-accent" };
  if (pct >= 75) return { label: "Close", className: "text-zinc-400" };
  if (pct === 0) return { label: "Missed", className: "text-zinc-600" };
  return { label: "Partial", className: "text-zinc-500" };
}

const SLOTS = [
  { key: "morning", label: "AM", icon: "☀️" },
  { key: "afternoon", label: "Noon", icon: "🌤" },
  { key: "evening", label: "PM", icon: "🌅" },
  { key: "night", label: "Night", icon: "🌙" },
] as const;

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
        <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-accent animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <div className="text-center py-10">
          <Calendar size={24} className="mx-auto mb-2 text-zinc-700" />
          <p className="text-sm text-zinc-500">No logs yet</p>
          <p className="text-xs text-zinc-600 mt-1">Save today's dose to start tracking</p>
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
          { label: "Avg", value: `${stats.avg.toFixed(1)}`, icon: TrendingDown },
        ].map((s) => (
          <Card key={s.label} className="!p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={11} className="text-zinc-600" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                {s.label}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-zinc-300">{s.value}</div>
          </Card>
        ))}
      </div>

   
      <Card className="!p-0 overflow-hidden divide-y divide-border-subtle">
        {logs.map((log, idx) => {
          const pct = adherencePct(log.takenDose, log.targetDose);
          const isOver = log.takenDose > log.targetDose;
          const status = statusLabel(pct, isOver);
          const isExp = expanded === log.id;

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(idx * 0.02, 0.2) }}
            >
              <button
                onClick={() => setExpanded(isExp ? null : log.id)}
                className={`
                  w-full text-left px-4 py-3 transition-colors
                  ${isExp ? "bg-surface-1" : "hover:bg-surface-0"}
                `}
              >
                <div className="flex items-center gap-3">
              
                  <div className="w-10 flex-shrink-0">
                    <div className="text-sm font-bold text-zinc-300">
                      {new Date(log.date).getDate()}
                    </div>
                    <div className="text-[9px] font-medium text-zinc-600 uppercase">
                      {new Date(log.date).toLocaleDateString("en-GB", { month: "short" })}
                    </div>
                  </div>

             
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-sm font-semibold font-mono text-zinc-300">
                        {log.takenDose.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        / {log.targetDose}mg
                      </span>
                    </div>
                    <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.4, delay: idx * 0.015 }}
                        className={`h-full rounded-full ${isOver ? "bg-amber-500" : "bg-accent"}`}
                      />
                    </div>
                  </div>

             
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-zinc-600 transition-transform ${isExp ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
              </button>

             
              <AnimatePresence>
                {isExp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1">
                    
                      {log.entries.length > 0 ? (
                        <div className="flex gap-1.5">
                          {SLOTS.map((slot) => {
                            const entry = log.entries.find((e) => e.time === slot.key);
                            const amount = entry?.amount ?? 0;
                            const hasValue = amount > 0;

                            return (
                              <div
                                key={slot.key}
                                className={`
                                  flex-1 rounded-lg border p-2 text-center transition-opacity
                                  ${hasValue
                                    ? "bg-surface-1 border-border-subtle"
                                    : "bg-surface-0 border-border-subtle opacity-30"
                                  }
                                `}
                              >
                                <div className="text-xs mb-0.5">{slot.icon}</div>
                                <div className="text-[8px] font-semibold uppercase tracking-wide text-zinc-600">
                                  {slot.label}
                                </div>
                                <div className="text-xs font-bold font-mono text-zinc-300 mt-0.5">
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
                        <div className="mt-2 px-3 py-2 bg-surface-0 rounded-lg border border-border-subtle">
                          <p className="text-xs text-zinc-400 leading-relaxed">{log.notes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </Card>
    </div>
  );
}