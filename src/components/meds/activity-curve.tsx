"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MedLog } from "@/types";
import { generateActivityCurve } from "@/lib/pharmacokinetics";
import Card from "@/components/ui/card";

interface ActivityCurveProps {
  logs: MedLog[];
}

export default function ActivityCurve({ logs }: ActivityCurveProps) {
  const data = useMemo(() => generateActivityCurve(logs, 24, 4), [logs]);
  const maxLevel = useMemo(
    () => Math.max(...data.map((d) => d.level), 1),
    [data]
  );

  const nowMs = Date.now();
  const currentLabel = useMemo(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  }, []);

  const currentLevel = useMemo(() => {
    let closest = data[0];
    let minDiff = Infinity;
    for (const point of data) {
      const diff = Math.abs(point.time - nowMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }
    return closest?.level ?? 0;
  }, [data, nowMs]);

  if (logs.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-2xl mb-2 opacity-30">📊</div>
          <p className="text-xs text-zinc-600">Log a dose to see your activity curve</p>
        </div>
      </Card>
    );
  }

  return (
    <Card glow>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold text-zinc-400">Active Level</h3>
          <p className="text-[10px] text-zinc-600">24-hour pharmacokinetic estimate</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold font-mono text-accent">
            {currentLevel.toFixed(1)}
            <span className="text-xs text-zinc-500 font-normal ml-0.5">mg</span>
          </div>
          <div className="text-[10px] text-zinc-600">current estimate</div>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#52525b" }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#3f3f46" }}
              axisLine={false}
              tickLine={false}
              domain={[0, Math.ceil(maxLevel * 1.1)]}
            />
            <ReferenceLine
              x={currentLabel}
              stroke="#818cf8"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="level"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#curveGradient)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-0.5 rounded-full bg-accent" />
          <span className="text-[10px] text-zinc-500">Estimated active medication</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-0.5 rounded-full bg-accent/40 border-dashed" />
          <span className="text-[10px] text-zinc-500">Now</span>
        </div>
      </div>
    </Card>
  );
}
