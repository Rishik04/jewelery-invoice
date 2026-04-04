import API from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const fetchInvoiceBlob = async (
  data: any,
): Promise<{ blobUrl: string; fileName: string }> => {
  const res = await API.post("/invoice/save-invoice", data, {
    responseType: "blob",
  });

  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename[^;=\n]*=\s*(?:['"]?)([^'"\n;]+)/i);
  const fileName = match?.[1]?.trim() || `invoice_${Date.now()}.pdf`;

  const blobUrl = window.URL.createObjectURL(
    new Blob([res.data], { type: "application/pdf" }),
  );

  return { blobUrl, fileName };
};

// ─── Download ─────────────────────────────────────────────────────────────────

export const useDownloadInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { blobUrl, fileName } = await fetchInvoiceBlob(data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

const isMobile = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );

export const usePrintInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { blobUrl, fileName } = await fetchInvoiceBlob(data);

      if (isMobile()) {
        const tab = window.open(blobUrl, "_blank");
        if (!tab) {
          // Popup was blocked — fall back to download
          const link = document.createElement("a");
          link.href = blobUrl;
          link.setAttribute("download", fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120_000);
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;width:0;height:0;border:0;opacity:0;";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Fallback if iframe print is blocked (rare)
          window.open(blobUrl, "_blank");
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(blobUrl);
        }, 60_000);
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useCreateInvoice = useDownloadInvoice;

// ─── List ─────────────────────────────────────────────────────────────────────

export const useInvoices = (page: Number, limit: Number) =>
  useQuery({
    queryKey: ["invoices", page],
    queryFn: async () => {
      const res = await API.get(`/invoice/list?page=${page}&limit=${limit}`);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

export const useCancelInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await API.put(`/invoice/${invoiceId}/cancel`);
      return res.data;
    },
    onSuccess: (_, invoiceId) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
  });
};

export const useInvoiceStats = () =>
  useQuery({
    queryKey: ["invoices", "stats"],
    queryFn: async () => {
      const res = await API.get("/invoice/list?page=1&limit=1000");
      return res.data as { data: any[]; total: number };
    },
    staleTime: 60_000,
  });

const fetchInvoicesZip = async (
  fy: string,
  month: string,
): Promise<{ blobUrl: string; fileName: string }> => {
  const res = await API.get(`/invoice/download?fy=${fy}&month=${month}`, {
    responseType: "blob",
  });

  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename[^;=\n]*=\s*(?:['"]?)([^'"\n;]+)/i);

  const fileName = match?.[1]?.trim() || `invoices-${fy}-${month}.zip`;

  const blobUrl = window.URL.createObjectURL(
    new Blob([res.data], { type: "application/zip" }),
  );
  return { blobUrl, fileName };
};

export const useBulkDownloadInvoices = () =>
  useMutation({
    mutationFn: async ({ fy, month }: { fy: string; month: string }) => {
      const { blobUrl, fileName } = await fetchInvoicesZip(fy, month);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
    },
  });
