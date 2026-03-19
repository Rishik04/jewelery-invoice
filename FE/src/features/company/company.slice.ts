import API from "../../lib/api";
import { Company } from "./types";

// Plain async functions used as React Query queryFn/mutationFn
// Plain async functions used as React Query queryFn/mutationFn

export const fetchCompany = async (): Promise<Company> => {
  const res = await API.get("/company");
  return res.data.data;
};

// FIX: updateCompany was calling PUT /company/update/:id but backend route is PUT /company/update (no id param)
export const updateCompany = async (company: any): Promise<Company> => {
  const { _id, ...data } = company;
  const res = await API.put("/company/update", data);
  return res.data.data;
};

// FIX: addCompany was a copy of fetchCompany (GET). Now correctly POSTs to /company/add
export const addCompany = async (data: any): Promise<Company> => {
  const res = await API.post("/company/add", data);
  return res.data.data;
};

// FIX: deleteCompany was a copy of fetchCompany (GET). Backend has no delete endpoint
// so we return null gracefully — implement on backend if needed
export const deleteCompany = async (_id: string): Promise<void> => {
  // Backend doesn't expose DELETE /company/:id yet
  // Uncomment when endpoint is added: await API.delete(`/company/${_id}`);
  console.warn("deleteCompany: no backend endpoint, skipping", _id);
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const res = await API.get("/company");
  // Backend returns a single company object (multi-tenant = 1 company per tenant)
  const data = res.data.data;
  return data ? [data] : [];
};
