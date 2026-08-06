import { useCallback, useEffect, useState } from 'react'
import FixedExpensesCard from '../components/FixedExpensesCard'
import RegisterPayment from './RegisterPayment'
import { supabase } from '../lib/supabaseClient'

export default function RegisterPaymentPage({ session, onBack }) {
  const [latestCycle, setLatestCycle] = useState(null)
  const [fixedExpenses, setFixedExpenses] = useState([])

  const loadLatestCycle = useCallback(async () => {
    const { data, error } = await supabase
      .from('monthly_cycles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error) {
      setLatestCycle(data)
    }
  }, [session.user.id])

  const loadFixedExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('due_day', { ascending: true })

    if (!error) {
      setFixedExpenses(data || [])
    }
  }, [session.user.id])

  useEffect(() => {
    loadLatestCycle()
    loadFixedExpenses()
  }, [loadFixedExpenses, loadLatestCycle])

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Registrar pago
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              Crea tu presupuesto y administra tus gastos fijos.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700"
          >
            Volver al dashboard
          </button>
        </header>

        <RegisterPayment
          session={session}
          fixedExpenses={fixedExpenses}
          onCycleCreated={loadLatestCycle}
        />

        <FixedExpensesCard
          session={session}
          expenses={fixedExpenses}
          exchangeRate={latestCycle?.exchange_rate || 0}
          onChange={loadFixedExpenses}
        />
      </div>
    </div>
  )
}
