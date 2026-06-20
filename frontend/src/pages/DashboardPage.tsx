import { useState } from 'react'
import { Plus, List, BarChart3 } from 'lucide-react'
import Layout from '@/components/Layout'
import ActivityFilters from '@/components/ActivityFilters'
import ActivityList from '@/components/ActivityList'
import ActivityForm from '@/components/ActivityForm'
import ActivityStats from '@/components/ActivityStats'
import { Button } from '@/components/ui/button'
import { useActivities } from '@/hooks/useActivities'
import type { Activity, ActivityFilters as Filters } from '@/types'

type ViewMode = 'list' | 'stats'

export default function DashboardPage() {
  const [view, setView] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<Filters>({ page: 1, page_size: 10 })
  const [formOpen, setFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  const { data, isLoading } = useActivities(filters)

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditingActivity(null)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Mis actividades</h1>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
              <Button
                variant={view === 'stats' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('stats')}
              >
                <BarChart3 className="h-4 w-4" />
                Resumen
              </Button>
            </div>
            {view === 'list' && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Nueva actividad
              </Button>
            )}
          </div>
        </div>

        {view === 'list' ? (
          <>
            <ActivityFilters filters={filters} onChange={setFilters} />
            <ActivityList
              data={data}
              isLoading={isLoading}
              page={filters.page ?? 1}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              onEdit={handleEdit}
            />
          </>
        ) : (
          <ActivityStats />
        )}
      </div>
      <ActivityForm open={formOpen} onClose={handleClose} activity={editingActivity} />
    </Layout>
  )
}
