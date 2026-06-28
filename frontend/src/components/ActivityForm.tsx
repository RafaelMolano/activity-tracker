import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreateActivity, useUpdateActivity } from '@/hooks/useActivities'
import { toast } from '@/hooks/use-toast'
import type { Activity } from '@/types'

const schema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido'),
    date: z.string().min(1, 'La fecha es requerida'),
    start_time: z.string().min(1, 'La hora de inicio es requerida'),
    end_time: z.string().min(1, 'La hora de fin es requerida'),
    tags: z.string(),
    observations: z.string().optional(),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: 'La hora de fin debe ser mayor a la de inicio',
    path: ['end_time'],
  })

type FormData = z.infer<typeof schema>

interface ActivityFormProps {
  open: boolean
  onClose: () => void
  activity?: Activity | null
}

export default function ActivityForm({ open, onClose, activity }: ActivityFormProps) {
  const createMutation = useCreateActivity()
  const updateMutation = useUpdateActivity()
  const isEditing = !!activity

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (activity) {
      reset({
        name: activity.name,
        date: activity.date,
        start_time: activity.start_time.slice(0, 5),
        end_time: activity.end_time.slice(0, 5),
        tags: activity.tags.join(', '),
        observations: activity.observations ?? '',
      })
    } else {
      reset({
        name: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        tags: '',
        observations: '',
      })
    }
  }, [activity, reset])

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      tags: data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : [],
      observations: data.observations?.trim() || null,
    }
    try {
      if (isEditing && activity) {
        await updateMutation.mutateAsync({ id: activity.id, data: payload })
        toast({ title: 'Actividad actualizada' })
      } else {
        await createMutation.mutateAsync(payload)
        toast({ title: 'Actividad creada', variant: 'success' })
      }
      onClose()
    } catch (error: unknown) {
      const msg =
        (error as any)?.response?.data?.detail?.[0]?.msg?.replace(/^Value error,\s*/, '') ??
        (error as any)?.response?.data?.detail ??
        'Error al guardar la actividad'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar actividad' : 'Nueva actividad'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre / Descripción</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Hora inicio</Label>
              <Input id="start_time" type="time" {...register('start_time')} />
              {errors.start_time && (
                <p className="text-xs text-red-600">{errors.start_time.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">Hora fin</Label>
              <Input id="end_time" type="time" {...register('end_time')} />
              {errors.end_time && (
                <p className="text-xs text-red-600">{errors.end_time.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (separados por coma)</Label>
            <Input id="tags" placeholder="reunion, desarrollo, soporte" {...register('tags')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea
              id="observations"
              placeholder="Notas adicionales sobre la actividad..."
              rows={3}
              {...register('observations')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? 'Guardar cambios' : 'Crear actividad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
