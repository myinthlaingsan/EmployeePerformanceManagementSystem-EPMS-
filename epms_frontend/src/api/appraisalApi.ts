import api from './axios';
import type { Appraisal } from '../types/appraisal';

export const appraisalApi = {
  getAppraisals: async (params?: any) => {
    const response = await api.get<Appraisal[]>('/appraisals', { params });
    return response.data;
  },

  getAppraisalById: async (id: string) => {
    const response = await api.get<Appraisal>(`/appraisals/${id}`);
    return response.data;
  },

  // Self Assessment
  saveSelfAssessment: async (id: string, data: any) => {
    const response = await api.patch<Appraisal>(`/appraisals/${id}/self-assessment`, data);
    return response.data;
  },

  submitSelfAssessment: async (id: string, data: any) => {
    const response = await api.post<Appraisal>(`/appraisals/${id}/self-assessment/submit`, data);
    return response.data;
  },

  // Manager Evaluation
  saveManagerEvaluation: async (id: string, data: any) => {
    const response = await api.patch<Appraisal>(`/appraisals/${id}/manager-evaluation`, data);
    return response.data;
  },

  submitManagerEvaluation: async (id: string, data: any) => {
    const response = await api.post<Appraisal>(`/appraisals/${id}/manager-evaluation/submit`, data);
    return response.data;
  },

  // Sign Off
  signOff: async (id: string, role: 'EMPLOYEE' | 'MANAGER') => {
    const response = await api.post<Appraisal>(`/appraisals/${id}/sign-off`, { role });
    return response.data;
  },

  // Archive
  archiveAppraisal: async (id: string) => {
    const response = await api.post(`/appraisals/${id}/archive`);
    return response.data;
  },
};
