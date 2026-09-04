import { ArrowLeft, MailCheck } from 'lucide-react'

export default function AccountCreatedPage({ email, onBackToLogin }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 sm:px-6 flex items-center justify-center">
      <section className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center mb-6">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold">
          Cuenta creada
        </h1>

        <p className="text-slate-300 mt-4 leading-6">
          Te enviamos un correo de confirmación
          {email ? ` a ${email}` : ''}. Después de confirmar la cuenta,
          inicia sesión para configurar tu primer pago y empezar a llevar el control.
        </p>

        <div className="mt-6 bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <p className="text-sm text-slate-300">
            Si no ves el correo, revisa spam o promociones. Cuando confirmes,
            vuelve aquí e inicia sesión con la misma cuenta.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToLogin}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Ir a iniciar sesión
        </button>
      </section>
    </div>
  )
}
