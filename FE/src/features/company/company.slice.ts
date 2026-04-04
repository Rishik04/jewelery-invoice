import API from "../../lib/api";
import { Company } from "./types";

export const fetchCompany = async (): Promise<Company> => {
  const res = await API.get("/company");
  return res.data.data;
};

export const updateCompany = async (company: any): Promise<Company> => {
  const { _id, ...data } = company;
  const res = await API.put("/company/update", data);
  return res.data.data;
};

export const addCompany = async (data: any): Promise<Company> => {
  const res = await API.post("/company/add", data);
  return res.data.data;
};

export const deleteCompany = async (_id: string): Promise<void> => {
  console.warn("deleteCompany: no backend endpoint, skipping", _id);
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const res = await API.get("/company");
  const data = res.data.data;
  return data ? [data] : [];
};
