
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
  { id: "very_slow" as const, icon: Turtle, label: "Slow" },
  { id: "slow" as const, icon: PersonStanding, label: "Moderate" },
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
    if (el && scrollRef.current) {
      setTimeout(() => {
        const container = scrollRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollLeft =
          elRect.left - containerRect.left + container.scrollLeft - containerRect.width / 2 + elRect.width / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }, 150);
    }
  }, [profile.currentStage, profile.reductionSpeed]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card>
        {/* Progress + Speed Row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-accent tabular-nums">
              {completedPct}%
            </span>
            <span className="text-xs text-zinc-500">
              · {profile.currentStage + 1}/{schedule.length}
            </span>
          </div>

          <div className="flex gap-0.5 bg-surface-0 p-0.5 rounded-lg border border-border-subtle">
            {SPEED_OPTIONS.map((s) => {
              const Icon = s.icon;
              const active = profile.reductionSpeed === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSpeedChange(s.id)}
                  title={s.label}
                  className={`
                    w-8 h-8 rounded-md flex items-center justify-center transition-colors
                    ${active ? "bg-surface-2 text-zinc-200" : "text-zinc-600 hover:text-zinc-400"}
                  `}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completedPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-accent rounded-full"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-zinc-600">{maxDose}mg</span>
          <span className="text-[10px] font-mono text-zinc-600">0mg</span>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {schedule.length} stages
          </span>
        </div>

        <div
          ref={scrollRef}
          className="overflow-x-auto overscroll-x-contain scrollbar-none"
        >
          <div className="flex px-4 py-4 gap-1.5 min-w-max">
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.015, 0.3), duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  {/* Stage Pill */}
                  <div
                    className={`
                      relative w-16 rounded-lg border px-2 py-2.5 transition-colors
                      ${isCurrent
                        ? "bg-surface-1 border-accent/30"
                        : isDone
                          ? "bg-surface-0 border-border-subtle opacity-40"
                          : "bg-surface-0 border-border-subtle"
                      }
                    `}
                  >
             
                    {idx > 0 && drop > 0 && !isDone && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-zinc-500 bg-surface-0 px-1 rounded">
                        −{drop}
                      </span>
                    )}

                    <div className="text-center">
                      <span
                        className={`
                          font-semibold font-mono block leading-none
                          ${isCurrent ? "text-base text-zinc-100" : "text-sm text-zinc-400"}
                        `}
                      >
                        {stage.dose}
                      </span>
                      <span className="text-[9px] text-zinc-600 mt-0.5 block">
                        {stage.duration}
                      </span>
                    </div>
                  </div>

           
                  <div className="flex items-center mt-2">
           
                    <div
                      className={`
                        w-6 h-px
                        ${idx === 0 ? "bg-transparent" : isDone ? "bg-zinc-600" : "bg-zinc-800"}
                      `}
                    />

        
                    <div
                      className={`
                        w-5 h-5 rounded-full flex items-center justify-center border transition-colors
                        ${isCurrent
                          ? "bg-accent border-accent"
                          : isDone
                            ? "bg-surface-1 border-zinc-600"
                            : "bg-surface-0 border-zinc-700"
                        }
                      `}
                    >
                      {isDone ? (
                        <Check size={10} className="text-zinc-500" />
                      ) : isCurrent ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      ) : (
                        <span className="text-[8px] font-semibold text-zinc-600">
                          {idx + 1}
                        </span>
                      )}
                    </div>

             
                    <div
                      className={`
                        w-6 h-px
                        ${idx === schedule.length - 1
                          ? "bg-transparent"
                          : isDone
                            ? "bg-zinc-600"
                            : "bg-zinc-800"
                        }
                      `}
                    />
                  </div>

      
                  <span
                    className={`
                      mt-1.5 text-[9px] font-medium h-3
                      ${isCurrent ? "text-accent" : isNext ? "text-zinc-500" : "text-transparent"}
                    `}
                  >
                    {isCurrent ? "Now" : isNext ? "Next" : "·"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>

  
      {schedule[profile.currentStage] && (
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-1 border border-border-subtle flex items-center justify-center">
            <span className="text-sm font-bold font-mono text-accent">
              {schedule[profile.currentStage].dose}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-300 truncate">
              Stage {profile.currentStage + 1}
            </p>
            <p className="text-xs text-zinc-600 truncate">
              Hold for {schedule[profile.currentStage].duration}
            </p>
          </div>
          {profile.currentStage < schedule.length - 1 && (
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] uppercase tracking-wider text-zinc-600">Next</p>
              <p className="text-sm font-mono text-zinc-400">
                {schedule[profile.currentStage + 1].dose}mg
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}