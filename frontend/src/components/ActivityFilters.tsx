import { useForm } from 'react-hook-form'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { ActivityFilters } from '@/types'

interface FilterFormData {
  search: string
  date_from: string
  date_to: string
  tags: string
}

interface ActivityFiltersProps {
  filters: ActivityFilters
  onChange: (filters: ActivityFilters) => void
}

export default function ActivityFilters({ filters, onChange }: ActivityFiltersProps) {
  const { register, handleSubmit, reset } = useForm<FilterFormData>({
    defaultValues: {
      search: filters.search ?? '',
      date_from: filters.date_from ?? '',
      date_to: filters.date_to ?? '',
      tags: filters.tags ?? '',
    },
  })

  const onSubmit = (data: FilterFormData) =>
    onChange({
      search: data.search || undefined,
      date_from: data.date_from || undefined,
      date_to: data.date_to || undefined,
      tags: data.tags || undefined,
      page: 1,
    })

  const handleClear = () => {
    reset({ search: '', date_from: '', date_to: '', tags: '' })
    onChange({ page: 1 })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <Input placeholder="Buscar actividades..." {...register('search')} />
      </div>
      <Input type="date" className="w-36" title="Desde" {...register('date_from')} />
      <Input type="date" className="w-36" title="Hasta" {...register('date_to')} />
      <Input placeholder="tags, separados por coma" className="w-44" {...register('tags')} />
      <Button type="submit" size="sm">
        <Search className="h-4 w-4" />
        Buscar
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleClear}>
        <X className="h-4 w-4" />
        Limpiar
      </Button>
    </form>
  )
}
