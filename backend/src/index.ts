import express    from 'express'
import cors       from 'cors'
import dotenv     from 'dotenv'
import projections from './routes/projections'
import solve       from './routes/solve'
import plan        from './routes/plan'

dotenv.config()

const app  = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

app.use(cors())   // ← allows all origins so Render frontend can call it
app.use(express.json())

app.use('/api/projections', projections)
app.use('/api/solve',       solve)
app.use('/api/plan',        plan)

app.listen(PORT, () => {
  console.log(`✅  Backend running on port ${PORT}`)
})

// No scraping needed — 2025 federal brackets (MFJ / Single)
// Roth withdrawals = tax free
// Traditional withdrawals = ordinary income
// We calculate effective tax rate based on annual withdrawal amount

const BRACKETS_2025_SINGLE = [
  { min: 0,       max: 11_925,  rate: 0.10 },
  { min: 11_925,  max: 48_475,  rate: 0.12 },
  { min: 48_475,  max: 103_350, rate: 0.22 },
  { min: 103_350, max: 197_300, rate: 0.24 },
  { min: 197_300, max: 250_525, rate: 0.32 },
  { min: 250_525, max: 626_350, rate: 0.35 },
  { min: 626_350, max: Infinity,rate: 0.37 },
]

export function effectiveTaxRate(annualWithdrawal: number, rothPct: number): number {
  const taxableAmount = annualWithdrawal * (1 - rothPct / 100)
  let tax = 0
  for (const bracket of BRACKETS_2025_SINGLE) {
    if (taxableAmount <= bracket.min) break
    const taxable = Math.min(taxableAmount, bracket.max) - bracket.min
    tax += taxable * bracket.rate
  }
  return taxableAmount > 0 ? tax / annualWithdrawal : 0
}