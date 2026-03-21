import { useMutation, useQuery } from "@tanstack/react-query";
import API from "@/lib/api";

// Fetch the PDF blob and return a Blob URL + the server-assigned filename.
// Keeps blob-handling in one place so both download and print share it.
const fetchInvoiceBlob = async (data: any): Promise<{ blobUrl: string; fileName: string }> => {
  const res = await API.post("/invoice/save-invoice", data, {
    responseType: "blob",
  });

  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename[^;=\n]*=\s*(?:['"]?)([^'"\n;]+)/i);
  const fileName = match?.[1]?.trim() || `invoice_${Date.now()}.pdf`;

  const blobUrl = window.URL.createObjectURL(
    new Blob([res.data], { type: "application/pdf" })
  );

  return { blobUrl, fileName };
};

// ─── Download ─────────────────────────────────────────────────────────────────

export const useDownloadInvoice = () =>
  useMutation({
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
  });

const isMobile = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

export const usePrintInvoice = () =>
  useMutation({
    mutationFn: async (data: any) => {
      const { blobUrl, fileName } = await fetchInvoiceBlob(data);

      if (isMobile()) {
        // Mobile: open in new tab — iOS Safari and Android Chrome show a
        // native share/print button in the browser toolbar when a PDF is open.
        // Scripting window.print() on a blob URL is blocked on mobile browsers.
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
        // Don't revoke immediately — the new tab needs the blob URL to stay alive
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120_000);
        return;
      }

      // Desktop: hidden iframe + window.print() for seamless in-page print dialog
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;";
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
  });

// Keep old name as alias so nothing else breaks
export const useCreateInvoice = useDownloadInvoice;

// ─── List ─────────────────────────────────────────────────────────────────────

export const useInvoices = () =>
  useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await API.get("/invoice/list");
      return res.data.data || [];
    },
  });