import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activitiesApi, adminApi } from '@/api/activities'
import { useAuthStore } from '@/store/authStore'
import type { ActivityCreate, ActivityUpdate, ActivityFilters, StatsFilters } from '@/types'

export function useActivities(filters: ActivityFilters = {}) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['activities', userId, filters],
    queryFn: () => activitiesApi.list(filters),
    enabled: !!userId,
  })
}

export function useActivityStats(filters: StatsFilters) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['activities', 'stats', userId, filters],
    queryFn: () => activitiesApi.stats(filters),
    enabled: !!userId,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: (data: ActivityCreate) => activitiesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities', userId] }),
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ActivityUpdate }) =>
      activitiesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities', userId] }),
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities', userId] }),
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
