import { api } from "../../services/api";

export interface Section {
  categoryId?: number;
  categoryName?: string;
  id?: string;
  title?: string;
  description?: string;
  questions: FormField[];
  weightage?: number;
}

export interface FormField {
  questionId?: number;
  questionText?: string;
  id?: string;
  text?: string;
  type?: 'RATING' | 'TEXT' | 'NUMBER' | 'YESNO';
  questionType?: string;
  secondaryQuestionType?: string;
  required?: boolean;
  isRequired?: boolean;
  weightage?: number;
}

export interface AppraisalForm {
  formId: number;
  formName: string;
  formType: string;
  cycleId?: number;
  cycleName?: string;
  id?: string;
  title?: string;
  description?: string;
  categories?: Section[];
  sections?: Section[];
  isAssigned?: boolean;
}

export interface AppraisalFormSet {
  id: number;
  name: string;
  cycleId: number;
  cycleName: string;
  selfAssessmentFormId: number;
  selfAssessmentFormName: string;
  managerEvaluationFormId: number;
  managerEvaluationFormName: string;
  isAssigned?: boolean;
}

export interface AppraisalCycle {
  id: number;
  name: string;
  cycleId: number;
  cycleName: string;
  startDate: string;
  endDate: string;
  evaluationPeriod: string;
  status: string;
  isActive: boolean;
  selfAssessmentDeadline?: string;
  managerEvaluationDeadline?: string;
  finalizationDeadline?: string;
  kpiWeight?: number;
  managerWeight?: number;
  selfWeight?: number;
  feedbackWeight?: number;
  financialYearId?: number;
  financialYearTitle?: string;
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
  financialYearId?: number;
  selfAssessmentDeadline?: string;
  managerEvaluationDeadline?: string;
  finalizationDeadline?: string;
}

const transformResponse = (response: any) => response?.data ?? response;

