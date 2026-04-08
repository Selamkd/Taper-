"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pill, TrendingDown, Clock, User } from "lucide-react";
import type { TaperProfile, DoseLog, ReductionSpeed } from "@/types";
import { getScheduleFromDose } from "@/lib/taper-schedules";
import DailyTracker from "@/components/taper/daily-tracker";
import Timeline from "@/components/taper/timeline";
import History from "@/components/taper/history";
import ProfilePanel from "@/components/taper/profile-panel";
import Onboarding from "@/components/taper/onboarding";

type Tab = "tracker" | "timeline" | "history" | "profile";

const TABS: { id: Tab; label: string; icon: typeof Pill }[] = [
  { id: "tracker", label: "Today", icon: Pill },
  { id: "timeline", label: "Timeline", icon: TrendingDown },
  { id: "history", label: "History", icon: Clock },
  { id: "profile", label: "Profile", icon: User },
];

export default function TaperPage() {
  const [profiles, setProfiles] = useState<TaperProfile[]>([]);
  const [profile, setProfile] = useState<TaperProfile | null>(null);
  const [todayLog, setTodayLog] = useState<DoseLog | null>(null);
  const [tab, setTab] = useState<Tab>("tracker");
  const [loading, setLoading] = useState(true);
  const [showAddProfile, setShowAddProfile] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/taper/profiles");
        const { profiles: list } = await res.json();
        setProfiles(list ?? []);
        if (list?.length > 0) {
          const active = list.find((p: TaperProfile) => p.status === "active") ?? list[0];
          await loadProfile(active);
        }
      } catch (err) {
        console.error("Failed to load profiles:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadProfile(p: TaperProfile) {
    setProfile(p);
    setTodayLog(null);
    try {
      const res = await fetch(`/api/taper/logs?profileId=${p.id}&today=true`);
      const { log } = await res.json();
      if (log) setTodayLog(log);
    } catch {}
  }

  const schedule = useMemo(
    () => (profile ? getScheduleFromDose(profile.startingDose, profile.reductionSpeed) : []),
    [profile]
  );

  const targetDose = schedule[profile?.currentStage ?? 0]?.dose ?? 0;

  const handleSaveLog = useCallback(
    async (data: {
      takenDose: number;
      targetDose: number;
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    }) => {
      if (!profile) return;
      const today = new Date().toISOString().split("T")[0];

      if (todayLog) {
        await fetch(`/api/taper/logs/${todayLog.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setTodayLog({ ...todayLog, takenDose: data.takenDose });
      } else {
        const res = await fetch("/api/taper/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: profile.id, date: today, ...data }),
        });
        const { log } = await res.json();
        setTodayLog(log);
      }
    },
    [profile, todayLog]
  );

  const handleSpeedChange = useCallback(
    async (speed: ReductionSpeed) => {
      if (!profile || profile.reductionSpeed === speed) return;
      const updated = { ...profile, reductionSpeed: speed };
      setProfile(updated);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      await fetch(`/api/taper/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reductionSpeed: speed }),
      });
    },
    [profile]
  );

  const handleCreateProfile = useCallback(
    async (data: Omit<TaperProfile, "id" | "createdAt" | "updatedAt">) => {
      const res = await fetch("/api/taper/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const { profile: created } = await res.json();
      setProfiles((prev) => [...prev, created]);
      setShowAddProfile(false);
      await loadProfile(created);
      setTab("tracker");
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-border-subtle border-t-accent animate-spin" />
      </div>
    );
  }

  if (!profile || showAddProfile) {
    return (
      <Onboarding
        onComplete={handleCreateProfile}
        onCancel={showAddProfile ? () => setShowAddProfile(false) : undefined}
      />
    );
  }

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] text-zinc-600 mb-0.5">{dateStr}</p>
            <h1 className="text-xl font-bold text-zinc-200 tracking-tight">
              {profile.medicationName}
            </h1>
          </div>
          {profiles.length > 1 && (
            <div className="flex gap-1 bg-surface-2 p-1 rounded-lg">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadProfile(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all max-w-[72px] truncate ${
                    profile.id === p.id
                      ? "bg-surface-4 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {p.medicationName.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Stage", value: `${profile.currentStage + 1} / ${schedule.length}`, accent: true },
            { label: "Target", value: `${targetDose}mg`, mono: true },
            { label: "Remaining", value: `${schedule.length - profile.currentStage - 1} left` },
          ].map((item) => (
            <div key={item.label} className="bg-surface-1 border border-border-subtle rounded-xl p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-0.5">
                {item.label}
              </div>
              <div
                className={`text-sm font-bold ${item.accent ? "text-accent" : "text-zinc-300"} ${item.mono ? "font-mono" : ""}`}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-surface-1 border border-border-subtle p-1 rounded-xl">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                isActive
                  ? "bg-surface-3 text-zinc-200 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-400"
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "tracker" && (
            <DailyTracker profile={profile} todayLog={todayLog} onSave={handleSaveLog} />
          )}
          {tab === "timeline" && (
            <Timeline profile={profile} onSpeedChange={handleSpeedChange} />
          )}
          {tab === "history" && <History profileId={profile.id} />}
          {tab === "profile" && (
            <ProfilePanel profile={profile} onAddProfile={() => setShowAddProfile(true)} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
