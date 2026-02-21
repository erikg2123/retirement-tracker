import React from 'react';
import { useRetirementCalc } from '../hooks/useRetirementCalc';
import { formatCurrency, getEffectiveAnnualContribution, calculateNetMonthlyWithdrawal } from '../utils/retirementMath';
import { trinitySuccessRate } from '../utils/trinity';

function withdrawalRateLabel(rate: number): string {
  if (rate <= 0)   return '—'
  if (rate <= 3.5) return '🟢 Very safe — historically near 100% survival to $0'
  if (rate <= 4.0) return '🟢 Safe — ~95% historical survival to $0'
  if (rate <= 5.0) return '🟡 Moderate — elevated risk of full depletion ($0)'
  return '🔴 Aggressive — high historical rate of full depletion ($0)'
}

export function Dashboard() {
  const { plan, projectedNestEgg, nestEggNeeded, monthlyWithdrawal, onTrack, drawdown } = useRetirementCalc();

  const progress = nestEggNeeded > 0 ? Math.min((plan.currentSavings / nestEggNeeded) * 100, 100) : 0;
  const projectedProgress = nestEggNeeded > 0 ? Math.min((projectedNestEgg / nestEggNeeded) * 100, 100) : 0;
  const yearsToRetirement = plan.retirementAge - plan.currentAge;
  const effectiveContribution = getEffectiveAnnualContribution(plan);
  const netMonthly = projectedNestEgg > 0 ? calculateNetMonthlyWithdrawal(projectedNestEgg, plan) : 0;

  // Configured SWR from plan (what user set / solver solved for)
  const configuredWithdrawalRate = (plan.withdrawalRate ?? 0.04) * 100;

  // Implied rate = what rate does your actual spend imply at your projected nest egg
  const annualSpendNeeded =
    plan.monthlySpendingGoal * 12 * Math.pow(1 + plan.inflationRate, yearsToRetirement);
  const impliedWithdrawalRate = projectedNestEgg > 0
    ? (annualSpendNeeded / projectedNestEgg) * 100
    : 0;

  // Trinity uses the CONFIGURED rate (what will actually be withdrawn)
  const retirementYears = plan.lifeExpectancy - plan.retirementAge;
  const successRate = trinitySuccessRate(plan.withdrawalRate ?? 0.04, retirementYears, plan.rothPct);

  // Roth balance split
  const rothBalance = Math.min(plan.currentSavingsRoth ?? 0, plan.currentSavings);
  const tradBalance = plan.currentSavings - rothBalance;
  const rothBarPct = plan.currentSavings > 0 ? (rothBalance / plan.currentSavings) * 100 : 0;

  // Die-with target hit rate — derived from our own drawdown simulation
  const dieWithTarget    = plan.dieWithTarget ?? 0
  const finalBalance     = drawdown.at(-1)?.endBalance ?? 0
  const dieWithMet       = finalBalance >= dieWithTarget
  // Trinity = historical $0 survival rate
  // Die-with = did OUR projected drawdown end above the target?
  const dieWithShortfall = dieWithMet ? 0 : dieWithTarget - finalBalance

  return (
    <div className="dashboard">
      <div className={`banner ${onTrack ? 'banner-success' : 'banner-warning'}`}>
        {onTrack
          ? `✅ You are ON TRACK to retire at ${plan.retirementAge}!`
          : `⚠️ You are currently NOT on track — adjust your plan below.`}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Current Balance</div>
          <div className="stat-value">{formatCurrency(plan.currentSavings)}</div>
          <div className="stat-sub">
            🟢 Roth {formatCurrency(rothBalance)} · 🔵 Trad {formatCurrency(tradBalance)}
          </div>
        </div>

        <div className="stat-card accent">
          <div className="stat-label">Projected at {plan.retirementAge}</div>
          <div className="stat-value">{formatCurrency(projectedNestEgg)}</div>
          <div className="stat-sub">At {(plan.expectedReturnRate * 100).toFixed(0)}% annual return</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Nest Egg Needed</div>
          <div className="stat-value">{formatCurrency(nestEggNeeded)}</div>
          <div className="stat-sub">For ${plan.monthlySpendingGoal.toLocaleString()}/mo (today's $)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Monthly Withdrawal</div>
          <div className="stat-value">{monthlyWithdrawal > 0 ? formatCurrency(monthlyWithdrawal) : '—'}</div>
          <div className="stat-sub">
            Gross (pre-tax) · take-home ≈ {netMonthly > 0 ? formatCurrency(netMonthly) : '—'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Withdrawal Rate</div>
          <div className="stat-value">{configuredWithdrawalRate.toFixed(1)}%</div>
          <div className="stat-sub">{withdrawalRateLabel(configuredWithdrawalRate)}</div>
        </div>

        <div className={`stat-card ${successRate >= 90 ? 'accent' : successRate >= 75 ? '' : 'accent-warn'}`}>
          <div className="stat-label">Trinity Success Rate</div>
          <div className="stat-value">{successRate > 0 ? `${successRate}%` : '—'}</div>
          <div className="stat-sub">
            {successRate}% of historical {retirementYears}-year retirements survived
            a <strong>{configuredWithdrawalRate.toFixed(2)}%</strong> withdrawal rate
            without hitting <strong>$0</strong> (complete depletion).
            {impliedWithdrawalRate > 0 && Math.abs(impliedWithdrawalRate - configuredWithdrawalRate) > 0.1 && (
              <> Your spending implies <strong>{impliedWithdrawalRate.toFixed(2)}%</strong> at your projected nest egg.</>
            )}
          </div>
        </div>

        {/* Separate card — only meaningful concept once user sets a die-with target */}
        <div className={`stat-card ${dieWithMet ? 'accent' : 'accent-warn'}`}>
          <div className="stat-label">
            Die-With Target {dieWithTarget > 0 ? `(${formatCurrency(dieWithTarget)})` : '($0 — don\'t run out)'}
          </div>
          <div className="stat-value">
            {dieWithMet ? '✅ On track' : '⚠️ Shortfall'}
          </div>
          <div className="stat-sub">
            {dieWithMet
              ? `Your projected drawdown ends at ${formatCurrency(finalBalance)} at age ${plan.lifeExpectancy} — ${formatCurrency(finalBalance - dieWithTarget)} above your target.`
              : `Your projected drawdown ends at ${formatCurrency(finalBalance)} at age ${plan.lifeExpectancy} — ${formatCurrency(dieWithShortfall)} short of your ${formatCurrency(dieWithTarget)} target. Use the Solver to find the contribution or retirement age needed to hit it.`
            }
            {dieWithTarget === 0 && finalBalance <= 0 &&
              ' ⚠️ Portfolio depletes before age ' + plan.lifeExpectancy + '.'
            }
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Years to Retirement</div>
          <div className="stat-value">{yearsToRetirement}</div>
          <div className="stat-sub">Retiring at age {plan.retirementAge}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Annual Contribution</div>
          <div className="stat-value">{formatCurrency(effectiveContribution)}</div>
          <div className="stat-sub">
            {plan.contributionMode === 'salary'
              ? `${plan.salaryContributionPct}% of $${(plan.currentSalary / 1000).toFixed(0)}K salary`
              : 'Fixed contribution'}
          </div>
        </div>
      </div>

      {/* Roth vs Traditional balance bar */}
      <div className="progress-card">
        <div className="progress-header">
          <span>Current balance — Roth vs Traditional</span>
          <span>{rothBarPct.toFixed(0)}% Roth</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${rothBarPct}%`, background: 'var(--success)' }} />
        </div>
        <div className="progress-footer">
          <span>🟢 Roth {formatCurrency(rothBalance)}</span>
          <span>🔵 Traditional {formatCurrency(tradBalance)}</span>
        </div>
      </div>

      {/* Today's progress */}
      <div className="progress-card">
        <div className="progress-header">
          <span>Current savings toward goal</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill progress-fill-success" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-footer">
          <span>{formatCurrency(plan.currentSavings)} today</span>
          <span>Goal: {formatCurrency(nestEggNeeded)}</span>
        </div>
      </div>

      {/* Projected progress */}
      <div className="progress-card">
        <div className="progress-header">
          <span>Projected at retirement</span>
          <span>{projectedProgress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${onTrack ? 'progress-fill-success' : 'progress-fill-warning'}`}
            style={{ width: `${projectedProgress}%` }}
          />
        </div>
        <div className="progress-footer">
          <span>{formatCurrency(projectedNestEgg)} projected</span>
          <span>Goal: {formatCurrency(nestEggNeeded)}</span>
        </div>
      </div>
    </div>
  );
}