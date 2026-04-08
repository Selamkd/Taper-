"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Trash2 } from "lucide-react";
import type { Prescription, MedLog } from "@/types";
import { COMMON_MEDICATIONS } from "@/lib/pharmacokinetics";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

interface DoseLoggerProps {
  prescriptions: Prescription[];
  todayLogs: MedLog[];
  onLogDose: (prescriptionId: string) => Promise<void>;
  onDeleteLog: (logId: string) => Promise<void>;
  onAddPrescription: (data: Omit<Prescription, "id" | "createdAt">) => Promise<void>;
}

export default function DoseLogger({
  prescriptions,
  todayLogs,
  onLogDose,
  onDeleteLog,
  onAddPrescription,
}: DoseLoggerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [logging, setLogging] = useState<string | null>(null);

  async function handleLog(prescriptionId: string) {
    setLogging(prescriptionId);
    try {
      await onLogDose(prescriptionId);
    } finally {
      setLogging(null);
    }
  }

  return (
    <div className="space-y-4">
      {prescriptions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-3 px-1">
            Tap to log a dose
          </p>
          <div className="grid grid-cols-2 gap-2">
            {prescriptions
              .filter((p) => p.active)
              .map((rx) => {
                const isLogging = logging === rx.id;
                return (
                  <motion.button
                    key={rx.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleLog(rx.id)}
                    disabled={isLogging}
                    className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-1 p-4 text-left transition-all hover:border-border disabled:opacity-50"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                      style={{ backgroundColor: rx.color }}
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono text-white"
                        style={{ backgroundColor: rx.color + "33", color: rx.color }}
                      >
                        {rx.doseMg}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-zinc-300 truncate">{rx.name}</div>
                        <div className="text-[10px] text-zinc-600">{rx.doseMg}mg</div>
                      </div>
                    </div>
                    {isLogging && (
                      <div className="absolute inset-0 bg-surface-1/80 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full border-2 border-border-subtle border-t-accent animate-spin" />
                      </div>
                    )}
                  </motion.button>
                );
              })}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAdd(true)}
              className="rounded-xl border border-dashed border-border-subtle p-4 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 hover:border-border transition-all"
            >
              <Plus size={18} />
              <span className="text-[10px] font-semibold">Add Med</span>
            </motion.button>
          </div>
        </div>
      )}

      {prescriptions.length === 0 && !showAdd && (
        <Card>
          <div className="text-center py-6">
            <Plus size={24} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-400 mb-1">No prescriptions yet</p>
            <p className="text-xs text-zinc-600 mb-4">Add your medications to start tracking</p>
            <Button variant="primary" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Prescription
            </Button>
          </div>
        </Card>
      )}

      {todayLogs.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-2 px-1">
            Today's doses
          </p>
          <div className="space-y-1">
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-0 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-zinc-600" />
                  <span className="text-xs font-semibold text-zinc-300">{log.prescriptionName}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{log.doseMg}mg</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">
                    {new Date(log.takenAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="text-zinc-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddPrescriptionModal
            onAdd={async (data) => {
              await onAddPrescription(data);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddPrescriptionModal({
  onAdd,
  onClose,
}: {
  onAdd: (data: Omit<Prescription, "id" | "createdAt">) => Promise<void>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [name, setName] = useState("");
  const [doseMg, setDoseMg] = useState(10);
  const [halfLife, setHalfLife] = useState(4);
  const [saving, setSaving] = useState(false);

  async function handlePreset(med: (typeof COMMON_MEDICATIONS)[number]) {
    setSaving(true);
    await onAdd({
      name: med.name,
      doseMg: 10,
      halfLifeHours: med.halfLifeHours,
      onsetMinutes: med.onsetMinutes,
      peakHours: med.peakHours,
      frequency: "once_daily",
      color: med.color,
      active: true,
    });
    setSaving(false);
  }

  async function handleCustom() {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({
      name,
      doseMg,
      halfLifeHours: halfLife,
      onsetMinutes: 30,
      peakHours: 2,
      frequency: "once_daily",
      color: "#818cf8",
      active: true,
    });
    setSaving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-1 border border-border rounded-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-zinc-200">Add Prescription</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 bg-surface-0 p-1 rounded-lg mb-4">
          {(["preset", "custom"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                mode === m ? "bg-surface-3 text-zinc-200" : "text-zinc-500"
              }`}
            >
              {m === "preset" ? "Common Meds" : "Custom"}
            </button>
          ))}
        </div>

        {mode === "preset" ? (
          <div className="space-y-1.5">
            {COMMON_MEDICATIONS.map((med) => (
              <button
                key={med.name}
                onClick={() => handlePreset(med)}
                disabled={saving}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-surface-0 text-left hover:border-border transition-all disabled:opacity-50"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: med.color + "22" }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: med.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-zinc-300">{med.name}</div>
                  <div className="text-[10px] text-zinc-600">
                    ~{med.halfLifeHours}h half-life · peaks at {med.peakHours}h
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My medication"
                className="w-full px-3 py-2.5 bg-surface-0 border border-border rounded-xl text-sm text-zinc-200 outline-none focus:border-accent/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Dose (mg)</label>
                <input
                  type="number"
                  value={doseMg}
                  onChange={(e) => setDoseMg(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-surface-0 border border-border rounded-xl text-sm font-mono text-zinc-200 outline-none focus:border-accent/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Half-life (hrs)</label>
                <input
                  type="number"
                  value={halfLife}
                  onChange={(e) => setHalfLife(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-surface-0 border border-border rounded-xl text-sm font-mono text-zinc-200 outline-none focus:border-accent/40"
                />
              </div>
            </div>
            <Button variant="primary" loading={saving} disabled={!name.trim()} onClick={handleCustom} className="w-full">
              Add Prescription
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
