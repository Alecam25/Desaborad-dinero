import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RegisterPaymentPage from './pages/RegisterPaymentPage'
import CategoriesPage from './pages/CategoriesPage'
import MovementsPage from './pages/MovementsPage'
import AccountCreatedPage from './pages/AccountCreatedPage'
import WelcomePage from './pages/WelcomePage'

const PENDING_SIGNUP_EMAIL_KEY = 'desaborad-pending-signup-email'
const LAST_SIGNUP_EMAIL_KEY = 'desaborad-last-signup-email'

function readStoredSignupEmail() {
  try {
    return window.localStorage.getItem(LAST_SIGNUP_EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

function rememberSignupEmail(email) {
  try {
    window.localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email)
    window.localStorage.setItem(LAST_SIGNUP_EMAIL_KEY, email)
  } catch {
    // The auth flow still works if browser storage is unavailable.
  }
}

function isPendingSignupSession(session) {
  try {
    const pendingEmail = window.localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY)
    const sessionEmail = session?.user?.email

    if (!pendingEmail || !sessionEmail) return false

    return pendingEmail.toLowerCase() === sessionEmail.toLowerCase()
  } catch {
    return false
  }
}

function clearPendingSignupEmail() {
  try {
    window.localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY)
  } catch {
    // Nothing else is needed here.
  }
}

function getPageFromHash() {
  if (window.location.hash === '#/registrar-pago') {
    return 'register-payment'
  }

  if (window.location.hash === '#/categorias') {
    return 'categories'
  }

  if (window.location.hash === '#/movimientos') {
    return 'movements'
  }

  if (window.location.hash === '#/cuenta-creada') {
    return 'account-created'
  }

  if (window.location.hash === '#/bienvenida') {
    return 'welcome'
  }

  return 'dashboard'
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(() => getPageFromHash())
  const [signupEmail, setSignupEmail] = useState(() => readStoredSignupEmail())

  function goToWelcome() {
    window.location.hash = '#/bienvenida'
    setPage('welcome')
  }

  useEffect(() => {
    async function getSession() {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)

      if (isPendingSignupSession(data.session)) {
        setSignupEmail(data.session.user.email)
        clearPendingSignupEmail()
        goToWelcome()
      }

      setLoading(false)
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)

        if (isPendingSignupSession(session)) {
          setSignupEmail(session.user.email)
          clearPendingSignupEmail()
          goToWelcome()
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash())
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

  function goToCategories() {
    window.location.hash = '#/categorias'
    setPage('categories')
  }

  function goToMovements() {
    window.location.hash = '#/movimientos'
    setPage('movements')
  }

  function handleAccountCreated(email, hasActiveSession) {
    const normalizedEmail = email.trim()

    rememberSignupEmail(normalizedEmail)
    setSignupEmail(normalizedEmail)

    if (hasActiveSession) {
      goToWelcome()
      return
    }

    window.location.hash = '#/cuenta-creada'
    setPage('account-created')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!session) {
    if (page === 'account-created') {
      return (
        <AccountCreatedPage
          email={signupEmail}
          onBackToLogin={goToDashboard}
        />
      )
    }

    return <Login onAccountCreated={handleAccountCreated} />
  }

  if (page === 'register-payment') {
    return <RegisterPaymentPage session={session} onBack={goToDashboard} />
  }

  if (page === 'categories') {
    return <CategoriesPage session={session} onBack={goToDashboard} />
  }

  if (page === 'movements') {
    return (
      <MovementsPage
        session={session}
        onBack={goToDashboard}
        onManageCategories={goToCategories}
      />
    )
  }

  if (page === 'welcome') {
    return (
      <WelcomePage
        session={session}
        onDashboard={goToDashboard}
        onRegisterPayment={goToRegisterPayment}
      />
    )
  }

  return (
    <Dashboard
      session={session}
      onRegisterPayment={goToRegisterPayment}
      onMovements={goToMovements}
    />
  )
}
