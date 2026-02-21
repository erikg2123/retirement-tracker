import { Dashboard }           from './components/Dashboard'
import { ProjectionChart }     from './components/ProjectionChart'
import { MilestoneTimeline }   from './components/MilestoneTimeline'
import { SettingsPanel }       from './components/SettingsPanel'
import { HoldingsTracker }     from './components/HoldingsTracker'
import { AssetAllocation }     from './components/AssetAllocation'
import { ContributionLog }     from './components/ContributionLog'
import { ScenarioComparison }  from './components/ScenarioComparison'
import { DrawdownSimulator }   from './components/DrawdownSimulator'
import { SolverPanel }         from './components/SolverPanel'
import { AssumptionsPanel }    from './components/AssumptionsPanel'
import { useTheme }            from './hooks/useTheme'
import { useRetirementCalc }   from './hooks/useRetirementCalc'
import { useContext }          from 'react'
import { PlanContext }         from './context/PlanContext'
import './index.css'

export default function App() {
  const { theme, toggle }           = useTheme()
  const { plan }                    = useRetirementCalc()
  const { savePlan, saving, saved } = useContext(PlanContext)

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">💰 RetireOS</div>
        <nav>
          <a href="#dashboard"     className="nav-link">📊 Dashboard</a>
          <a href="#holdings"      className="nav-link">📦 Holdings</a>
          <a href="#allocation"    className="nav-link">📊 Allocation</a>
          <a href="#projections"   className="nav-link">📈 Projections</a>
          <a href="#scenarios"     className="nav-link">🎲 Scenarios</a>
          <a href="#drawdown"      className="nav-link">🏖️ Drawdown</a>
          <a href="#milestones"    className="nav-link">🏁 Milestones</a>
          <a href="#contributions" className="nav-link">📅 Log</a>
          <a href="#settings"      className="nav-link">⚙️ Settings</a>
          <a href="#solver"        className="nav-link">🎯 Solver</a>
          <a href="#assumptions"   className="nav-link">📋 Assumptions</a>
        </nav>

        <button className="save-btn" onClick={savePlan} disabled={saving}>
          {saving ? '💾 Saving...' : saved ? '✅ Saved!' : '💾 Save Plan'}
        </button>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>RetireOS 💰</h1>
          <p className="page-sub">
            Retiring at <strong>{plan.retirementAge}</strong> ·
            in <strong>{plan.retirementAge - plan.currentAge} years</strong> ·
            living to <strong>{plan.lifeExpectancy}</strong>
          </p>
        </div>

        <section id="dashboard">      <Dashboard />          </section>
        <section id="holdings">       <HoldingsTracker />    </section>
        <section id="allocation">     <AssetAllocation />    </section>
        <section id="projections">    <ProjectionChart />    </section>
        <section id="scenarios">      <ScenarioComparison /> </section>
        <section id="drawdown">       <DrawdownSimulator />  </section>
        <section id="milestones">     <MilestoneTimeline />  </section>
        <section id="contributions">  <ContributionLog />    </section>
        <section id="settings">       <SettingsPanel />      </section>
        <section id="solver">         <SolverPanel />        </section>
        <section id="assumptions">    <AssumptionsPanel />   </section>
      </main>

      <button className="theme-toggle" onClick={toggle} title="Toggle dark mode">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  )
}