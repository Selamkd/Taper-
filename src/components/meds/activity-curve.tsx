"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import type { MedLog } from "@/types";
import Card from "@/components/ui/card";

interface ActivityCurveProps {
  logs: MedLog[];
}

interface DataPoint {
  time: number;
  hour: number;
  label: string;
  total: number;
  [key: string]: number | string;
}

interface MedConfig {
  id: string;
  name: string;
  color: string;
}

interface DoseMarker {
  time: Date;
  name: string;
  dose: number;
  color: string;
  hoursAgo: number;
}

const COLORS = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#22d3ee",
  "#fb923c",
  "#a78bfa",
  "#4ade80",
];

function calculateActiveLevel(
  doseMg: number,
  halfLifeHours: number,
  hoursElapsed: number
): number {
  if (hoursElapsed < 0) return 0;
  const decayConstant = Math.LN2 / halfLifeHours;
  return doseMg * Math.exp(-decayConstant * hoursElapsed);
}

function generateHourlyCurve(
  logs: MedLog[],
  pointsPerHour: number = 4
): { data: DataPoint[]; meds: MedConfig[]; doseMarkers: DoseMarker[] } {
  const validLogs = logs.filter((log) => {
    const t = new Date(log.takenAt);
    return !isNaN(t.getTime());
  });

  const medMap = new Map<string, MedConfig>();
  validLogs.forEach((log) => {
    if (!medMap.has(log.prescriptionName)) {
      medMap.set(log.prescriptionName, {
        id: log.prescriptionName.toLowerCase().replace(/\s+/g, "_"),
        name: log.prescriptionName,
        color: COLORS[medMap.size % COLORS.length],
      });
    }
  });

  const meds = Array.from(medMap.values());

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const totalHours = 24;
  const totalPoints = totalHours * pointsPerHour;
  const data: DataPoint[] = [];

  for (let i = 0; i <= totalPoints; i++) {
    const pointTime = new Date(
      todayStart.getTime() + (i / totalPoints) * totalHours * 60 * 60 * 1000
    );

    const hour = pointTime.getHours();
    const minute = pointTime.getMinutes();
    const label = `${hour}:${minute.toString().padStart(2, "0")}`;

    const point: DataPoint = {
      time: pointTime.getTime(),
      hour: hour + minute / 60,
      label,
      total: 0,
    };

    for (const med of meds) {
      let level = 0;
      for (const log of validLogs) {
        if (log.prescriptionName !== med.name) continue;
        const takenAt = new Date(log.takenAt);
        const hoursElapsed = (pointTime.getTime() - takenAt.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed >= 0) {
          level += calculateActiveLevel(log.doseMg, log.halfLifeHours, hoursElapsed);
        }
      }
      point[med.id] = Math.round(level * 100) / 100;
      point.total += level;
    }

    point.total = Math.round(point.total * 100) / 100;
    data.push(point);
  }

  const doseMarkers: DoseMarker[] = validLogs
    .filter((log) => {
      const t = new Date(log.takenAt);
      return t >= todayStart && t <= todayEnd;
    })
    .map((log) => {
      const t = new Date(log.takenAt);
      const hoursAgo = (now.getTime() - t.getTime()) / (1000 * 60 * 60);
      return {
        time: t,
        name: log.prescriptionName,
        dose: log.doseMg,
        color: medMap.get(log.prescriptionName)?.color ?? COLORS[0],
        hoursAgo,
      };
    })
    .sort((a, b) => b.time.getTime() - a.time.getTime());

  return { data, meds, doseMarkers };
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-xs text-zinc-300">{p.name}</span>
          <span className="text-xs font-mono text-zinc-400 ml-auto">
            {p.value?.toFixed(1)}mg
          </span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-zinc-700">
          <span className="text-xs text-zinc-400">Total</span>
          <span className="text-xs font-mono font-semibold text-zinc-200 ml-auto">
            {total.toFixed(1)}mg
          </span>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m ago`;
  }
  if (hours < 2) {
    return "1h ago";
  }
  return `${Math.round(hours)}h ago`;
}

export default function ActivityCurve({ logs }: ActivityCurveProps) {
  const { data, meds, doseMarkers } = useMemo(
    () => generateHourlyCurve(logs, 4),
    [logs]
  );

  const maxLevel = useMemo(
    () => Math.max(...data.map((d) => d.total), 1),
    [data]
  );

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const currentLevel = useMemo(() => {
    let closest = data[0];
    let minDiff = Infinity;
    const nowMs = Date.now();
    for (const point of data) {
      const diff = Math.abs(point.time - nowMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }
    return closest?.total ?? 0;
  }, [data]);

  if (logs.length === 0) {
    return (
      <Card>
        <div className="text-center py-10">
          <div className="text-2xl mb-2 opacity-30">📊</div>
          <p className="text-sm text-zinc-500">No activity data</p>
          <p className="text-xs text-zinc-600 mt-1">Log a dose to see your curve</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">Activity</h3>
          <p className="text-[10px] text-zinc-600">Estimated active levels today</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-accent tabular-nums">
            {currentLevel.toFixed(1)}
          </span>
          <span className="text-xs text-zinc-500">mg now</span>
        </div>
      </div>

      <Card className="!p-3">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -32 }}>
              <defs>
                {meds.map((med) => (
                  <linearGradient
                    key={med.id}
                    id={`gradient-${med.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={med.color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={med.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>

              <XAxis
                dataKey="hour"
                type="number"
                domain={[0, 24]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]}
                tickFormatter={(h) => {
                  if (h === 0 || h === 24) return "12a";
                  if (h === 12) return "12p";
                  if (h < 12) return `${h}`;
                  return `${h - 12}`;
                }}
                tick={{ fontSize: 7, fill: "#52525b" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 8, fill: "#3f3f46" }}
                axisLine={false}
                tickLine={false}
                domain={[0, Math.ceil(maxLevel * 1.15)]}
                width={28}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                x={currentHour}
                stroke="#818cf8"
                strokeWidth={1}
                strokeDasharray="2 2"
              />

              {meds.map((med) => (
                <Area
                  key={med.id}
                  type="monotone"
                  dataKey={med.id}
                  name={med.name}
                  stackId="1"
                  stroke={med.color}
                  strokeWidth={1.5}
                  fill={`url(#gradient-${med.id})`}
                  animationDuration={600}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {meds.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {meds.map((med) => (
              <div key={med.id} className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: med.color }}
                />
                <span className="text-[9px] text-zinc-500">{med.name}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      
             
         
 
   
    </div>
  );
}