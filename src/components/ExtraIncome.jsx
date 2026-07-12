import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCRC } from '../utils/financeCalculations'

export default function ExtraIncome({
  session,
  cycle,
  incomes,
  onChange,
}) {
  const [incomeDate, setIncomeDate] = useState('')
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('CRC')
  const [exchangeRate, setExchangeRate] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = useCallback(() => {
    setIncomeDate('')
    setSource('')
    setAmount('')
    setCurrency('CRC')
    setExchangeRate('')
  }, [])

  useEffect(() => {
    resetForm()
    setMessage('')
  }, [cycle?.id, resetForm])

  if (!cycle) {
    return null
  }

  const amountNumber = Number(amount || 0)
  const exchangeRateNumber = currency === 'USD' ? Number(exchangeRate || 0) : 1
  const amountCRC = currency === 'USD'
    ? amountNumber * exchangeRateNumber
    : amountNumber

  const totalIncome = incomes.reduce(
    (total, income) => total + Number(income.amount_crc ?? income.amount),
    0
  )

  function formatIncomeAmount(income) {
    const incomeCurrency = income.currency || 'CRC'
    const incomeAmountCRC = Number(income.amount_crc ?? income.amount)

    if (incomeCurrency === 'USD') {
      return `$${Number(income.amount).toLocaleString()} / ${formatCRC(incomeAmountCRC)}`
    }

    return formatCRC(incomeAmountCRC)
  }

  async function saveIncome(e) {
    e.preventDefault()
    setMessage('')

    if (currency === 'USD' && exchangeRateNumber <= 0) {
      setMessage('Debes ingresar un tipo de cambio válido.')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('extra_incomes').insert({
      user_id: session.user.id,
      cycle_id: cycle.id,
      income_date: incomeDate,
      source,
      amount: amountNumber,
      currency,
      exchange_rate: exchangeRateNumber,
      amount_crc: amountCRC,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    resetForm()
    setMessage('Ingreso agregado correctamente.')
    onChange?.()
  }

  async function deleteIncome(id) {
    const { error } = await supabase
      .from('extra_incomes')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Ingreso eliminado correctamente.')
    onChange?.()
  }

  return (
    <section className="mt-6 sm:mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Ingresos extra
      </h2>

      <p className="text-slate-400 mb-6 text-sm sm:text-base">
        Agrega ingresos adicionales en colones o dólares para sumarlos al disponible actual.
      </p>

      <form
        onSubmit={saveIncome}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Fecha
          </label>
          <input
            type="date"
            value={incomeDate}
            onChange={(e) => setIncomeDate(e.target.value)}
            className="w-full min-w-0 rounded-xl bg-slate-800 border border-slate-700 px-3 sm:px-4 py-3 outline-none focus:border-emerald-500 text-sm sm:text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Origen
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ej: Freelance"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Monto
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Moneda
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="CRC">Colones</option>
            <option value="USD">Dólares</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Tipo de cambio
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            placeholder="Ej: 500"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500 disabled:opacity-50"
            disabled={currency === 'CRC'}
            required={currency === 'USD'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="self-end bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Agregar ingreso'}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Ingresos extra registrados</p>
          <h3 className="text-xl font-bold">{formatCRC(totalIncome)}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Monto convertido</p>
          <h3 className="text-xl font-bold">{formatCRC(amountCRC)}</h3>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-emerald-400">
          {message}
        </p>
      )}

      <div className="mt-6">
        <div className="space-y-3 md:hidden">
          {incomes.length === 0 && (
            <p className="text-slate-400 text-sm">
              Todavía no has registrado ingresos extra.
            </p>
          )}

          {incomes.map((income) => (
            <div
              key={income.id}
              className="bg-slate-800 rounded-xl p-4 border border-slate-700"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold">{income.source}</p>
                  <p className="text-sm text-slate-400">
                    {income.income_date}
                  </p>
                </div>

                <p className="font-bold">
                  {formatIncomeAmount(income)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => deleteIncome(income.id)}
                className="text-red-400 hover:text-red-300 text-sm mt-4"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left py-3">Fecha</th>
                <th className="text-left py-3">Origen</th>
                <th className="text-left py-3">Moneda</th>
                <th className="text-right py-3">Monto</th>
                <th className="text-right py-3">Acción</th>
              </tr>
            </thead>

            <tbody>
              {incomes.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="py-4 text-center text-slate-400"
                  >
                    Todavía no has registrado ingresos extra.
                  </td>
                </tr>
              )}

              {incomes.map((income) => (
                <tr key={income.id} className="border-t border-slate-800">
                  <td className="py-3">{income.income_date}</td>
                  <td className="py-3">{income.source}</td>
                  <td className="py-3">{income.currency || 'CRC'}</td>
                  <td className="py-3 text-right">{formatIncomeAmount(income)}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteIncome(income.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
