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
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  frequency: string;
  status: 'Draft' | 'Active' | 'Closed';
}

export interface CycleRequest {
  name: string;
  startDate: string;
  endDate: string;
  frequency: string;
}

export interface AssessmentResponse {
  questionId: string;
  rating?: number;
  comment?: string;
}

export interface AssessmentPayload {
  appraisalId: string;
  responses: Record<string, { rating?: number; comment?: string }>;
}

export const appraisalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Appraisal Cycles
    getCycles: builder.query<AppraisalCycle[], void>({
      query: () => '/appraisal-cycles',
      transformResponse: (response: { data: AppraisalCycle[] }) => response.data,
      providesTags: ['Cycle'],
    }),
    //Active Cycle
    getActiveCycle: builder.query<AppraisalCycle, void>({
      query: () => '/appraisal-cycles/active',
      transformResponse: (response: { data: AppraisalCycle }) => response.data,
      providesTags: ['Cycle'],
    }),
    createCycle: builder.mutation<AppraisalCycle, CycleRequest>({
      query: (body) => ({
        url: '/appraisal-cycles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cycle'],
    }),
    updateCycle: builder.mutation<AppraisalCycle, { id: string; body: CycleRequest }>({
      query: ({ id, body }) => ({
        url: `/appraisal-cycles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Cycle'],
    }),

    getAppraisalForm: builder.query<AppraisalForm, string>({
      query: (id) => `/appraisal-forms/${id}`,
      transformResponse: (response: { data: AppraisalForm }) => response.data,
      providesTags: ['Form'],
    }),

    // Appraisal Forms
    getAppraisalForms: builder.query<AppraisalForm[], void>({
      query: () => '/appraisal-forms',
      transformResponse: (response: { data: AppraisalForm[] }) => response.data,
      providesTags: ['Form'],
    }),
    createAppraisalForm: builder.mutation<AppraisalForm, any>({
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
      invalidatesTags: ['Form'],
    }),

    // Categories
    getCategories: builder.query<any[], string>({
      query: (formId) => `/categories?formId=${formId}`,
      providesTags: ['Appraisal'],
    }),
    createCategory: builder.mutation<any, any>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appraisal'],
    }),

    // Questions
    getQuestions: builder.query<any[], string>({
      query: (categoryId) => `/questions?categoryId=${categoryId}`,
      providesTags: ['Appraisal'],
    }),
    createQuestion: builder.mutation<any, any>({
      query: (body) => ({
        url: '/questions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appraisal'],
    }),

    // Appraisals
    getAppraisals: builder.query<any[], void>({
      query: () => '/appraisals',
      providesTags: ['Appraisal'],
    }),
    createAppraisal: builder.mutation<any, any>({
      query: (body) => ({
        url: '/appraisals',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    getEmployeeAssessment: builder.query<any, string>({
      query: (appraisalId) => `/appraisals/${appraisalId}`,
      providesTags: ['Appraisal'],
    }),
    submitAppraisalSelf: builder.mutation<any, string>({
      query: (id) => ({
        url: `/appraisals/${id}/self-submit`,
        method: 'PUT',
      }),
      invalidatesTags: ['Appraisal'],
    }),
    submitAppraisalManager: builder.mutation<any, string>({
      query: (id) => ({
        url: `/appraisals/${id}/manager-submit`,
        method: 'PUT',
      }),
      invalidatesTags: ['Appraisal'],
    }),

    // Self Assessments
    createSelfAssessment: builder.mutation<any, any>({
      query: (body) => ({
        url: '/self-assessments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    submitSelfAssessment: builder.mutation<any, string>({
      query: (id) => ({
        url: `/self-assessments/${id}/submit`,
        method: 'PUT',
      }),
      invalidatesTags: ['Appraisal'],
    }),

    // Manager Evaluations
    createManagerEvaluation: builder.mutation<any, any>({
      query: (body) => ({
        url: '/manager-evaluations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    submitManagerEvaluation: builder.mutation<any, string>({
      query: (id) => ({
        url: `/manager-evaluations/${id}/submit`,
        method: 'PUT',
      }),
      invalidatesTags: ['Appraisal'],
    }),

    // Legacy/Draft compatibility
    saveDraft: builder.mutation<any, { appraisalId: string; data: any }>({
      query: ({ appraisalId, data }) => ({
        url: `/appraisals/${appraisalId}/draft`,
        method: 'POST',
        body: data,
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
  useCreateCategoryMutation,
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useGetAppraisalsQuery,
  useCreateAppraisalMutation,
  useGetEmployeeAssessmentQuery,
  useSubmitAppraisalSelfMutation,
  useSubmitAppraisalManagerMutation,
  useCreateSelfAssessmentMutation,
  useSubmitSelfAssessmentMutation,
  useCreateManagerEvaluationMutation,
  useSubmitManagerEvaluationMutation,
  useSaveDraftMutation,
  useLazyGetEmployeeAssessmentQuery,
} = appraisalApi;
