import { apiClient } from './client'
import type {
  Activity,
  ActivityCreate,
  ActivityUpdate,
  ActivityListResponse,
  ActivityFilters,
  ActivityStatsResponse,
  StatsFilters,
  AdminActivityListResponse,
  AdminSummaryFilters,
  AdminSummaryResponse,
  User,
} from '../types'

export const activitiesApi = {
  list: async (filters: ActivityFilters = {}): Promise<ActivityListResponse> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    const res = await apiClient.get<ActivityListResponse>('/activities', { params })
    return res.data
  },

  stats: async (filters: StatsFilters): Promise<ActivityStatsResponse> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    const res = await apiClient.get<ActivityStatsResponse>('/activities/stats', { params })
    return res.data
  },

  create: async (data: ActivityCreate): Promise<Activity> => {
    const res = await apiClient.post<Activity>('/activities', data)
    return res.data
  },

  update: async (id: string, data: ActivityUpdate): Promise<Activity> => {
    const res = await apiClient.put<Activity>(`/activities/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/activities/${id}`)
  },
}

export const adminApi = {
  listAllActivities: async (filters: ActivityFilters & { user_id?: string } = {}): Promise<AdminActivityListResponse> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    const res = await apiClient.get<AdminActivityListResponse>('/admin/activities', { params })
    return res.data
  },

  listSummary: async (filters: AdminSummaryFilters = {}): Promise<AdminSummaryResponse> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    const res = await apiClient.get<AdminSummaryResponse>('/admin/activities/summary', { params })
    return res.data
  },

  listUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/admin/users')
    return res.data
  },

  updateUser: async (id: string, data: { is_active?: boolean; role?: string }): Promise<User> => {
    const res = await apiClient.patch<User>(`/admin/users/${id}`, data)
    return res.data
  },
}
