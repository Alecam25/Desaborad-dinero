import { ArrowRight, BarChart3, ListChecks, Wallet } from 'lucide-react'

export default function WelcomePage({
  session,
  onDashboard,
  onRegisterPayment,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10">
          <p className="text-emerald-300 font-semibold text-sm">
            Bienvenido, {session?.user?.email}
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold mt-3">
            Vamos a configurar tu dinero
          </h1>

          <p className="text-slate-300 mt-4 max-w-2xl leading-6">
            Para empezar bien, registra tu pago del mes. Con eso el sistema
            calcula el disponible inicial, tus límites diarios y la base para
            organizar tus gastos por categoría.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <article className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <Wallet className="h-6 w-6 text-emerald-300" aria-hidden="true" />
              <h2 className="font-bold mt-4">Registra tu pago</h2>
              <p className="text-sm text-slate-400 mt-2">
                Ingresa salario, moneda, fechas y ahorro.
              </p>
            </article>

            <article className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <ListChecks className="h-6 w-6 text-sky-300" aria-hidden="true" />
              <h2 className="font-bold mt-4">Ajusta tus gastos</h2>
              <p className="text-sm text-slate-400 mt-2">
                Crea gastos fijos y controla tus categorías diarias.
              </p>
            </article>

            <article className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <BarChart3 className="h-6 w-6 text-amber-300" aria-hidden="true" />
              <h2 className="font-bold mt-4">Revisa el resumen</h2>
              <p className="text-sm text-slate-400 mt-2">
                El dashboard se actualiza conforme registras movimientos.
              </p>
            </article>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={onRegisterPayment}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-3 rounded-xl transition"
            >
              Registrar mi primer pago
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onDashboard}
              className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl border border-slate-700 font-semibold"
            >
              Ir al dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
