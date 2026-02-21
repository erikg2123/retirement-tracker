import React from 'react';
import { useRetirementCalc } from '../hooks/useRetirementCalc';
import { formatCurrency } from '../utils/retirementMath';

export function MilestoneTimeline() {
  const { milestones, plan } = useRetirementCalc();

  return (
    <div className="chart-card">
      <h3>🏁 Milestone Timeline</h3>
      <div className="milestone-list">
        {milestones.map((m) => {
          const pct = Math.min((m.projectedBalance / m.targetBalance) * 100, 100);
          return (
            <div key={m.age} className={`milestone-item ${m.reached ? 'milestone-reached' : ''}`}>
              <div className="milestone-header">
                <span className="milestone-label">{m.label}</span>
                <span className={`milestone-badge ${m.reached ? 'badge-success' : 'badge-pending'}`}>
                  {m.reached ? '✅ On Track' : '⏳ Behind'}
                </span>
              </div>
              <div className="milestone-values">
                <span>Projected: <strong>{formatCurrency(m.projectedBalance)}</strong></span>
                <span>Target: <strong>{formatCurrency(m.targetBalance)}</strong></span>
              </div>
              <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                <div
                  className={`progress-fill ${m.reached ? 'progress-fill-success' : 'progress-fill-warning'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}