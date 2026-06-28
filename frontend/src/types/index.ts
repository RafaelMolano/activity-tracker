export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  name: string
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM:SS
  end_time: string    // HH:MM:SS
  tags: string[]
  observations: string | null
  created_at: string
  updated_at: string
}

export interface ActivityCreate {
  name: string
  date: string
  start_time: string
  end_time: string
  tags: string[]
  observations?: string | null
}

export interface ActivityUpdate extends Partial<ActivityCreate> {}

export interface ActivityListResponse {
  items: Activity[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface ActivityFilters {
  date_from?: string
  date_to?: string
  search?: string
  tags?: string
  page?: number
  page_size?: number
}

export interface ActivityStatsItem {
  period: string
  total_hours: number
  count: number
}

export interface ActivityStatsResponse {
  items: ActivityStatsItem[]
  total_hours: number
  group_by: string
  date_from: string
  date_to: string
}

export interface StatsFilters {
  date_from?: string
  date_to?: string
  group_by: 'day' | 'week' | 'month'
}

export interface AdminActivity extends Activity {
  user_full_name: string
  user_email: string
}

export interface AdminActivityListResponse {
  items: AdminActivity[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface AdminSummaryFilters {
  date_from?: string
  date_to?: string
  group_by?: 'day' | 'week' | 'month'
  user_id?: string
}

export interface AdminSummaryItem {
  user_id: string
  user_full_name: string
  period: string
  total_hours: number
  count: number
}

export interface AdminSummaryResponse {
  items: AdminSummaryItem[]
  total_hours: number
  group_by: string
  date_from: string
  date_to: string
}

export interface AdminAverageItem {
  user_id: string
  user_full_name: string
  avg_hours: number
  total_hours: number
  count: number
  periods: number
}

export interface AdminAverageResponse {
  items: AdminAverageItem[]
  team_avg: number
  group_by: string
  date_from: string
  date_to: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
}
