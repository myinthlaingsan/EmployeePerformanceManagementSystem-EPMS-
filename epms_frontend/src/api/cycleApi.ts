import api from './axios';
import type { Cycle } from '../types/cycle';

export const cycleApi = {
  getCycles: async () => {
    const response = await api.get<Cycle[]>('/cycles');
    return response.data;
  },

  getActiveCycle: async () => {
    const response = await api.get<Cycle>('/cycles/active');
    return response.data;
  },

  getCycleById: async (id: string) => {
    const response = await api.get<Cycle>(`/cycles/${id}`);
    return response.data;
  },

  createCycle: async (data: Partial<Cycle>) => {
    const response = await api.post<Cycle>('/cycles', data);
    return response.data;
  },

  updateCycle: async (id: string, data: Partial<Cycle>) => {
    const response = await api.put<Cycle>(`/cycles/${id}`, data);
    return response.data;
  },
};
