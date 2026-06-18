import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, clearAuth, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = () => {
    authApi.logout()
    clearAuth()
    queryClient.clear()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="text-brand-600 font-bold text-lg tracking-tight">
                Activity Tracker
              </Link>
              <nav className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Shield className="h-4 w-4" />
                    Administración
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user?.full_name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
