"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Turtle, PersonStanding, Zap, Check } from "lucide-react";
import type { TaperProfile } from "@/types";
import { getScheduleFromDose } from "@/lib/taper-schedules";
import type { ReductionSpeed } from "@/types";
import Card from "@/components/ui/card";

interface TimelineProps {
  profile: TaperProfile;
  onSpeedChange: (speed: ReductionSpeed) => void;
}

const SPEED_OPTIONS = [
  { id: "very_slow" as const, icon: Turtle, label: "Very Slow" },
  { id: "slow" as const, icon: PersonStanding, label: "Slow" },
  { id: "quick" as const, icon: Zap, label: "Faster" },
];

export default function Timeline({ profile, onSpeedChange }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const schedule = useMemo(
    () => getScheduleFromDose(profile.startingDose, profile.reductionSpeed),
    [profile.startingDose, profile.reductionSpeed]
  );
  const maxDose = schedule[0]?.dose ?? profile.startingDose;
  const completedPct =
    schedule.length > 1
      ? Math.round((profile.currentStage / (schedule.length - 1)) * 100)
      : 0;

  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-current='true']") as HTMLElement | null;
    if (el) setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 150);
  }, [profile.currentStage, profile.reductionSpeed]);

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-zinc-400">
              {SPEED_OPTIONS.find((s) => s.id === profile.reductionSpeed)?.label}
            </p>
            <p className="text-[10px] text-zinc-600">{schedule.length} stages total</p>
          </div>
          <div className="flex gap-1 bg-surface-0 p-1 rounded-lg border border-border-subtle">
            {SPEED_OPTIONS.map((s) => {
              const Icon = s.icon;
              const active = profile.reductionSpeed === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSpeedChange(s.id)}
                  title={s.label}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                    active
                      ? "bg-surface-3 text-zinc-200"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Journey
            </span>
            <span className="text-xs font-bold font-mono text-accent">
              {completedPct}%
            </span>
          </div>
          <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completedPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-600 to-violet-300 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] font-mono text-zinc-700">{maxDose}mg</span>
            <span className="text-[10px] font-mono text-zinc-700">0mg</span>
          </div>
        </div>
      </Card>

      <div ref={scrollRef} className="max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
        <div className="relative">
          <div className="absolute left-[18px] top-5 bottom-5 w-px bg-gradient-to-b from-border-subtle to-transparent" />

          {schedule.map((stage, idx) => {
            const isCurrent = idx === profile.currentStage;
            const isDone = idx < profile.currentStage;
            const isNext = idx === profile.currentStage + 1;
            const prevDose = idx > 0 ? schedule[idx - 1].dose : stage.dose;
            const drop = +(prevDose - stage.dose).toFixed(1);

            return (
              <motion.div
                key={idx}
                data-current={isCurrent}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.012, 0.25), duration: 0.18 }}
                className="flex items-start gap-3 pb-1.5 relative z-10"
              >
                <div
                  className={`
                    w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                    text-xs font-bold border-[1.5px] transition-all
                    ${isCurrent
                      ? "bg-surface-1 border-accent-dim/30 text-accent shadow-md shadow-accent-glow"
                      : isDone
                        ? "bg-surface-0 border-border-subtle text-zinc-700"
                        : "bg-surface-0 border-border-subtle text-zinc-700"
                    }
                  `}
                >
                  {isDone ? (
                    <Check size={13} className="text-zinc-600" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  ) : (
                    <span className="text-[10px]">{idx + 1}</span>
                  )}
                </div>

                <div
                  className={`
                    flex-1 rounded-xl border p-3 mt-1 transition-all min-w-0
                    ${isCurrent
                      ? "bg-surface-1 border-border"
                      : "bg-surface-0 border-border-subtle"
                    }
                    ${isDone ? "opacity-30" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`
                        font-bold font-mono leading-none transition-all
                        ${isCurrent ? "text-lg text-zinc-100" : "text-sm text-zinc-500"}
                      `}
                    >
                      {stage.dose}
                      <span className={`font-normal ml-0.5 ${isCurrent ? "text-xs text-zinc-500" : "text-[10px] text-zinc-600"}`}>
                        mg
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      {idx > 0 && drop > 0 && !isDone && (
                        <span className="text-[10px] font-mono font-semibold text-zinc-600 bg-surface-0 border border-border-subtle px-1.5 py-0.5 rounded">
                          −{drop}mg
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-zinc-600">
                        {stage.duration}
                      </span>
                      {isNext && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                          Next
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
