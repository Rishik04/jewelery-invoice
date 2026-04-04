import API from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Customer {
  _id?: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
}

export const useCustomers = () =>
  useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await API.get("/company/customer");
      return res.data.data || [];
    },
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Customer, "_id">) => API.post("/company/customer", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ _id, ...data }: Customer) =>
      API.put(`/customer/${_id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => API.delete(`/customer/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};
