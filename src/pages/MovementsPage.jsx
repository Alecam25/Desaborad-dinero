import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import ExtraIncome from '../components/ExtraIncome'
import { supabase } from '../lib/supabaseClient'
import DailyExpenses from './DailyExpenses'

export default function MovementsPage({
  session,
  onBack,
  onManageCategories,
}) {
  const [latestCycle, setLatestCycle] = useState(null)
  const [extraIncomes, setExtraIncomes] = useState([])

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

  const loadExtraIncomes = useCallback(async () => {
    if (!latestCycle) return

    const { data, error } = await supabase
      .from('extra_incomes')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('cycle_id', latestCycle.id)
      .order('income_date', { ascending: false })

    if (!error) {
      setExtraIncomes(data || [])
    }
  }, [latestCycle, session.user.id])

  useEffect(() => {
    loadLatestCycle()
  }, [loadLatestCycle])

  useEffect(() => {
    if (latestCycle) {
      loadExtraIncomes()
    } else {
      setExtraIncomes([])
    }
  }, [latestCycle, loadExtraIncomes])

  const totalExtraIncome = extraIncomes.reduce(
    (total, income) => total + Number(income.amount_crc ?? income.amount),
    0
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Gastos e ingresos
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              Registra tus gastos diarios y cualquier ingreso extra del mes.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al dashboard
          </button>
        </header>

        {latestCycle ? (
          <>
            <DailyExpenses
              session={session}
              cycle={latestCycle}
              extraIncomeTotal={totalExtraIncome}
              onManageCategories={onManageCategories}
            />

            <ExtraIncome
              session={session}
              cycle={latestCycle}
              incomes={extraIncomes}
              onChange={loadExtraIncomes}
            />
          </>
        ) : (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-2">
              Todavía no hay un pago registrado
            </h2>
            <p className="text-slate-400">
              Registra tu primer pago para empezar a controlar gastos diarios e ingresos extra.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
