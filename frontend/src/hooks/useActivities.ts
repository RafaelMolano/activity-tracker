import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activitiesApi, adminApi } from '@/api/activities'
import type { ActivityCreate, ActivityUpdate, ActivityFilters } from '@/types'

export function useActivities(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: ['activities', filters],
    queryFn: () => activitiesApi.list(filters),
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ActivityCreate) => activitiesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ActivityUpdate }) =>
      activitiesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  })
}

export function useAdminActivities(filters: ActivityFilters & { user_id?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'activities', filters],
    queryFn: () => adminApi.listAllActivities(filters),
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { is_active?: boolean; role?: string } }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
