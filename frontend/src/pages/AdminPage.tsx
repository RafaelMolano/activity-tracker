import { useState } from 'react'
import Layout from '@/components/Layout'
import { useAdminActivities, useAdminUsers, useAdminSummary, useUpdateUser } from '@/hooks/useActivities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'

type Tab = 'users' | 'activities' | 'summary'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [summaryGroupBy, setSummaryGroupBy] = useState<'day' | 'week' | 'month'>('day')
  const { data: users } = useAdminUsers()
  const { data: activities } = useAdminActivities()
  const { data: summary } = useAdminSummary({ group_by: summaryGroupBy })
  const updateUserMutation = useUpdateUser()

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateUserMutation.mutateAsync({ id, data: { is_active: !isActive } })
      toast({ title: isActive ? 'Usuario desactivado' : 'Usuario activado', variant: 'success' })
    } catch {
      toast({ title: 'Error al actualizar el usuario', variant: 'destructive' })
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Usuarios' },
    { key: 'activities', label: 'Actividades' },
    { key: 'summary', label: 'Resumen' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Administración</h1>

        <div className="flex gap-2 border-b border-gray-200">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-gray-500">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'outline'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(user.id, user.is_active)}
                      >
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === 'activities' && (
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities?.items.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell className="text-gray-700">{activity.user_full_name}</TableCell>
                    <TableCell className="text-gray-400 text-xs">{activity.user_email}</TableCell>
                    <TableCell className="text-gray-500 text-xs">{activity.date}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {activity.start_time.slice(0, 5)} — {activity.end_time.slice(0, 5)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {activity.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === 'summary' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Agrupar por:</span>
              {(['day', 'week', 'month'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSummaryGroupBy(g)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    summaryGroupBy === g
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {g === 'day' ? 'Día' : g === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
              {summary && (
                <span className="text-sm text-gray-500 ml-auto">
                  Total: {summary.total_hours} h
                </span>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Actividades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary?.items.map((item, i) => (
                    <TableRow key={`${item.user_id}-${item.period}-${i}`}>
                      <TableCell className="font-medium text-gray-700">
                        {item.user_full_name}
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">{item.period}</TableCell>
                      <TableCell className="text-sm font-mono">{item.total_hours} h</TableCell>
                      <TableCell className="text-sm text-gray-500">{item.count}</TableCell>
                    </TableRow>
                  ))}
                  {(!summary || summary.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                        No hay datos para el período seleccionado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
