import { Request, Response } from 'express';
import { calculateFutureSavings } from '../utils/retirementMath';
import { RetirementPlan } from '../models/RetirementPlan';

export const getProjections = (req: Request, res: Response) => {
    const { currentSavings, annualContribution, yearsToRetirement, monthlySpending } = req.body;

    if (currentSavings === undefined || annualContribution === undefined || yearsToRetirement === undefined || monthlySpending === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const totalSavings = calculateFutureSavings(currentSavings, annualContribution, yearsToRetirement);
    const projectedMonthlyIncome = totalSavings / (yearsToRetirement * 12);

    const isOnTrack = projectedMonthlyIncome >= monthlySpending;

    const projection: RetirementPlan = {
        totalSavings,
        projectedMonthlyIncome,
        isOnTrack,
    };

    return res.status(200).json(projection);
};