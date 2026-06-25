import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCRC } from '../utils/financeCalculations'

export default function MonthlyHistory({ session }) {
  const [cycles, setCycles] = useState([])

  useEffect(() => {
    loadCycles()
  }, [])

  async function loadCycles() {
    const { data } = await supabase
      .from('monthly_cycles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('payment_date', { ascending: false })

    setCycles(data || [])
  }

  return (
    <section className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">Historial mensual</h2>

      <div className="overflow-x-auto">
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