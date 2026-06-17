import { useState } from 'react'
import { Pencil, Trash2, Clock, Tag, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDeleteActivity } from '@/hooks/useActivities'
import { toast } from '@/hooks/use-toast'
import type { Activity, ActivityListResponse } from '@/types'

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

interface ActivityListProps {
  data?: ActivityListResponse
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  onEdit: (activity: Activity) => void
}

export default function ActivityList({
  data,
  isLoading,
  page,
  onPageChange,
  onEdit,
}: ActivityListProps) {
  const deleteMutation = useDeleteActivity()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta actividad?')) return
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
      toast({ title: 'Actividad eliminada' })
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        No hay actividades registradas.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white overflow-hidden">
        {data.items.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors"
          >
            <div className="space-y-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">{activity.name}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatDate(activity.date)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.start_time.slice(0, 5)} — {activity.end_time.slice(0, 5)}
                </span>
              </div>
              {activity.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-gray-400" />
                  {activity.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {activity.observations && (
                <div className="flex items-start gap-1 text-xs text-gray-500">
                  <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{activity.observations}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 ml-4 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => onEdit(activity)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(activity.id)}
                disabled={deletingId === activity.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} actividades en total</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <span className="px-2">
              {page} / {data.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pages}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
