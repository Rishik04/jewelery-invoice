import { useBulkDownloadInvoices, useCancelInvoice, useInvoices } from "@/features/invoice/useInvoice";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "./ConfirmDialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import API from "@/lib/api";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const getFYLabel = (startYear: number) =>
  `${startYear}-${String(startYear + 1).slice(-2)}`;

const getCurrentFYStartYear = () => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

const generateFYOptions = (count = 5) => {
  const currentStart = getCurrentFYStartYear();
  return Array.from({ length: count }, (_, i) => {
    const startYear = currentStart - i;
    const value = getFYLabel(startYear);
    return { value, label: `FY ${startYear}–${startYear + 1}` };
  });
};

const FY_OPTIONS = generateFYOptions(3);
const DEFAULT_FY = FY_OPTIONS[0].value;

const InvoicePage = () => {
  const cancelMutation = useCancelInvoice();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: invoiceData, isLoading: loading, error } = useInvoices(page, limit);
  // const invoiceById = useInvoiceById(selectedInvoice);
  const invoices = invoiceData?.data || [];
  const total = invoiceData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const [fy, setFy] = useState(DEFAULT_FY);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  const handleCancel = (id: string) => { setSelectedInvoice(id); setCategory("CANCEL") }
  const bulkDownloadMutation = useBulkDownloadInvoices();

  const handleBulkDownload = () => {
    bulkDownloadMutation.mutate({ fy, month });
  };

  const confirmCancel = () => {
    if (!selectedInvoice) return;
    cancelMutation.mutate(selectedInvoice, {
      onSuccess: () => {
        setSelectedInvoice(null);
        setPage((prev) => (prev > 1 ? prev - 1 : prev));
      },
    });
  };

  const handleInvoiceById = async (id: string) => {
    try {
      const res = await API.get(`/invoice/${id}/view`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(res.data);
      window.open(url, "_blank");

      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("Failed to open invoice", err);
    }
  };

  //   useEffect(() => {
  //   if (invoiceById) {
  //     // window.open(invoiceById.fileUrl, "_blank");
  //     window.open(invoiceById.data, "_blank")
  //     console.log(invoiceById)
  //   }
  // }, [invoiceById]);

  const handleDownload = async (id: string) => {
    try {
      const res = await API.get(`/invoice/${id}/view`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // create temporary link
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);

      link.click();

      // cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-sm">

          {/* ── Header ── */}
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  📄 All Invoices
                </CardTitle>
                <CardDescription className="mt-1">
                  Browse and manage invoices.
                </CardDescription>
              </div>

              <Button asChild className="w-full sm:w-auto">
                <Link to="/:id/invoice">
                  ➕ New Invoice
                </Link>
              </Button>
            </div>

            <Separator className="mt-4" />

            {/* ── Bulk Download ── */}
            <div className="flex flex-wrap gap-3 items-center pt-2">
              <Select value={fy} onValueChange={setFy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select FY" />
                </SelectTrigger>
                <SelectContent>
                  {FY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="default"
                className="bg-black hover:bg-zinc-800 text-white"
                onClick={handleBulkDownload}
                disabled={bulkDownloadMutation.isPending}
              >
                {bulkDownloadMutation.isPending ? "Downloading..." : "Download ZIP"}
              </Button>
              {bulkDownloadMutation.error && (
                <p className="text-red-500 text-xs mt-1">
                  {(bulkDownloadMutation.error as any)?.response?.status === 404
                    ? "No invoices for selected period"
                    : "Download failed"}
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">

            {/* ── Loading Skeletons ── */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg border border-red-100">
                Failed to load invoices. Please try again.
              </div>
            )}

            {/* ── Empty ── */}
            {!loading && !error && invoices.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium mb-1">No invoices yet</p>
                <p className="text-sm">Create your first invoice to get started.</p>
              </div>
            )}

            {/* ── Desktop Table ── */}
            {!loading && invoices.length > 0 && (
              <>
                <div className="hidden md:block rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        {["Invoice #", "Customer", "Date", "Amount", "Status", "Actions"].map((h) => (
                          <TableHead key={h} className="font-semibold text-foreground">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv: any) => (
                        <TableRow key={inv._id}>
                          <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.customer?.name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{inv.totalAmount?.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={inv.status === "CANCELLED" ? "destructive" : "default"}
                              className={
                                inv.status === "CANCELLED"
                                  ? "bg-red-100 text-red-600 hover:bg-red-100"
                                  : "bg-green-100 text-green-700 hover:bg-green-100"
                              }
                            >
                              {inv.status || "FINAL"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {inv.filePath && inv.status !== "CANCELLED" && (
                                <button
                                  // href={`${import.meta.env.VITE_API_BASE_URL}/${inv.filePath}`}
                                  onClick={() => handleInvoiceById(inv._id)}
                                  className="text-sm text-blue-600 font-medium hover:underline underline-offset-2"
                                >
                                  View
                                </button>
                              )}
                              {inv.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleDownload(inv._id)}
                                  className="text-sm text-blue-600 font-medium hover:underline underline-offset-2"
                                >
                                  Download
                                </button>
                              )}
                              {inv.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleCancel(inv._id)}
                                  className="text-sm text-red-600 font-medium hover:underline underline-offset-2"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* ── Mobile Cards ── */}
                <div className="md:hidden space-y-3">
                  {invoices.map((inv: any) => (
                    <Card key={inv._id} className="shadow-none border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold text-sm">{inv.invoiceNumber}</p>
                          <Badge
                            variant={inv.status === "CANCELLED" ? "destructive" : "default"}
                            className={
                              inv.status === "CANCELLED"
                                ? "bg-red-100 text-red-600 hover:bg-red-100"
                                : "bg-green-100 text-green-700 hover:bg-green-100"
                            }
                          >
                            {inv.status || "FINAL"}
                          </Badge>
                        </div>

                        <p className="text-sm text-foreground">{inv.customer?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                        </p>
                        <p className="font-bold text-base mt-2">
                          ₹{inv.totalAmount?.toLocaleString("en-IN")}
                        </p>

                        <div className="flex gap-4 mt-3 text-xs font-medium">
                          {inv.filePath && inv.status !== "CANCELLED" && (
                            <a
                              href={`${import.meta.env.VITE_API_BASE_URL}/${inv.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Download
                            </a>
                          )}
                          {inv.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleCancel(inv._id)}
                              className="text-red-600 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!selectedInvoice && category === "CANCEL"}
        onClose={() => setSelectedInvoice(null)}
        onConfirm={confirmCancel}
        loading={cancelMutation.isPending}
      />
    </div>
  );
};

export default InvoicePage;