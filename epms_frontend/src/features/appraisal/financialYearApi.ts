import { api } from "../../services/api";

export interface FinancialYear {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface FinancialYearRequest {
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export const financialYearApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFinancialYears: builder.query<FinancialYear[], void>({
      query: () => '/financial-years',
      providesTags: ['FinancialYear'],
    }),
    getCurrentFinancialYear: builder.query<FinancialYear, void>({
      query: () => '/financial-years/current',
      providesTags: ['FinancialYear'],
    }),
    createFinancialYear: builder.mutation<FinancialYear, FinancialYearRequest>({
      query: (body) => ({
        url: '/financial-years',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinancialYear'],
    }),
    setCurrentFinancialYear: builder.mutation<FinancialYear, number>({
      query: (id) => ({
        url: `/financial-years/${id}/set-current`,
        method: 'PATCH',
      }),
      invalidatesTags: ['FinancialYear'],
    }),
    deleteFinancialYear: builder.mutation<void, number>({
      query: (id) => ({
        url: `/financial-years/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinancialYear'],
    }),
    rolloverFinancialYear: builder.mutation<FinancialYear, void>({
      query: () => ({
        url: '/financial-years/rollover',
        method: 'POST',
      }),
      invalidatesTags: ['FinancialYear'],
    }),
  }),
});

export const {
  useGetFinancialYearsQuery,
  useGetCurrentFinancialYearQuery,
  useCreateFinancialYearMutation,
  useSetCurrentFinancialYearMutation,
  useDeleteFinancialYearMutation,
  useRolloverFinancialYearMutation,
} = financialYearApi;