export const appraisalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Appraisal Cycles
    getCycles: builder.query<AppraisalCycle[], void>({
      query: () => '/appraisal-cycles',
      transformResponse: (response: any) => {
        let rawData = [];
        if (response && response.data) {
          rawData = response.data;
        } else if (Array.isArray(response)) {
          rawData = response;
        }

        if (!Array.isArray(rawData)) return [];

        return rawData.map((c: any) => ({
          ...c,
          id: c.cycleId || c.id,
          name: c.cycleName || c.name || `Cycle ${c.cycleId || c.id}`,
          isActive: c.isActive || c.status === 'ACTIVE'
        }));
      },
      providesTags: ['Cycle'],
    }),
    //Active Cycle
    getActiveCycle: builder.query<AppraisalCycle, void>({
      query: () => '/appraisal-cycles/active',
      transformResponse: (response: any) => {
        const data = response && response.data ? response.data : response;
        if (!data) return null;
        return {
          ...data,
          id: data.cycleId || data.id,
          name: data.cycleName || data.name
        };
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
    activateCycle: builder.mutation<AppraisalCycle, string | number>({
      query: (id) => ({
        url: `/appraisal-cycles/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: ['Cycle'],
    }),
    deactivateCycle: builder.mutation<AppraisalCycle, string | number>({
      query: (id) => ({
        url: `/appraisal-cycles/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['Cycle'],
    }),
    deleteAppraisalCycle: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `/appraisal-cycles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cycle'],
    }),

    getAppraisalForm: builder.query<AppraisalForm, string>({
      query: (id) => `/appraisal-forms/${id}`,
      transformResponse,
      providesTags: (_result, _error, id) => [{ type: 'Form', id }],
    }),

    // Appraisal Forms
    getAppraisalForms: builder.query<AppraisalForm[], void>({
      query: () => '/appraisal-forms',
      transformResponse,
      providesTags: (result) =>
        result
          ? [...result.map(({ formId }) => ({ type: 'Form' as const, id: formId })), { type: 'Form', id: 'LIST' }]
          : [{ type: 'Form', id: 'LIST' }],
    }),

    getAppraisalFormSets: builder.query<AppraisalFormSet[], number | void>({
      query: (cycleId) => cycleId ? `/appraisal-form-sets/cycle/${cycleId}` : '/appraisal-form-sets',
      transformResponse,
      providesTags: ['Form'],
    }),

    syncFormSets: builder.mutation<string, void>({
      query: () => ({
        url: '/appraisal-form-sets/sync',
        method: 'POST',
      }),
      invalidatesTags: ['Form'],
    }),

    createFormSet: builder.mutation<any, { name: string; cycleId: number }>({
      query: (body) => ({
        url: '/appraisal-form-sets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Form'],
    }),
    updateFormSet: builder.mutation<any, { id: number; body: { name: string; cycleId: number } }>({
      query: ({ id, body }) => ({
        url: `/appraisal-form-sets/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Form'],
    }),
    deleteFormSet: builder.mutation<any, number>({
      query: (id) => ({
        url: `/appraisal-form-sets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Form'],
    }),

    createAppraisalForm: builder.mutation<number, any>({
      query: (body) => ({
        url: '/appraisal-forms',
        method: 'POST',
        body,
      }),
      transformResponse,
      invalidatesTags: [{ type: 'Form', id: 'LIST' }],
    }),
    updateAppraisalForm: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/appraisal-forms/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Form', id }, { type: 'Form', id: 'LIST' }],
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
    getAppraisalsByCycle: builder.query<any[], number>({
      query: (cycleId) => `/appraisals/cycle/${cycleId}`,
      transformResponse,
      providesTags: ['Appraisal'],
    }),
    getTeamEvaluations: builder.query<any[], void>({
      query: () => '/appraisals/team-evaluations',
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

    saveDraft: builder.mutation<any, { selfAssessmentId: string; overallReflection: string }>({
      query: ({ selfAssessmentId, overallReflection }) => ({
        url: `/self-assessments/${selfAssessmentId}/draft`,
        method: 'POST',
        params: { overallReflection },
      }),
      invalidatesTags: ['Appraisal'],
    }),

    saveManagerDraft: builder.mutation<any, { evaluationId: string; finalComment: string }>({
      query: ({ evaluationId, finalComment }) => ({
        url: `/manager-evaluations/${evaluationId}/draft`,
        method: 'POST',
        params: { finalComment },
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
      transformResponse,
      invalidatesTags: (_result, _error, { formId }) => [{ type: 'Form', id: formId }],
    }),

    addQuestion: builder.mutation<number, { categoryId: number; questionText: string; questionType: string; secondaryQuestionType?: string | null; isRequired: boolean }>({
      query: ({ categoryId, ...body }) => ({
        url: `/appraisal-forms/categories/${categoryId}/questions`,
        method: 'POST',
        body: { ...body, categoryId },
      }),
      transformResponse,
      invalidatesTags: ['Form'], // Invalidate all forms since we don't have formId here
    }),

    assignBulk: builder.mutation<any, { cycleId: number; employeeIds: number[]; departmentIds?: number[]; formId?: number; formSetId?: number }>({
      query: (body) => ({
        url: '/appraisals/assign/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appraisal'],
    }),

    // getActiveCycle: builder.query<AppraisalCycle, void>({
    //   query: () => '/appraisal-cycles/active',
    //   transformResponse,
    //   providesTags: ['Cycle'],
    // }),

    // activateCycle: builder.mutation<AppraisalCycle, number>({
    //   query: (id) => ({
    //     url: `/appraisal-cycles/${id}/activate`,
    //     method: 'PUT',
    //   }),
    //   transformResponse,
    //   invalidatesTags: ['Cycle'],
    // }),

    closeCycle: builder.mutation<AppraisalCycle, number>({
      query: (id) => ({
        url: `/appraisal-cycles/${id}/close`,
        method: 'PUT',
      }),
      transformResponse,
      invalidatesTags: ['Cycle'],
    }),

    uploadEmployeeSignature: builder.mutation<void, { id: string, file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/appraisals/${id}/employee-signature`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Appraisal']
    }),

    uploadManagerSignature: builder.mutation<void, { id: string, file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/appraisals/${id}/manager-signature`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Appraisal']
    }),
    calculateScore: builder.mutation<any, string>({
      query: (id) => ({
        url: `/appraisals/${id}/calculate`,
        method: 'POST',
      }),
      invalidatesTags: ['Appraisal'],
    }),
    approveAppraisal: builder.mutation<any, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({
        url: `/appraisals/${id}/approve`,
        method: 'POST',
        params: { comment },
      }),
      invalidatesTags: ['Appraisal'],
    }),
    finalizeAppraisal: builder.mutation<any, string>({
      query: (id) => ({
        url: `/appraisals/${id}/finalize`,
        method: 'POST',
      }),
      invalidatesTags: ['Appraisal'],
    }),
    getScoreBreakdown: builder.query<any, string>({
      query: (id) => `/appraisals/${id}/calculate`,
      transformResponse,
      providesTags: ['Appraisal'],
    }),
  }),
});

export const {
  useGetCyclesQuery,
  useGetActiveCycleQuery,
  useCreateCycleMutation,
  useUpdateCycleMutation,
  useActivateCycleMutation,
  useDeactivateCycleMutation,
  useDeleteAppraisalCycleMutation,
  useCloseCycleMutation,
  useGetAppraisalFormQuery,
  useLazyGetAppraisalFormQuery,
  useGetAppraisalFormsQuery,
  useGetAppraisalFormSetsQuery,
  useSyncFormSetsMutation,
  useCreateFormSetMutation,
  useUpdateFormSetMutation,
  useDeleteFormSetMutation,
  useCreateAppraisalFormMutation,
  useUpdateAppraisalFormMutation,
  useGetCategoriesQuery,
  useGetAppraisalsQuery,
  useGetTeamEvaluationsQuery,
  useGetAppraisalsByCycleQuery,
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
  useSaveManagerDraftMutation,
  useLazyGetEmployeeAssessmentQuery,
  useGetDiagnosticHealthQuery,
  useAddCategoryMutation,
  useAddQuestionMutation,
  useAssignBulkMutation,
  useUploadEmployeeSignatureMutation,
  useUploadManagerSignatureMutation,
  useCalculateScoreMutation,
  useApproveAppraisalMutation,
  useFinalizeAppraisalMutation,
  useGetScoreBreakdownQuery,
} = appraisalApi;
