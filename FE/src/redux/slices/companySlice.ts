// FIX: This file had 5 thunks all sharing the same "company/fetchCompany" type key,
// all doing GET /company — addCompany, deleteCompany, fetchCompanies, setSelectedCompany
// were all just copies of fetchCompany. Rewritten properly.
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Company } from "@/features/company/types";

interface CompanyState {
  company: Company | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: CompanyState = {
  company: null,
  loading: false,
  error: null,
  successMessage: null,
};

// NOTE: All async logic lives in features/company/company.slice.ts (plain async fns)
// consumed via React Query in features/company/useCompany.ts.
// This Redux slice is kept for any global company state that needs to be shared
// outside of React Query (e.g. selected company across pages).

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompany: (state, action: PayloadAction<Company>) => {
      state.company = action.payload;
    },
    clearCompany: (state) => {
      state.company = null;
    },
    clearCompanyMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
});

export const { setCompany, clearCompany, clearCompanyMessages } = companySlice.actions;
export default companySlice.reducer;
