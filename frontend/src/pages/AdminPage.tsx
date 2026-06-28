import { useState } from 'react'
import Layout from '@/components/Layout'
import { useAdminActivities, useAdminUsers, useAdminSummary, useAdminAverage, useUpdateUser } from '@/hooks/useActivities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'

type Tab = 'users' | 'activities' | 'summary' | 'average'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [activitiesDateFrom, setActivitiesDateFrom] = useState('')
  const [activitiesDateTo, setActivitiesDateTo] = useState('')
  const [activitiesUserId, setActivitiesUserId] = useState('')
  const [summaryGroupBy, setSummaryGroupBy] = useState<'day' | 'week' | 'month'>('day')
  const [averageDateFrom, setAverageDateFrom] = useState('')
  const [averageDateTo, setAverageDateTo] = useState('')
  const [averageGroupBy, setAverageGroupBy] = useState<'day' | 'week' | 'month'>('day')

  const { data: users } = useAdminUsers()
  const { data: activities } = useAdminActivities({
    date_from: activitiesDateFrom || undefined,
    date_to: activitiesDateTo || undefined,
    user_id: activitiesUserId || undefined,
  })
  const { data: summary } = useAdminSummary({ group_by: summaryGroupBy })
  const { data: average } = useAdminAverage({
    date_from: averageDateFrom || undefined,
    date_to: averageDateTo || undefined,
    group_by: averageGroupBy,
  })
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
    { key: 'average', label: 'Promedio' },
  ]

  const maxHours = summary?.items.length
    ? Math.max(...summary.items.map((i) => i.total_hours), 0.1)
    : 1

  const maxAvg = average?.items.length
    ? Math.max(...average.items.map((i) => i.avg_hours), 0.1)
    : 1

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
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                <Input
                  type="date"
                  className="w-36"
                  value={activitiesDateFrom}
                  onChange={(e) => setActivitiesDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                <Input
                  type="date"
                  className="w-36"
                  value={activitiesDateTo}
                  onChange={(e) => setActivitiesDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Usuario</label>
                <select
                  value={activitiesUserId}
                  onChange={(e) => setActivitiesUserId(e.target.value)}
                  className="flex h-9 w-44 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Todos los usuarios</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                  {(!activities || activities.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                        No hay actividades con los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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

            {summary && summary.items.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const grouped: Record<string, typeof summary.items> = {}
                  for (const item of summary.items) {
                    if (!grouped[item.user_full_name]) {
                      grouped[item.user_full_name] = []
                    }
                    grouped[item.user_full_name].push(item)
                  }
                  return Object.entries(grouped).map(([userName, items]) => {
                    return (
                      <div key={userName} className="border border-gray-200 rounded-xl bg-white p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">{userName}</h3>
                        <div className="space-y-2">
                          {items.map((item) => {
                            const pct = (item.total_hours / maxHours) * 100
                            return (
                              <div key={`${item.user_id}-${item.period}`} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 w-24 shrink-0 font-mono">
                                  {item.period}
                                </span>
                                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold w-16 text-right tabular-nums">
                                  {item.total_hours}h
                                </span>
                                <span className="text-xs text-gray-400 w-10 text-right">
                                  {item.count} act.
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div className="text-sm text-gray-500 py-8 text-center">
                No hay datos para el período seleccionado.
              </div>
            )}
          </div>
        )}

        {tab === 'average' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                <Input
                  type="date"
                  className="w-36"
                  value={averageDateFrom}
                  onChange={(e) => setAverageDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                <Input
                  type="date"
                  className="w-36"
                  value={averageDateTo}
                  onChange={(e) => setAverageDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Agrupar por</label>
                <div className="flex gap-1">
                  {(['day', 'week', 'month'] as const).map((g) => (
                    <Button
                      key={g}
                      variant={averageGroupBy === g ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAverageGroupBy(g)}
                    >
                      {g === 'day' ? 'Día' : g === 'week' ? 'Semana' : 'Mes'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {average && average.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-xl bg-white p-4">
                    <p className="text-xs text-gray-500 mb-1">Promedio del equipo</p>
                    <p className="text-2xl font-bold">{average.team_avg} h</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl bg-white p-4">
                    <p className="text-xs text-gray-500 mb-1">Mejor promedio</p>
                    <p className="text-2xl font-bold">
                      {average.items[0]?.avg_hours ?? 0} h
                    </p>
                    <p className="text-xs text-gray-400">{average.items[0]?.user_full_name}</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl bg-white p-4">
                    <p className="text-xs text-gray-500 mb-1">Usuarios con actividad</p>
                    <p className="text-2xl font-bold">{average.items.length}</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Promedio de horas por {averageGroupBy === 'day' ? 'día' : averageGroupBy === 'week' ? 'semana' : 'mes'}
                  </h3>
                  <div className="space-y-3">
                    {average.items.map((item) => {
                      const pct = (item.avg_hours / maxAvg) * 100
                      const isAboveAvg = item.avg_hours > average.team_avg
                      return (
                        <div key={item.user_id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {item.user_full_name}
                            </span>
                            <span className="text-sm font-semibold tabular-nums">
                              {item.avg_hours} h
                              <span className="text-xs text-gray-400 ml-1">
                                /{averageGroupBy === 'day' ? 'día' : averageGroupBy === 'week' ? 'semana' : 'mes'}
                              </span>
                            </span>
                          </div>
                          <div className="relative">
                            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isAboveAvg ? 'bg-brand-500' : 'bg-amber-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div
                              className="absolute top-0 h-6 border-r-2 border-dashed border-gray-600"
                              style={{ left: `${(average.team_avg / maxAvg) * 100}%` }}
                              title="Promedio del equipo"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                            <span>{item.count} actividades en {item.periods} {averageGroupBy === 'day' ? 'días' : averageGroupBy === 'week' ? 'semanas' : 'meses'}</span>
                            <span>{item.total_hours}h totales</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500 py-8 text-center">
                No hay datos para el período seleccionado.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
