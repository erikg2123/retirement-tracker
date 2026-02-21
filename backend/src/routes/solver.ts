import { Router, Request, Response } from 'express'
import { SolveRequestSchema } from '../schemas'
import { solve } from '../utils/solver'

const router = Router()

router.post('/', (req: Request, res: Response) => {
  const parsed = SolveRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() })
  }

  const result = solve(parsed.data)
  return res.json(result)
})

export default router