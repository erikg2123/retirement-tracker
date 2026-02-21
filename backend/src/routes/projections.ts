import { Router } from 'express';
import { buildProjections, buildDrawdown, buildMilestones, calculateNestEggNeeded } from '../utils/math';
import type { RetirementPlan } from '../types';

const router = Router();

router.post('/', (req, res) => {
  try {
    const plan: RetirementPlan = {
      ...req.body,
      filingStatus: req.body.filingStatus ?? 'single',
    };

    const projections      = buildProjections(plan);
    const nestEggNeeded    = calculateNestEggNeeded(plan);
    const projectedNestEgg = projections.at(-1)?.balance ?? 0;
    const drawdown         = buildDrawdown(plan, projectedNestEgg);
    const milestones       = buildMilestones(plan, projections);

    res.json({ projections, nestEggNeeded, projectedNestEgg, drawdown, milestones });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;