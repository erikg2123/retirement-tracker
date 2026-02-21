import React, { useState } from 'react';
import { useRetirementCalc } from '../hooks/useRetirementCalc';
import { formatCurrency } from '../utils/retirementMath';
import type { ContributionMode } from '../types';

function Info({ tip }: { tip: string }) {
  return (
    <span className="info-tip">
      ℹ️
      <span className="info-bubble">{tip}</span>
    </span>
  );
}

function Label({ text, tip, children }: { text: string; tip?: string; children: React.ReactNode }) {
  return (
    <label className="settings-label">
      <span className="label-row">
        {text}
        {tip && <Info tip={tip} />}
      </span>
      {children}
    </label>
  );
}

export function SettingsPanel() {
  const { plan, updatePlan } = useRetirementCalc();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tradBalance = Math.max(plan.currentSavings - (plan.currentSavingsRoth ?? 0), 0);

  return (
    <div className="chart-card">
      <h2 className="card-title">⚙️ Plan Settings</h2>

      <div className="settings-grid">

        <Label text="Current Age">
          <input type="number" value={plan.currentAge}
            onChange={e => updatePlan({ currentAge: +e.target.value })} />
        </Label>

        <Label text="Retirement Age">
          <input type="number" value={plan.retirementAge}
            onChange={e => updatePlan({ retirementAge: +e.target.value })} />
        </Label>

        <Label text="Life Expectancy">
          <input type="number" value={plan.lifeExpectancy}
            onChange={e => updatePlan({ lifeExpectancy: +e.target.value })} />
        </Label>

        <Label
          text="Total Current Savings ($)"
          tip="Sum of ALL retirement accounts: Roth IRA, Roth 401k, Traditional IRA, Traditional 401k, etc."
        >
          <input type="number" value={plan.currentSavings}
            onChange={e => {
              const val = +e.target.value;
              updatePlan({
                currentSavings: val,
                currentSavingsRoth: Math.min(plan.currentSavingsRoth ?? 0, val),
              });
            }}
          />
        </Label>

        <Label
          text="Current Roth Balance ($)"
          tip="How much of your total savings is in Roth accounts (Roth IRA + Roth 401k). The remainder is treated as Traditional (pre-tax). This affects your tax calculation in retirement."
        >
          <input
            type="number"
            value={plan.currentSavingsRoth ?? 0}
            min={0}
            max={plan.currentSavings}
            onChange={e =>
              updatePlan({ currentSavingsRoth: Math.min(+e.target.value, plan.currentSavings) })
            }
          />
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
            🔵 Traditional balance: {formatCurrency(tradBalance)}
          </span>
        </Label>

        <Label
          text="Monthly Spending Goal ($)"
          tip="How much you want to spend per month in retirement, in today's dollars. We inflate this to retirement dollars automatically."
        >
          <input type="number" value={plan.monthlySpendingGoal}
            onChange={e => updatePlan({ monthlySpendingGoal: +e.target.value })} />
        </Label>

        <Label
          text="Expected Return Rate (%)"
          tip="Annual portfolio growth rate before retirement. Historical S&P 500 average is ~10% nominal. Use 7% if you want to be conservative (inflation-adjusted real return)."
        >
          <input type="number" value={(plan.expectedReturnRate * 100).toFixed(1)} step="0.1"
            onChange={e => updatePlan({ expectedReturnRate: +e.target.value / 100 })} />
        </Label>

        <Label
          text="Inflation Rate (%)"
          tip="Used to inflate your spending goal to future dollars and deflate projections. Historical US average ~3%."
        >
          <input type="number" value={(plan.inflationRate * 100).toFixed(1)} step="0.1"
            onChange={e => updatePlan({ inflationRate: +e.target.value / 100 })} />
        </Label>

        <Label
          text="Roth % of Contributions"
          tip="What percentage of your NEW contributions go into Roth accounts? 100% = all Roth (tax-free in retirement). 0% = all Traditional (taxed in retirement)."
        >
          <input type="number" value={plan.rothPct} min="0" max="100"
            onChange={e => updatePlan({ rothPct: +e.target.value })} />
        </Label>

        <Label
          text="Filing Status"
          tip="Used to calculate your federal tax on Traditional withdrawals using 2025 IRS brackets. Roth withdrawals are always tax-free."
        >
          <select value={plan.filingStatus}
            onChange={e => updatePlan({ filingStatus: e.target.value as 'single' | 'married' })}>
            <option value="single">Single</option>
            <option value="married">Married Filing Jointly</option>
          </select>
        </Label>

        <Label text="Contribution Mode">
          <select value={plan.contributionMode}
            onChange={e => updatePlan({ contributionMode: e.target.value as 'fixed' | 'salary' })}>
            <option value="fixed">Fixed Annual Amount</option>
            <option value="salary">% of Salary</option>
          </select>
        </Label>

        {plan.contributionMode === 'fixed' ? (
          <Label
            text="Annual Contribution ($)"
            tip="Total yearly amount you contribute across all retirement accounts."
          >
            <input type="number" value={plan.annualContribution}
              onChange={e => updatePlan({ annualContribution: +e.target.value })} />
          </Label>
        ) : (
          <>
            <Label text="Current Salary ($)">
              <input type="number" value={plan.currentSalary}
                onChange={e => updatePlan({ currentSalary: +e.target.value })} />
            </Label>
            <Label text="Contribution % of Salary">
              <input type="number" value={plan.salaryContributionPct} min="0" max="100"
                onChange={e => updatePlan({ salaryContributionPct: +e.target.value })} />
            </Label>
            <Label text="Expected Salary Growth (% / yr)">
              <input type="number" value={plan.expectedSalaryGrowthPct} step="0.5"
                onChange={e => updatePlan({ expectedSalaryGrowthPct: +e.target.value })} />
            </Label>
          </>
        )}

        <Label
          text="Withdrawal Rate (SWR %)"
          tip="Safe Withdrawal Rate — what % of your nest egg you withdraw per year. Classic research suggests 4%. Lower = safer but requires a larger nest egg."
        >
          <input
            type="number"
            value={((plan.withdrawalRate ?? 0.04) * 100).toFixed(1)}
            step="0.1" min="1" max="10"
            onChange={e => updatePlan({ withdrawalRate: +e.target.value / 100 })}
          />
        </Label>

        <Label
          text="Post-Retirement Return Rate (%)"
          tip="Expected annual portfolio return DURING retirement. Typically lower than your accumulation rate since you shift to a more conservative allocation (bonds + equities mix). 5–6% is common."
        >
          <input
            type="number"
            value={((plan.postRetirementReturnRate ?? 0.05) * 100).toFixed(1)}
            step="0.1" min="0" max="15"
            onChange={e => updatePlan({ postRetirementReturnRate: +e.target.value / 100 })}
          />
        </Label>

        <Label
          text="Die-With Target ($)"
          tip="How much money do you want left at death? Set to $0 if you just want to not run out. Any amount above $0 means you're targeting a legacy or buffer."
        >
          <input
            type="number"
            value={plan.dieWithTarget ?? 0}
            min={0}
            step={10000}
            onChange={e => updatePlan({ dieWithTarget: +e.target.value })}
          />
          {(plan.dieWithTarget ?? 0) > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              Legacy/buffer target: {formatCurrency(plan.dieWithTarget)}
            </span>
          )}
        </Label>

      </div>

      <div className="settings-actions">
        <button className="btn-primary" onClick={handleSave}>
          {saved ? '✅ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}