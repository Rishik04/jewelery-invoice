import { useMutation, useQuery } from "@tanstack/react-query";
import API from "@/lib/api";

// FIX: invoice create returns a PDF blob (binary), must set responseType: "blob"
// then trigger a browser download
export const useCreateInvoice = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await API.post("/invoice/save-invoice", data, {
        responseType: "blob",
      });
      // Trigger file download in browser
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      const invoiceNumber = data.invoiceNumber || "invoice";
      link.href = url;
      link.setAttribute("download", `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return res;
    },
  });
};

// Fetch invoice list from the new GET /invoice/list endpoint
export const useInvoices = () => {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await API.get("/invoice/list");
      return res.data.data || [];
    },
  });
};
