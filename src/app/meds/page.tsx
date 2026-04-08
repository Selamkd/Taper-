"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity } from "lucide-react";
import type { Prescription, MedLog } from "@/types";
import ActivityCurve from "@/components/meds/activity-curve";
import DoseLogger from "@/components/meds/dose-logger";

export default function MedsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  async function loadData() {
    try {
      const [rxRes, logsRes] = await Promise.all([
        fetch("/api/meds/prescriptions"),
        fetch(`/api/meds/logs?date=${today}`),
      ]);
      const { prescriptions: rxList } = await rxRes.json();
      const { logs } = await logsRes.json();
      setPrescriptions(rxList ?? []);
      setTodayLogs(logs ?? []);
    } catch (err) {
      console.error("Failed to load meds data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleLogDose = useCallback(
    async (prescriptionId: string) => {
      const rx = prescriptions.find((p) => p.id === prescriptionId);
      if (!rx) return;

      const now = new Date();
      const takenAt = now.toISOString();

      await fetch("/api/meds/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescriptionId: rx.id,
          prescriptionName: rx.name,
          doseMg: rx.doseMg,
          halfLifeHours: rx.halfLifeHours,
          takenAt,
          date: today,
        }),
      });
      await loadData();
    },
    [prescriptions, today]
  );

  const handleDeleteLog = useCallback(async (logId: string) => {
    await fetch("/api/meds/logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: logId }),
    });
    setTodayLogs((prev) => prev.filter((l) => l.id !== logId));
  }, []);

  const handleAddPrescription = useCallback(
    async (data: Omit<Prescription, "id" | "createdAt">) => {
      await fetch("/api/meds/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await loadData();
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

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] text-zinc-600 mb-0.5">{dateStr}</p>
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-accent" />
          <h1 className="text-xl font-bold text-zinc-200 tracking-tight">
            Medication Tracker
          </h1>
        </div>
        <p className="text-xs text-zinc-600 mt-1">
          Log your doses and track active medication levels throughout the day
        </p>
      </div>

      <ActivityCurve logs={todayLogs} />

      <DoseLogger
        prescriptions={prescriptions}
        todayLogs={todayLogs}
        onLogDose={handleLogDose}
        onDeleteLog={handleDeleteLog}
        onAddPrescription={handleAddPrescription}
      />
    </div>
  );
}
