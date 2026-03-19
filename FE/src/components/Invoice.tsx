import { useInvoices } from "@/features/invoice/useInvoice";
import { Link } from "react-router-dom";

// FIX: was using mock data with a fake fetchInvoicesFromDisk() — replaced with real API call
// FIX: re-declared Icon components that clash with lucide-react imports (renamed inline)

const InvoicePage = () => {
  const { data: invoices = [], isLoading: loading, error } = useInvoices();

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  All Invoices
                </h3>
                <p className="text-sm text-gray-500 mt-1">Browse and download generated invoices.</p>
              </div>
              <Link to="/:id/invoice"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                New Invoice
              </Link>
            </div>
          </div>

          <div className="p-6 pt-0">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
                Failed to load invoices.
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium mb-2">No invoices yet</p>
                <p className="text-sm">Create your first invoice to see it here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      {["Invoice #", "Customer", "Date", "Amount", "Actions"].map((h) => (
                        <th key={h} className="h-12 px-4 text-left font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv._id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3">{inv.customer?.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          ₹ {inv.totalAmount?.toLocaleString("en-IN") || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {inv.filePath ? (
                            <a href={`${import.meta.env.VITE_API_BASE_URL}/${inv.filePath}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                              Download
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">Processing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
