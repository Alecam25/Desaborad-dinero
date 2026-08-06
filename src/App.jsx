import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RegisterPaymentPage from './pages/RegisterPaymentPage'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(() =>
    window.location.hash === '#/registrar-pago' ? 'register-payment' : 'dashboard'
  )

  useEffect(() => {
    async function getSession() {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function handleHashChange() {
      setPage(
        window.location.hash === '#/registrar-pago'
          ? 'register-payment'
          : 'dashboard'
      )
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  function goToDashboard() {
    window.location.hash = '#/'
    setPage('dashboard')
  }

  function goToRegisterPayment() {
    window.location.hash = '#/registrar-pago'
    setPage('register-payment')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return page === 'register-payment' ? (
    <RegisterPaymentPage session={session} onBack={goToDashboard} />
  ) : (
    <Dashboard session={session} onRegisterPayment={goToRegisterPayment} />
  )
}
