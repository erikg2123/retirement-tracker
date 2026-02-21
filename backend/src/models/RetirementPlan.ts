import { Schema, model } from 'mongoose';

interface RetirementPlan {
  totalSavings: number;
  annualContribution: number;
  retirementAge: number;
  currentAge: number;
  monthlySpending: number;
}

const retirementPlanSchema = new Schema<RetirementPlan>({
  totalSavings: { type: Number, required: true },
  annualContribution: { type: Number, required: true },
  retirementAge: { type: Number, required: true },
  currentAge: { type: Number, required: true },
  monthlySpending: { type: Number, required: true },
});

const RetirementPlanModel = model<RetirementPlan>('RetirementPlan', retirementPlanSchema);

export default RetirementPlanModel;