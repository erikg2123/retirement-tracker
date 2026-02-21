export function futureValue(principal: number, annualRate: number, years: number): number {
    return principal * Math.pow((1 + annualRate), years);
}

export function calculateRetirementSavings(
    currentSavings: number,
    annualContribution: number,
    annualRate: number,
    yearsUntilRetirement: number
): number {
    let totalSavings = currentSavings;

    for (let i = 0; i < yearsUntilRetirement; i++) {
        totalSavings = futureValue(totalSavings, annualRate, 1) + annualContribution;
    }

    return totalSavings;
}

export function calculateMonthlyWithdrawal(
    totalSavings: number,
    withdrawalRate: number
): number {
    return totalSavings * withdrawalRate / 12;
}

export function adjustForInflation(amount: number, inflationRate: number, years: number): number {
    return amount * Math.pow((1 + inflationRate), years);
}