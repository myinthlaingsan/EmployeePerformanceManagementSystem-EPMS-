import api from './axios';
import type { FormTemplate } from '../types/form';

export const formApi = {
  getForms: async () => {
    const response = await api.get<FormTemplate[]>('/forms');
    return response.data;
  },

  getFormById: async (id: string) => {
    const response = await api.get<FormTemplate>(`/forms/${id}`);
    return response.data;
  },

  createForm: async (data: Partial<FormTemplate>) => {
    const response = await api.post<FormTemplate>('/forms', data);
    return response.data;
  },

  updateForm: async (id: string, data: Partial<FormTemplate>) => {
    const response = await api.put<FormTemplate>(`/forms/${id}`, data);
    return response.data;
  },
};
