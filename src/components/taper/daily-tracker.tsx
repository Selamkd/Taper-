"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Save, Check, AlertTriangle } from "lucide-react";
import type { TaperProfile, DoseLog, TimeSlotId } from "@/types";
import { getScheduleFromDose } from "@/lib/taper-schedules";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

interface TimeSlot {
  id: TimeSlotId;
  label: string;
  icon: typeof import("lucide-react").Sun;
}

const SLOTS: { id: TimeSlotId; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
];

const SLOT_ICONS: Record<TimeSlotId, string> = {
  morning: "☀️",
  afternoon: "🌤",
  evening: "🌅",
  night: "🌙",
};

interface DailyTrackerProps {
  profile: TaperProfile;
  todayLog: DoseLog | null;
  onSave: (data: {
    takenDose: number;
    targetDose: number;
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  }) => Promise<void>;
}

export default function DailyTracker({ profile, todayLog, onSave }: DailyTrackerProps) {
  const schedule = useMemo(
    () => getScheduleFromDose(profile.startingDose, profile.reductionSpeed),
    [profile.startingDose, profile.reductionSpeed]
  );
  const targetDose = schedule[profile.currentStage]?.dose ?? 0;

  const [amounts, setAmounts] = useState<Record<TimeSlotId, number>>({
    morning: todayLog?.entries.find((e) => e.time === "morning")?.amount ?? 0,
    afternoon: todayLog?.entries.find((e) => e.time === "afternoon")?.amount ?? 0,
    evening: todayLog?.entries.find((e) => e.time === "evening")?.amount ?? 0,
    night: todayLog?.entries.find((e) => e.time === "night")?.amount ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = Object.values(amounts).reduce((s, v) => s + v, 0);
  const isOver = total > targetDose;
  const isOnTarget = total > 0 && total <= targetDose;
  const pct = targetDose > 0 ? Math.min((total / targetDose) * 100, 100) : 0;

  function updateSlot(id: TimeSlotId, delta: number) {
    setAmounts((prev) => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta),
    }));
    setSaved(false);
  }

  function quickAdd() {
    const h = new Date().getHours();
    let slot: TimeSlotId = "morning";
    if (h >= 12 && h < 17) slot = "afternoon";
    else if (h >= 17 && h < 21) slot = "evening";
    else if (h >= 21 || h < 6) slot = "night";
    updateSlot(slot, 2.5);
  }

  function quickRemove() {
    const last = [...SLOTS].reverse().find((s) => amounts[s.id] > 0);
    if (last) updateSlot(last.id, -2.5);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        takenDose: total,
        targetDose,
        morning: amounts.morning,
        afternoon: amounts.afternoon,
        evening: amounts.evening,
        night: amounts.night,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const fillColor = isOver
    ? "from-indigo-600 via-amber-500 to-red-500"
    : total >= targetDose
      ? "from-indigo-600 via-indigo-400 to-violet-300"
      : "from-indigo-700 via-indigo-500 to-indigo-400";

  return (
    <div className="space-y-4">
      <Card glow={isOnTarget && total >= targetDose}>
        <div className="relative h-12 bg-surface-3 rounded-2xl overflow-hidden mb-6">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-surface-4 z-10" />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className={`h-full rounded-2xl bg-gradient-to-r ${fillColor} shadow-lg shadow-indigo-500/20`}
          >
            <div className="absolute inset-x-1 top-1 h-3 bg-gradient-to-b from-white/20 to-transparent rounded-xl" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5">
              <span className="text-sm font-bold font-mono text-white">
                {total.toFixed(1)}
                <span className="text-zinc-500 font-normal"> / {targetDose}mg</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={quickRemove}
            disabled={total <= 0}
            className="w-12 h-12 rounded-xl border border-border bg-surface-2 text-zinc-400 
                       flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed
                       hover:bg-surface-3 transition-colors"
          >
            <Minus size={18} />
          </motion.button>

          <div className="flex flex-col items-center px-5 py-2 bg-surface-0 rounded-xl border border-border-subtle">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Step</span>
            <span className="text-sm font-mono font-semibold text-zinc-400">2.5mg</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={quickAdd}
            className="w-12 h-12 rounded-xl border border-border bg-surface-2 text-zinc-400 
                       flex items-center justify-center hover:bg-surface-3 transition-colors"
          >
            <Plus size={18} />
          </motion.button>
        </div>

        <div className="bg-surface-0 rounded-xl border border-border-subtle p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-3 px-1">
            Time Distribution
          </p>
          <div className="grid grid-cols-4 gap-2">
            {SLOTS.map((slot) => {
              const val = amounts[slot.id];
              const active = val > 0;
              return (
                <div
                  key={slot.id}
                  className={`
                    rounded-xl border p-2.5 text-center transition-all duration-200
                    ${active ? "bg-surface-1 border-border" : "bg-surface-0 border-border-subtle"}
                  `}
                >
                  <div className={`text-base mb-1 ${active ? "" : "grayscale opacity-30"}`}>
                    {SLOT_ICONS[slot.id]}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-zinc-600 mb-2">
                    {slot.label}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => updateSlot(slot.id, -2.5)}
                      disabled={val <= 0}
                      className="w-5 h-5 rounded text-[11px] border border-border-subtle bg-surface-0 text-zinc-500
                                 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className={`min-w-[30px] text-xs font-bold font-mono ${active ? "text-zinc-200" : "text-zinc-700"}`}>
                      {val.toFixed(1)}
                    </span>
                    <button
                      onClick={() => updateSlot(slot.id, 2.5)}
                      className="w-5 h-5 rounded text-[11px] border border-border-subtle bg-surface-0 text-zinc-500
                                 flex items-center justify-center hover:text-zinc-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs"
          >
            <AlertTriangle size={14} />
            Over target today — that's okay. Fresh start tomorrow.
          </motion.div>
        )}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 text-xs"
          >
            <Check size={14} />
            Saved to Notion
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="primary"
        loading={saving}
        onClick={handleSave}
        className="w-full"
      >
        <Save size={15} />
        {todayLog ? "Update Log" : "Save Log"}
      </Button>
    </div>
  );
}
