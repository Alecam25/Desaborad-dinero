import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCRC } from '../utils/financeCalculations'

export default function MonthlyHistory({ session }) {
  const [cycles, setCycles] = useState([])

  const loadCycles = useCallback(async () => {
    const { data } = await supabase
      .from('monthly_cycles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('payment_date', { ascending: false })

    setCycles(data || [])
  }, [session.user.id])

  useEffect(() => {
    loadCycles()
  }, [loadCycles])

  return (
    <section className="mt-6 sm:mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Historial mensual</h2>

      <div className="space-y-3 md:hidden">
        {cycles.length === 0 && (
          <p className="text-slate-400 text-sm">
            Todavía no tienes presupuestos registrados.
          </p>
        )}

        {cycles.map((cycle) => (
          <div
            key={cycle.id}
            className="bg-slate-800 rounded-xl p-4 border border-slate-700"
          >
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold">{cycle.month}</p>
              <span className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">
                {cycle.pay_frequency || 'monthly'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Ingreso</span>
                <span>{formatCRC(cycle.salary_crc)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Gastos fijos</span>
                <span>{formatCRC(cycle.fixed_expenses_total)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Ahorro</span>
                <span>{formatCRC(cycle.saving_amount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Disponible</span>
                <span>{formatCRC(cycle.available_amount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="text-left py-3">Mes</th>
              <th className="text-right py-3">Ingreso</th>
              <th className="text-right py-3">Gastos fijos</th>
              <th className="text-right py-3">Ahorro</th>
              <th className="text-right py-3">Disponible</th>
            </tr>
          </thead>

          <tbody>
            {cycles.map((cycle) => (
              <tr key={cycle.id} className="border-t border-slate-800">
                <td className="py-3">{cycle.month}</td>
                <td className="py-3 text-right">{formatCRC(cycle.salary_crc)}</td>
                <td className="py-3 text-right">{formatCRC(cycle.fixed_expenses_total)}</td>
                <td className="py-3 text-right">{formatCRC(cycle.saving_amount)}</td>
                <td className="py-3 text-right">{formatCRC(cycle.available_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
