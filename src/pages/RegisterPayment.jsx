import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  calculateSalaryCRC,
  calculateFixedExpensesTotal,
  calculateSavings,
  calculateAvailableAmount,
  calculateDailyLimit,
  formatCRC,
} from '../utils/financeCalculations'

export default function RegisterPayment({
  session,
  fixedExpenses = [],
  onCycleCreated,
}) {
  const [salaryAmount, setSalaryAmount] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [nextPaymentDate, setNextPaymentDate] = useState('')
  const [payFrequency, setPayFrequency] = useState('monthly')
  const [savingPercentage, setSavingPercentage] = useState(10)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const hasUsdFixedExpenses = fixedExpenses.some(
    (expense) => expense.currency === 'USD'
  )

  const exchangeRateRequired = salaryCurrency === 'USD' || hasUsdFixedExpenses

  const exchangeRateForCalculations = exchangeRateRequired
    ? Number(exchangeRate || 0)
    : 1

  function calculateDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return 30

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)

    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    return diff > 0 ? diff : 30
  }

  const salaryCRC =
    salaryCurrency === 'USD'
      ? calculateSalaryCRC(salaryAmount, exchangeRateForCalculations)
      : Number(salaryAmount || 0)

  const fixedTotal = calculateFixedExpensesTotal(
    fixedExpenses,
    exchangeRateForCalculations
  )

  const afterFixed = salaryCRC - fixedTotal
  const savingAmount = calculateSavings(afterFixed, savingPercentage)

  const availableAmount = calculateAvailableAmount(
    salaryCRC,
    fixedTotal,
    savingAmount
  )

  const daysUntilNextPayment = calculateDaysBetween(
    paymentDate,
    nextPaymentDate
  )

  const dailyLimit = calculateDailyLimit(
    availableAmount,
    daysUntilNextPayment
  )

  async function createMonthlyCycle(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (exchangeRateRequired && Number(exchangeRate) <= 0) {
      setLoading(false)
      setMessage('Debes ingresar un tipo de cambio válido.')
      return
    }

    const month = paymentDate.slice(0, 7)

    const { data: existingCycle } = await supabase
      .from('monthly_cycles')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('payment_date', paymentDate)
      .maybeSingle()

    if (existingCycle) {
      setLoading(false)
      setMessage('Ya existe un presupuesto registrado para esta fecha de pago.')
      return
    }

    const { error } = await supabase.from('monthly_cycles').insert({
      user_id: session.user.id,
      month,
      payment_date: paymentDate,
      next_payment_date: nextPaymentDate,
      pay_frequency: payFrequency,
      days_until_next_payment: daysUntilNextPayment,
      salary_currency: salaryCurrency,
      salary_amount: Number(salaryAmount),
      salary_usd: salaryCurrency === 'USD' ? Number(salaryAmount) : 0,
      exchange_rate: exchangeRateRequired
        ? Number(exchangeRate)
        : 1,
      salary_crc: salaryCRC,
      fixed_expenses_total: fixedTotal,
      saving_percentage: Number(savingPercentage),
      saving_amount: savingAmount,
      available_amount: availableAmount,
      daily_limit: dailyLimit,
      financial_status: 'green',
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Presupuesto creado correctamente.')
    onCycleCreated?.()
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mt-6 sm:mt-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Registrar pago
      </h2>

      <p className="text-slate-400 mb-6 text-sm sm:text-base">
        Ingresa tu salario, moneda, tipo de cambio, frecuencia de pago y porcentaje de ahorro.
      </p>

      {fixedExpenses.length === 0 && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-xl text-sm">
          Aún no tienes gastos fijos. Puedes crear tu presupuesto sin gastos fijos,
          o agregarlos abajo en la sección de gastos fijos.
        </div>
      )}

      <form
        onSubmit={createMonthlyCycle}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4"
      >
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Salario
          </label>
          <input
            type="number"
            value={salaryAmount}
            onChange={(e) => setSalaryAmount(e.target.value)}
            placeholder={salaryCurrency === 'USD' ? 'Ej: 1000' : 'Ej: 500000'}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Moneda
          </label>
          <select
            value={salaryCurrency}
            onChange={(e) => setSalaryCurrency(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="USD">Dólares</option>
            <option value="CRC">Colones</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Tipo de cambio
          </label>
          <input
            type="number"
            step="0.01"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            placeholder="Ej: 500"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required={exchangeRateRequired}
          />
          {!exchangeRateRequired && (
            <p className="text-xs text-slate-500 mt-1">
              No requerido si todo está en colones.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Fecha de pago
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full min-w-0 rounded-xl bg-slate-800 border border-slate-700 px-3 sm:px-4 py-3 outline-none focus:border-emerald-500 text-sm sm:text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Próximo pago
          </label>
          <input
            type="date"
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.target.value)}
            className="w-full min-w-0 rounded-xl bg-slate-800 border border-slate-700 px-3 sm:px-4 py-3 outline-none focus:border-emerald-500 text-sm sm:text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Frecuencia
          </label>
          <select
            value={payFrequency}
            onChange={(e) => setPayFrequency(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="monthly">Mensual</option>
            <option value="biweekly">Quincenal</option>
            <option value="weekly">Semanal</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Ahorro %
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={savingPercentage}
            onChange={(e) => setSavingPercentage(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 lg:col-span-3 xl:col-span-7 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Crear presupuesto'}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
        <div className="bg-slate-800 rounded-xl p-4 min-h-[90px] flex flex-col justify-between">
          <p className="text-slate-400 text-sm">Ingreso CRC</p>
          <h3 className="text-xl font-bold break-words">
            {formatCRC(salaryCRC)}
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 min-h-[90px] flex flex-col justify-between">
          <p className="text-slate-400 text-sm">Gastos fijos</p>
          <h3 className="text-xl font-bold break-words">
            {formatCRC(fixedTotal)}
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 min-h-[90px] flex flex-col justify-between">
          <p className="text-slate-400 text-sm">
            Ahorro {savingPercentage}%
          </p>
          <h3 className="text-xl font-bold break-words">
            {formatCRC(savingAmount)}
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 min-h-[90px] flex flex-col justify-between">
          <p className="text-slate-400 text-sm">Disponible</p>
          <h3 className="text-xl font-bold break-words">
            {formatCRC(availableAmount)}
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 min-h-[90px] flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <p className="text-slate-400 text-sm">Días disponibles</p>
          <h3 className="text-xl font-bold">
            {daysUntilNextPayment}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-slate-300 text-sm sm:text-base">
        Límite diario recomendado:{' '}
        <strong className="text-white">
          {formatCRC(dailyLimit)}
        </strong>
      </p>

      {message && (
        <p className="mt-4 text-sm text-emerald-400">
          {message}
        </p>
      )}
    </div>
  )
}
