import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/api";

export interface Product {
  _id?: string;
  name: string;
  type: string;        // e.g. "Ring", "Necklace", "Bangle"
  category: "GOLD" | "SILVER" | "DIAMOND" | "PLATINUM";
  karat?: "14K" | "18K" | "22K" | "24K";
  hsnNumber?: string;
  companyId?: string;
  tenantId?: string;
  createdAt?: string;
}

// All products for the tenant
export const useProducts = (category?: string) => {
  return useQuery<Product[]>({
    queryKey: ["products", category ?? "all"],
    queryFn: async () => {
      if (category) {
        const res = await API.get(`/company/get-products/${category}`);
        return res.data.data || [];
      }
      const res = await API.get("/company/get-products");
      return res.data.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Product, "_id" | "hsnNumber" | "companyId" | "tenantId" | "createdAt">) =>
      API.post("/company/add-product", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => API.delete(`/company/product/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};