"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Pill, Clock, TrendingDown, CalendarDays, Plus } from "lucide-react";
import type { TaperProfile } from "@/types";
import { getScheduleFromDose } from "@/lib/taper-schedules";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

const SPEED_LABELS: Record<string, string> = {
  very_slow: "Very Slow",
  slow: "Slow",
  quick: "Quick",
};

const DURATION_LABELS: Record<string, string> = {
  under_year: "Under 1 year",
  over_year: "1–5 years",
  over_5_years: "5+ years",
};

interface ProfilePanelProps {
  profile: TaperProfile;
  onAddProfile: () => void;
}

export default function ProfilePanel({ profile, onAddProfile }: ProfilePanelProps) {
  const schedule = useMemo(
    () => getScheduleFromDose(profile.startingDose, profile.reductionSpeed),
    [profile.startingDose, profile.reductionSpeed]
  );

  const weeksIn = useMemo(() => {
    if (!profile.startDate) return 0;
    const ms = Date.now() - new Date(profile.startDate).getTime();
    return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
  }, [profile.startDate]);

  const totalWeeks = schedule.reduce((s, st) => s + Math.ceil(st.durationDays / 7), 0);
  const estWeeksLeft = Math.max(0, totalWeeks - weeksIn);
  const progressPct = totalWeeks > 0 ? Math.min(Math.round((weeksIn / totalWeeks) * 100), 100) : 0;

  const rows = [
    { label: "Medication", value: profile.medicationName },
    { label: "Starting dose", value: `${profile.startingDose}mg`, mono: true },
    { label: "Current dose", value: `${profile.currentDose}mg`, mono: true, accent: true },
    { label: "Stage", value: `${profile.currentStage + 1} of ${schedule.length}` },
    { label: "Pace", value: SPEED_LABELS[profile.reductionSpeed] ?? profile.reductionSpeed },
    { label: "On medication", value: DURATION_LABELS[profile.durationOnMed] ?? profile.durationOnMed },
    { label: "Taper started", value: profile.startDate ? new Date(profile.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
    { label: "Weeks in", value: `${weeksIn} wks` },
    { label: "Est. remaining", value: estWeeksLeft > 0 ? `~${estWeeksLeft} wks` : "Nearly done!" },
    { label: "Status", value: profile.status.charAt(0).toUpperCase() + profile.status.slice(1) },
  ];

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center">
            <Pill size={22} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-zinc-200">{profile.medicationName}</h3>
            <p className="text-xs text-zinc-600">
              {profile.startingDose}mg → {profile.currentDose}mg → 0mg
            </p>
          </div>
        </div>

        <div className="h-1 bg-surface-3 rounded-full overflow-hidden mb-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-indigo-700 to-indigo-400 rounded-full"
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-zinc-600">Week {weeksIn}</span>
          <span className="text-[10px] text-zinc-600">{progressPct}% complete</span>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex justify-between items-center px-4 py-2.5 ${
              i < rows.length - 1 ? "border-b border-surface-0" : ""
            }`}
          >
            <span className="text-xs text-zinc-500">{row.label}</span>
            <span
              className={`text-xs font-semibold ${
                row.accent ? "text-accent" : "text-zinc-300"
              } ${row.mono ? "font-mono" : ""}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </Card>

      <Card className="!p-3">
        <div className="flex items-start gap-2">
          <Clock size={14} className="text-zinc-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Allow up to 4 weeks at each dose for your body to fully adjust before reducing further.
          </p>
        </div>
      </Card>

      <Button variant="ghost" onClick={onAddProfile} className="w-full border border-dashed border-border-subtle">
        <Plus size={15} />
        Add another medication
      </Button>
    </div>
  );
}
