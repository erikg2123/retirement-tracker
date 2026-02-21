import React from 'react';
import {
  Area, Line, ComposedChart,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { useRetirementCalc } from '../hooks/useRetirementCalc';
import { formatCurrency } from '../utils/retirementMath';

export function ProjectionChart() {
  const { projections, nestEggNeeded } = useRetirementCalc();

  const chartData = projections.map(p => ({
    age:                  p.age,
    'With Contributions': p.balance,
    'Inflation-Adjusted': p.balanceInflationAdjusted,
    'On-Track Target':    p.onTrackTarget,
    'Do Nothing':         p.doNothingBalance,
  }));

  // what does "do nothing" end at?
  const doNothingEnd = projections.at(-1)?.doNothingBalance ?? 0;

  return (
    <div className="chart-card">
      <h3>📈 Projected Balance Over Time</h3>
      <p className="chart-sub">
        🔵 With contributions · 🟢 Inflation-adjusted · 🟠 On-track target ·
        🟣 Do nothing (zero new contributions) · 🔴 Goal
      </p>

      {doNothingEnd > 0 && (
        <p className="chart-sub" style={{ marginTop: '0.25rem', color: 'var(--muted)' }}>
          If you stop contributing today, your portfolio would reach{' '}
          <strong>{formatCurrency(doNothingEnd)}</strong> by age {projections.at(-1)?.age} —
          {doNothingEnd >= nestEggNeeded
            ? ' enough to hit your goal on growth alone 🎉'
            : ` still ${formatCurrency(nestEggNeeded - doNothingEnd)} short of your goal`}
        </p>
      )}

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4a90e2" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4a90e2" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="adjGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2ecc71" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2ecc71" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="doNothingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#9b59b6" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#9b59b6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="age"
            tick={{ fontSize: 12 }}
            label={{ value: 'Age', position: 'insideBottom', offset: -4 }}
          />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={80} />
          <Tooltip
            formatter={(v: number, name: string) => [formatCurrency(v), name]}
            labelFormatter={(l) => `Age ${l}`}
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
          />
          <Legend verticalAlign="top" height={36} />

          {/* Goal line */}
          <ReferenceLine
            y={nestEggNeeded}
            stroke="#e74c3c"
            strokeDasharray="6 3"
            label={{
              value: `Goal ${formatCurrency(nestEggNeeded)}`,
              fill: '#e74c3c',
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />

          {/* Do Nothing — rendered first so it's behind other lines */}
          <Area
            type="monotone"
            dataKey="Do Nothing"
            stroke="#9b59b6"
            fill="url(#doNothingGrad)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />

          {/* On-track glide path */}
          <Line
            type="monotone"
            dataKey="On-Track Target"
            stroke="#f39c12"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />

          {/* Projected balance with contributions */}
          <Area
            type="monotone"
            dataKey="With Contributions"
            stroke="#4a90e2"
            fill="url(#balanceGrad)"
            strokeWidth={2.5}
            dot={false}
          />

          {/* Inflation-adjusted */}
          <Area
            type="monotone"
            dataKey="Inflation-Adjusted"
            stroke="#2ecc71"
            fill="url(#adjGrad)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}