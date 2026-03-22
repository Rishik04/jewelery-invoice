import { useCancelInvoice, useInvoices } from "@/features/invoice/useInvoice";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "./ConfirmDialog";

const InvoicePage = () => {
  const { data: invoices = [], isLoading: loading, error } = useInvoices();
  const cancelMutation = useCancelInvoice();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const handleCancel = (id: string) => {
    console.log(id)
    setSelectedInvoice(id);
  };

  const confirmCancel = () => {
    if (!selectedInvoice) return;

    cancelMutation.mutate(selectedInvoice, {
      onSuccess: () => {
        setSelectedInvoice(null);
      },
    });
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-lg border bg-white shadow-sm">

          {/* Header */}
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                📄 All Invoices
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Browse and manage invoices.
              </p>
            </div>

            <Link
              to="/:id/invoice"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 
                         bg-blue-600 text-white rounded-lg text-sm font-medium 
                         hover:bg-blue-700 transition-colors"
            >
              ➕ New Invoice
            </Link>
          </div>

          <div className="p-4 md:p-6 pt-0">

            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
                Failed to load invoices.
              </div>
            )}

            {/* Empty */}
            {!loading && invoices.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium mb-2">No invoices yet</p>
                <p className="text-sm">Create your first invoice.</p>
              </div>
            )}

            {/* ✅ DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    {["Invoice #", "Customer", "Date", "Amount", "Status", "Actions"].map((h) => (
                      <th key={h} className="h-12 px-4 text-left font-semibold text-gray-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">{inv.customer?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ₹ {inv.totalAmount?.toLocaleString("en-IN")}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                          ${inv.status === "CANCELLED"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"}`}>
                          {inv.status || "FINAL"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3 flex gap-3 items-center">

                        {/* Download */}
                        {inv.filePath && inv.status !== "CANCELLED" && (
                          <a
                            href={`${import.meta.env.VITE_API_BASE_URL}/${inv.filePath}`}
                            target="_blank"
                            className="text-blue-600 text-xs font-medium hover:underline"
                          >
                            Download
                          </a>
                        )}

                        {/* Cancel */}
                        {inv.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancel(inv._id)}
                            className="text-red-600 text-xs font-medium hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ MOBILE CARDS */}
            <div className="md:hidden space-y-3">
              {invoices.map((inv: any) => (
                <div key={inv._id} className="border rounded-lg p-4 shadow-sm">

                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-sm">{inv.invoiceNumber}</p>

                    <span className={`text-xs px-2 py-1 rounded-full 
                      ${inv.status === "CANCELLED"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"}`}>
                      {inv.status || "FINAL"}
                    </span>
                  </div>

                  <p className="text-sm">{inv.customer?.name || "—"}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                  </p>

                  <p className="font-bold mt-2">
                    ₹ {inv.totalAmount?.toLocaleString("en-IN")}
                  </p>

                  <div className="flex gap-4 mt-3 text-xs font-medium">

                    {inv.filePath && inv.status !== "CANCELLED" && (
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}/${inv.filePath}`}
                        target="_blank"
                        className="text-blue-600"
                      >
                        Download
                      </a>
                    )}

                    {inv.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleCancel(inv._id)}
                        className="text-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onConfirm={confirmCancel}
        loading={cancelMutation.isPending}
      />
    </div>
  );
};

export default InvoicePage;