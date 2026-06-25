export function calculateSalaryCRC(salaryUsd, exchangeRate) {
  return Number(salaryUsd) * Number(exchangeRate)
}

export function calculateFixedExpensesTotal(fixedExpenses, exchangeRate) {
  return fixedExpenses.reduce((total, expense) => {
    if (expense.currency === 'USD') {
      return total + Number(expense.amount) * Number(exchangeRate)
    }

    return total + Number(expense.amount)
  }, 0)
}

export function calculateSavings(amountAfterFixedExpenses, percentage = 10) {
  return Number(amountAfterFixedExpenses) * (Number(percentage) / 100)
}

export function calculateAvailableAmount(salaryCRC, fixedExpensesTotal, savingAmount) {
  return Number(salaryCRC) - Number(fixedExpensesTotal) - Number(savingAmount)
}

export function calculateDailyLimit(availableAmount, daysUntilNextPayment = 30) {
  if (daysUntilNextPayment <= 0) return availableAmount
  return Number(availableAmount) / Number(daysUntilNextPayment)
}

export function formatCRC(amount) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}