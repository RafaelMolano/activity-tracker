import { apiClient } from './client'
import type { LoginCredentials, RegisterData, TokenResponse, User } from '../types'

export const authApi = {
  login: async (data: LoginCredentials): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', data)
    return res.data
  },

  register: async (data: RegisterData): Promise<User> => {
    const res = await apiClient.post<User>('/auth/register', data)
    return res.data
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me')
    return res.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
  },
}
