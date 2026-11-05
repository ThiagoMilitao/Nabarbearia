import { lazy, Suspense, useEffect, useState } from 'react'
import LoginScreen from './pages/LoginScreen'
const PlatformApp = lazy(() => import('./PlatformApp'))
const PublicSite = lazy(() => import('./PublicSite'))
const ClientApp = lazy(() => import('./ClientApp'))
const StyleguideLayout = lazy(() => import('../app/styleguide/layout'))
const StyleguidePage = lazy(() => import('../app/styleguide/page'))
const BarberDashboard = lazy(() => import('./pages/BarberDashboard'))
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'))

export function navigateTo(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new Event('popstate'))
}

const CLIENT_ROUTES = new Set(['/home', '/mobile', '/perfil', '/meus-agendamentos', '/servico', '/detalhes', '/horarios', '/confirmacao'])

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  const cleanPath = currentPath.replace(/\/$/, '')
  const fallback = <main role="status" className="flex min-h-dvh items-center justify-center bg-background p-5 text-sm text-muted-foreground">Abrindo a NA Barbearia…</main>
  const renderLazy = (page: React.ReactNode) => <Suspense fallback={fallback}>{page}</Suspense>
  if (cleanPath === '/gestao' || cleanPath.startsWith('/gestao/')) return renderLazy(<OwnerDashboard path={cleanPath} onNavigate={navigateTo} />)
  if (CLIENT_ROUTES.has(cleanPath)) return renderLazy(<ClientApp path={cleanPath} onNavigate={navigateTo} />)
  if (cleanPath === '/barbeiro' || cleanPath.startsWith('/barbeiro/')) return renderLazy(<BarberDashboard />)
  if (cleanPath === '/login' || cleanPath === '/entrar' || cleanPath === '/cadastro') {
    return <LoginScreen key={cleanPath} initialMode={cleanPath === '/cadastro' ? 'register' : 'login'}
      onAuthenticated={(session) => navigateTo(session.user.roles.includes('owner') ? '/gestao/agenda-geral' : session.user.roles.includes('barber') ? '/barbeiro' : '/home')}
      onGuest={() => navigateTo('/home')} />
  }
  if (cleanPath === '/styleguide' || cleanPath.startsWith('/styleguide/')) {
    return renderLazy(<StyleguideLayout pathname={cleanPath}><StyleguidePage /></StyleguideLayout>)
  }
  return cleanPath === '/painel' || cleanPath === '/agendar'
    ? renderLazy(<PlatformApp />)
    : renderLazy(<PublicSite onNavigate={navigateTo} />)
}
