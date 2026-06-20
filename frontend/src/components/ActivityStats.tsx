import { useState } from 'react'
import { Calendar, Clock, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useActivityStats } from '@/hooks/useActivities'
import type { StatsFilters } from '@/types'

export default function ActivityStats() {
  const [filters, setFilters] = useState<StatsFilters>({
    group_by: 'day',
  })

  const today = new Date().toISOString().slice(0, 10)
  const monday = new Date()
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const mondayStr = monday.toISOString().slice(0, 10)

  const effectiveFilters: StatsFilters = {
    ...filters,
    date_from: filters.date_from || mondayStr,
    date_to: filters.date_to || today,
  }

  const { data, isLoading } = useActivityStats(effectiveFilters)

  const maxHours = data?.items.length
    ? Math.max(...data.items.map((i) => i.total_hours), 0.1)
    : 1

  const groupLabel = { day: 'Día', week: 'Semana', month: 'Mes' }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Agrupar por</label>
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((g) => (
              <Button
                key={g}
                variant={filters.group_by === g ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters((f) => ({ ...f, group_by: g }))}
              >
                {groupLabel[g]}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Desde</label>
          <Input
            type="date"
            className="w-36"
            value={filters.date_from ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
          <Input
            type="date"
            className="w-36"
            value={filters.date_to ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500 py-8 text-center">Cargando estadísticas...</div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-600" />
                  Total horas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.total_hours}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-600" />
                  Días con actividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.items.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-600" />
                  Promedio diario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {(data.total_hours / data.items.length).toFixed(1)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Detalle por {groupLabel[filters.group_by].toLowerCase()}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.items.map((item) => {
                const pct = (item.total_hours / maxHours) * 100
                return (
                  <div key={item.period} className="flex items-center gap-3">
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
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-sm text-gray-500 py-8 text-center">
          No hay actividades en el período seleccionado.
        </div>
      )}
    </div>
  )
}
