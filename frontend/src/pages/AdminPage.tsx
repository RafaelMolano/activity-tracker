import { useState } from 'react'
import Layout from '@/components/Layout'
import { useAdminActivities, useAdminUsers, useUpdateUser } from '@/hooks/useActivities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'

type Tab = 'users' | 'activities'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const { data: users } = useAdminUsers()
  const { data: activities } = useAdminActivities()
  const updateUserMutation = useUpdateUser()

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateUserMutation.mutateAsync({ id, data: { is_active: !isActive } })
      toast({ title: isActive ? 'Usuario desactivado' : 'Usuario activado', variant: 'success' })
    } catch {
      toast({ title: 'Error al actualizar el usuario', variant: 'destructive' })
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Administración</h1>

        <div className="flex gap-2 border-b border-gray-200">
          {(['users', 'activities'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'users' ? 'Usuarios' : 'Actividades'}
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities?.items.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell className="text-gray-400 text-xs font-mono">
                      {activity.user_id.slice(0, 8)}…
                    </TableCell>
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
      </div>
    </Layout>
  )
}
