import api from '@/lib/api';
import { LoginData, RegisterData, AuthResponse, User } from '@/types/auth';

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', data.email);
    formData.append('password', data.password);
    
    const response = await api.post<AuthResponse>('/auth/login', formData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return typeof window !== 'undefined' && !!localStorage.getItem('token');
  }
};
