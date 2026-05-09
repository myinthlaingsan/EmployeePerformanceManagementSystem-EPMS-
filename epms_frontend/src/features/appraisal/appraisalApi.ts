import { api } from "../../services/api";

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: FormField[];
  weightage?: number;
}

export interface FormField {
  id: string;
  text: string;
  type: 'RATING' | 'TEXT' | 'NUMBER';
  required: boolean;
  weightage?: number;
}

export interface AppraisalForm {
  id: string;
  title: string;
  description?: string;
  sections: Section[];
}

export interface AppraisalCycle {
  cycleId: number;
  cycleName: string;
  startDate: string;
  endDate: string;
  evaluationPeriod: string;
  status: string;
}

export interface CycleRequest {
  cycleName: string;
  startDate: string;
  endDate: string;
  evaluationPeriod: string;
  status?: string;
  isActive?: boolean;
  kpiWeight?: number;
  managerWeight?: number;
  selfWeight?: number;
  feedbackWeight?: number;
}

const transformResponse = (response: any) => response.data;

export const appraisalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Appraisal Cycles
    getCycles: builder.query<AppraisalCycle[], void>({
      query: () => '/appraisal-cycles',
      transformResponse: (response: any) => {
        const data = response.data || response;
        if (Array.isArray(data)) {
          return data.map((c: any) => ({
            ...c,
            id: c.cycleId || c.id,
            name: c.cycleName || c.name
          }));
        }
        return data;
      },
      providesTags: ['Cycle'],
    }),
    //Active Cycle
    getActiveCycle: builder.query<AppraisalCycle, void>({
      query: () => '/appraisal-cycles/active',
      transformResponse: (response: any) => {
        const data = response.data || response;
        if (data && typeof data === 'object') {
          return {
            ...data,
            id: data.cycleId || data.id,
            name: data.cycleName || data.name
          };
        }
        return data;
      },
      providesTags: ['Cycle'],
    }),
    createCycle: builder.mutation<AppraisalCycle, CycleRequest>({
      query: (body) => ({
        url: '/appraisal-cycles',
        method: 'POST',
        body,
      }),
      transformResponse,
      invalidatesTags: ['Cycle'],
    }),
    updateCycle: builder.mutation<AppraisalCycle, { id: string; body: CycleRequest }>({
      query: ({ id, body }) => ({
        url: `/appraisal-cycles/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse,
      invalidatesTags: ['Cycle'],
    }),

    getAppraisalForm: builder.query<AppraisalForm, string>({
      query: (id) => `/appraisal-forms/${id}`,
      transformResponse,
      transformResponse: (response: any) => response.data || response,
      providesTags: ['Form'],
    }),

    // Appraisal Forms
    getAppraisalForms: builder.query<AppraisalForm[], void>({
      query: () => '/appraisal-forms',
      transformResponse,
      transformResponse: (response: { data: AppraisalForm[] }) => response.data,
      providesTags: ['Form'],
    }),
    createAppraisalForm: builder.mutation<number, any>({
      query: (body) => ({
        url: '/appraisal-forms',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Form'],
    }),
    updateAppraisalForm: builder.mutation<AppraisalForm, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/appraisal-forms/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse,
      invalidatesTags: ['Form'],
    }),

    // Categories
    getCategories: builder.query<any[], string>({
      query: (formId) => `/categories?formId=${formId}`,
      transformResponse,
      providesTags: ['Appraisal'],
    }),

    // Appraisals
    getAppraisals: builder.query<any[], void>({
      query: () => '/appraisals/my-assessments',
      transformResponse,
      providesTags: ['Appraisal'],
    }),
    createAppraisal: builder.mutation<any, any>({
      query: (body) => ({
        url: '/appraisals',
        method: 'POST',
        body,
      }),
      transformResponse,
      invalidatesTags: ['Appraisal'],
    }),
    getEmployeeAssessment: builder.query<any, string>({
      query: (appraisalId) => `/appraisals/${appraisalId}`,
      transformResponse,
      providesTags: ['Appraisal'],
    }),
    submitAppraisalSelf: builder.mutation<any, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({
        url: `/appraisals/${id}/employee-sign-off`,
        method: 'POST',
        params: { comment },
      }),
      invalidatesTags: ['Appraisal'],
    }),
    submitAppraisalManager: builder.mutation<any, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({
        url: `/appraisals/${id}/manager-sign-off`,
        method: 'POST',
        params: { comment },
      }),
      invalidatesTags: ['Appraisal'],
    }),

    // Self Assessments
    getSelfAssessmentForm: builder.query<any, string>({
      query: (appraisalId) => `/self-assessments/form/${appraisalId}`,
      transformResponse,
      providesTags: ['Appraisal'],
    }),
    saveSelfAssessmentAnswers: builder.mutation<any, { id: string; answers: any[] }>({
      query: ({ id, answers }) => ({
        url: `/self-assessments/${id}/answers`,
        method: 'POST',
        body: answers,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    submitSelfAssessment: builder.mutation<any, string>({
      query: (id) => ({
        url: `/self-assessments/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: ['Appraisal'],
    }),

    // Manager Evaluations
    getManagerEvaluationForm: builder.query<any, string>({
      query: (appraisalId) => `/manager-evaluations/form/${appraisalId}`,
      transformResponse,
      providesTags: ['Appraisal'],
    }),
    saveManagerEvaluationAnswers: builder.mutation<any, { id: string; answers: any[] }>({
      query: ({ id, answers }) => ({
        url: `/manager-evaluations/${id}/answers`,
        method: 'POST',
        body: answers,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    submitManagerEvaluation: builder.mutation<any, string>({
      query: (id) => ({
        url: `/manager-evaluations/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: ['Appraisal'],
    }),

    saveDraft: builder.mutation<any, { selfAssessmentId: string }>({
      query: ({ selfAssessmentId }) => ({
        url: `/self-assessments/${selfAssessmentId}/draft`,
        method: 'POST',
      }),
      invalidatesTags: ['Appraisal'],
    }),

    getDiagnosticHealth: builder.query<any, void>({
      query: () => '/public-diagnostics/health',
      transformResponse,
    }),

    addCategory: builder.mutation<number, { formId: number; categoryName: string }>({
      query: ({ formId, categoryName }) => ({
        url: `/appraisal-forms/${formId}/categories`,
        method: 'POST',
        body: { categoryName },
      }),
    }),

    addQuestion: builder.mutation<number, { categoryId: number; questionText: string; questionType: string; isRequired: boolean }>({
      query: ({ categoryId, ...body }) => ({
        url: `/categories/${categoryId}/questions`,
        method: 'POST',
        body: { ...body, categoryId },
      }),
    }),

    assignBulk: builder.mutation<any, { cycleId: number; employeeIds: number[]; departmentIds?: number[]; formId?: number }>({
      query: (body) => ({
        url: '/appraisals/assign/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appraisal'],
    }),
  }),
});

export const {
  useGetCyclesQuery,
  useGetActiveCycleQuery,
  useCreateCycleMutation,
  useUpdateCycleMutation,
  useGetAppraisalFormQuery,
  useGetAppraisalFormsQuery,
  useCreateAppraisalFormMutation,
  useUpdateAppraisalFormMutation,
  useGetCategoriesQuery,
  useGetAppraisalsQuery,
  useCreateAppraisalMutation,
  useGetEmployeeAssessmentQuery,
  useSubmitAppraisalSelfMutation,
  useSubmitAppraisalManagerMutation,
  useGetSelfAssessmentFormQuery,
  useSaveSelfAssessmentAnswersMutation,
  useSubmitSelfAssessmentMutation,
  useGetManagerEvaluationFormQuery,
  useSaveManagerEvaluationAnswersMutation,
  useSubmitManagerEvaluationMutation,
  useSaveDraftMutation,
  useLazyGetEmployeeAssessmentQuery,
  useGetDiagnosticHealthQuery,
  useAddCategoryMutation,
  useAddQuestionMutation,
  useAssignBulkMutation,
} = appraisalApi;
