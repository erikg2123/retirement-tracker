import { Router } from 'express'
import { solve }  from '../utils/solver'
import type { SolveRequest } from '../types'

const router = Router()

router.post('/', (req, res) => {
  try {
    const body = req.body as SolveRequest
    const plan = {
      ...body.plan,
      filingStatus: body.plan.filingStatus ?? 'single',
    }
    const result = solve({ ...body, plan })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default router