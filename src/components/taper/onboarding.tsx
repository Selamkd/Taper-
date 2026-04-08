"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Turtle, PersonStanding, Zap, ArrowLeft } from "lucide-react";
import type { TaperProfile, ReductionSpeed, DurationOnMed } from "@/types";
import { findStageIndex } from "@/lib/taper-schedules";
import Button from "@/components/ui/button";

interface OnboardingProps {
  onComplete: (data: Omit<TaperProfile, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel?: () => void;
}

export default function Onboarding({ onComplete, onCancel }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [dose, setDose] = useState(30);
  const [duration, setDuration] = useState<DurationOnMed | "">("");
  const [speed, setSpeed] = useState<ReductionSpeed | "">("");
  const [submitting, setSubmitting] = useState(false);

  const recommended = useMemo<ReductionSpeed | null>(() => {
    if (!duration) return null;
    return duration === "over_5_years" ? "very_slow" : "slow";
  }, [duration]);

  async function handleComplete() {
    if (!name || !dose || !duration || !speed) return;
    setSubmitting(true);
    try {
      await onComplete({
        medicationName: name,
        startingDose: dose,
        currentDose: dose,
        durationOnMed: duration as DurationOnMed,
        reductionSpeed: speed as ReductionSpeed,
        startDate: new Date().toISOString().split("T")[0],
        currentStage: findStageIndex(dose, speed as ReductionSpeed),
        status: "active",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const slideProps = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
    transition: { duration: 0.18 },
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 bg-surface-2 border border-border-subtle rounded-2xl flex items-center justify-center">
          <Pill size={24} className="text-accent" />
        </div>
        <h1 className="text-xl font-bold text-zinc-200 mb-1">
          {onCancel ? "Add Medication" : "Taper Tracker"}
        </h1>
        <p className="text-xs text-zinc-600">
          {onCancel ? "Set up a new reduction schedule" : "Configure your reduction schedule"}
        </p>
      </div>

      <div className="flex justify-center gap-1.5 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === s ? "w-5 bg-accent" : step > s ? "w-1.5 bg-accent/40" : "w-1.5 bg-surface-3"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" {...slideProps} className="bg-surface-1 border border-border-subtle rounded-2xl p-6">
            <label className="block text-sm font-semibold text-zinc-300 mb-3">Medication name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Diazepam"
              className="w-full px-4 py-3 bg-surface-0 border border-border rounded-xl text-sm text-zinc-200 outline-none focus:border-accent/40 transition-colors"
            />
            <p className="text-[11px] text-zinc-600 mt-2 mb-5">Works with any benzodiazepine</p>
            <div className="flex gap-3">
              {onCancel && (
                <Button variant="ghost" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button variant="primary" disabled={!name.trim()} onClick={() => setStep(2)} className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" {...slideProps} className="bg-surface-1 border border-border-subtle rounded-2xl p-6">
            <label className="block text-sm font-semibold text-zinc-300 mb-3">Current daily dose</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={dose}
                onChange={(e) => setDose(Math.max(2.5, parseFloat(e.target.value) || 0))}
                min="2.5"
                max="100"
                step="2.5"
                className="flex-1 px-4 py-3 bg-surface-0 border border-border rounded-xl text-xl font-bold font-mono text-center text-zinc-200 outline-none focus:border-accent/40"
              />
              <span className="text-zinc-500 text-sm">mg</span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-2 mb-5">Total across all doses in the day</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft size={14} /> Back
              </Button>
              <Button variant="primary" disabled={!dose} onClick={() => setStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" {...slideProps} className="bg-surface-1 border border-border-subtle rounded-2xl p-6">
            <label className="block text-sm font-semibold text-zinc-300 mb-4">Duration on medication</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { id: "under_year" as const, label: "< 1 yr" },
                { id: "over_year" as const, label: "1–5 yrs" },
                { id: "over_5_years" as const, label: "5+ yrs" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDuration(opt.id)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    duration === opt.id
                      ? "bg-surface-2 border-border-strong text-zinc-200"
                      : "bg-surface-0 border-border-subtle text-zinc-500 hover:border-border"
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-600 mb-5">Longer use → slower taper recommended</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft size={14} /> Back
              </Button>
              <Button variant="primary" disabled={!duration} onClick={() => setStep(4)} className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" {...slideProps} className="bg-surface-1 border border-border-subtle rounded-2xl p-6">
            <label className="block text-sm font-semibold text-zinc-300 mb-4">Reduction pace</label>
            <div className="space-y-2 mb-4">
              {[
                { id: "very_slow" as const, icon: Turtle, label: "Very Slow", desc: "2+ weeks per stage" },
                { id: "slow" as const, icon: PersonStanding, label: "Slow", desc: "1–2 weeks per stage" },
                { id: "quick" as const, icon: Zap, label: "Faster", desc: "~22 weeks total" },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSpeed(opt.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      speed === opt.id
                        ? "bg-surface-2 border-border-strong"
                        : "bg-surface-0 border-border-subtle hover:border-border"
                    }`}
                  >
                    <Icon size={20} className={speed === opt.id ? "text-zinc-200" : "text-zinc-600"} />
                    <div className="flex-1">
                      <div className={`text-xs font-semibold ${speed === opt.id ? "text-zinc-200" : "text-zinc-400"}`}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-zinc-600">{opt.desc}</div>
                    </div>
                    {recommended === opt.id && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-accent bg-accent-glow px-2 py-0.5 rounded">
                        Rec
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-zinc-500 bg-surface-0 border border-border-subtle rounded-lg p-3 mb-5">
              You can change pace anytime from the Timeline tab
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
                <ArrowLeft size={14} /> Back
              </Button>
              <Button variant="primary" loading={submitting} disabled={!speed} onClick={handleComplete} className="flex-1">
                Start Tracking
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
