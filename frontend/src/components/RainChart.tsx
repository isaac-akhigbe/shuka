"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyRain } from "@/types/location";

interface Props {
  data: DailyRain[];
  color: string;
}

export default function RainChart({ data, color }: Props) {
  // Show "May 1" style labels instead of "2026-05-01"
  const rows = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="#e7e9e5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#e7e9e5" }}
            interval={6}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            unit="mm"
          />
          <Tooltip
            cursor={{ fill: "rgba(20,32,26,0.04)" }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e4e7e2",
              borderRadius: 8,
              color: "#14201a",
              fontSize: 12,
            }}
            formatter={(value) => [`${value} mm`, "Rain"]}
          />
          <Bar dataKey="mm" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}