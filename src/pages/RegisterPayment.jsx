import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  calculateSalaryCRC,
  calculateFixedExpensesTotal,
  calculateSavings,
  calculateAvailableAmount,
  calculateDailyLimit,
  formatCRC,
} from '../utils/financeCalculations'

export default function RegisterPayment({ session, onCycleCreated }) {
  const [salaryUsd, setSalaryUsd] = useState(930)
  const [exchangeRate, setExchangeRate] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [savingPercentage, setSavingPercentage] = useState(10)
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const salaryCRC = calculateSalaryCRC(salaryUsd, exchangeRate || 0)
  const fixedTotal = calculateFixedExpensesTotal(fixedExpenses, exchangeRate || 0)
  const afterFixed = salaryCRC - fixedTotal
 const savingAmount = calculateSavings(afterFixed, savingPercentage)
  const availableAmount = calculateAvailableAmount(salaryCRC, fixedTotal, savingAmount)
  const dailyLimit = calculateDailyLimit(availableAmount, 30)

  useEffect(() => {
    loadFixedExpenses()
  }, [])
async function seedFixedExpenses() {
  setLoading(true)
  setMessage('')

  const initialExpenses = [
    { name: 'Viáticos', amount: 100000, currency: 'CRC', due_day: 30, category: 'Transporte' },
    { name: 'Celular', amount: 12000, currency: 'CRC', due_day: 12, category: 'Obligaciones' },
    { name: 'Mami', amount: 30000, currency: 'CRC', due_day: 30, category: 'Familia' },
    { name: 'Seguro', amount: 30000, currency: 'CRC', due_day: 1, category: 'Seguro' },
    { name: 'Gym', amount: 18000, currency: 'CRC', due_day: 30, category: 'Salud' },
    { name: 'ChatGPT', amount: 20, currency: 'USD', due_day: 8, category: 'Suscripciones' },
  ]

  const expensesWithUser = initialExpenses.map((expense) => ({
    ...expense,
    user_id: session.user.id,
  }))

  const { error } = await supabase
    .from('fixed_expenses')
    .insert(expensesWithUser)

  setLoading(false)

  if (error) {
    setMessage(error.message)
    return
  }

  setMessage('Gastos fijos cargados correctamente.')
  loadFixedExpenses()
}
  async function loadFixedExpenses() {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)

    if (error) {
      setMessage(error.message)
      return
    }

    setFixedExpenses(data || [])
  }

  async function createMonthlyCycle(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const month = paymentDate.slice(0, 7)
    const { data: existingCycle } = await supabase
      .from('monthly_cycles')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('month', month)
      .maybeSingle()

    if (existingCycle) {
      setLoading(false)
      setMessage('Ya existe un presupuesto para este mes.')
      return
}

    const { error } = await supabase.from('monthly_cycles').insert({
      user_id: session.user.id,
      month,
      payment_date: paymentDate,
      salary_usd: Number(salaryUsd),
      exchange_rate: Number(exchangeRate),
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

    setMessage('Presupuesto mensual creado correctamente.')
    onCycleCreated?.()
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8">
      <h2 className="text-2xl font-bold mb-2">Registrar pago mensual</h2>
      <p className="text-slate-400 mb-6">
        Ingresa tu salario en dólares y el tipo de cambio del mes.
      </p>
      {fixedExpenses.length === 0 && (
        <button
            type="button"
            onClick={seedFixedExpenses}
            className="mb-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-xl text-sm"
        >
            Cargar mis gastos fijos iniciales
        </button>
        )}
      <form onSubmit={createMonthlyCycle} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">Salario USD</label>
          <input
            type="number"
            value={salaryUsd}
            onChange={(e) => setSalaryUsd(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Tipo de cambio</label>
          <input
            type="number"
            step="0.01"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Fecha de pago</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
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
          className="md:col-span-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Crear presupuesto del mes'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Ingreso CRC</p>
          <h3 className="text-xl font-bold">{formatCRC(salaryCRC)}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Gastos fijos</p>
          <h3 className="text-xl font-bold">{formatCRC(fixedTotal)}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Ahorro {savingPercentage}%</p>
          <h3 className="text-xl font-bold">{formatCRC(savingAmount)}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Disponible</p>
          <h3 className="text-xl font-bold">{formatCRC(availableAmount)}</h3>
        </div>
      </div>

      <p className="mt-4 text-slate-300">
        Límite diario recomendado: <strong>{formatCRC(dailyLimit)}</strong>
      </p>

      {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
    </div>
  )
}