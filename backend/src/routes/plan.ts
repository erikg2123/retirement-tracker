import { Router } from 'express'
import fs         from 'fs'
import path       from 'path'

const router   = Router()
const PLAN_FILE = path.join(__dirname, '../../data/plan.json')

// Ensure data dir exists
fs.mkdirSync(path.dirname(PLAN_FILE), { recursive: true })

router.get('/', (_, res) => {
  if (!fs.existsSync(PLAN_FILE)) return res.json(null)
  try {
    const raw = fs.readFileSync(PLAN_FILE, 'utf-8')
    res.json(JSON.parse(raw))
  } catch {
    res.json(null)
  }
})

router.post('/', (req, res) => {
  try {
    fs.writeFileSync(PLAN_FILE, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to save plan' })
  }
})

export default router