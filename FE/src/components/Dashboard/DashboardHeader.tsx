import { useCompany } from "@/features/company/useCompany";
import { useInvoiceStats } from "@/features/invoice/useInvoice";
import { motion } from "framer-motion";
import {
  Activity,
  Building2,
  Download,
  FileText,
  PlusCircle,
  Settings,
  Upload,
} from "lucide-react";


const formatINR = (amount: number) => {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
};

const getThisMonthRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime(),
  };
};

const getLastMonthRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(),
    end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime(),
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardHeaderProps {
  onNewCompany?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}

const DashboardHeader = ({
  onNewCompany,
  onImport,
  onExport,
  onSettings,
}: DashboardHeaderProps) => {
  const { data: invoiceData, isLoading: invoicesLoading } = useInvoiceStats();
  const { data: company, isLoading: companyLoading } = useCompany();

  const isLoading = invoicesLoading || companyLoading;

  // ── Derived stats from real invoice data ──────────────────────────────────
  const invoices = invoiceData?.data ?? [];
  const activeInvoices = invoices.filter((inv) => inv.status !== "CANCELLED");

  const { start: thisStart, end: thisEnd } = getThisMonthRange();
  const { start: lastStart, end: lastEnd } = getLastMonthRange();

  const thisMonthInvoices = activeInvoices.filter((inv) => {
    const t = new Date(inv.createdAt).getTime();
    return t >= thisStart && t <= thisEnd;
  });

  const lastMonthInvoices = activeInvoices.filter((inv) => {
    const t = new Date(inv.createdAt).getTime();
    return t >= lastStart && t <= lastEnd;
  });

  const totalRevenue = activeInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmount ?? 0),
    0
  );

  const thisMonthRevenue = thisMonthInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmount ?? 0),
    0
  );

  const lastMonthRevenue = lastMonthInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmount ?? 0),
    0
  );

  const revenueGrowth =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0
        ? 100
        : 0;

  const cancelRate =
    invoices.length > 0
      ? Math.round(
        ((invoices.length - activeInvoices.length) / invoices.length) * 100
      )
      : 0;
  const fulfillmentRate = 100 - cancelRate;

  // ── Quick Actions ─────────────────────────────────────────────────────────
  const quickActions = [
    { icon: PlusCircle, label: "New Company", action: onNewCompany },
    { icon: Upload, label: "Import Data", action: onImport },
    { icon: Download, label: "Export", action: onExport },
    { icon: Settings, label: "Settings", action: onSettings },
  ];

  // ── Stat cards ────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Total Revenue",
      value: isLoading ? "—" : formatINR(totalRevenue),
      change: isLoading
        ? "..."
        : revenueGrowth === 0
          ? "No change"
          : `${revenueGrowth > 0 ? "+" : ""}${revenueGrowth}% MoM`,
      positive: revenueGrowth >= 0,
      icon: FileText,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Total Invoices",
      value: isLoading ? "—" : String(invoiceData?.total ?? 0),
      change: isLoading
        ? "..."
        : `${thisMonthInvoices.length} this month`,
      positive: true,
      icon: FileText,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "This Month",
      value: isLoading ? "—" : formatINR(thisMonthRevenue),
      change: isLoading
        ? "..."
        : `${thisMonthInvoices.length} invoice${thisMonthInvoices.length !== 1 ? "s" : ""}`,
      positive: thisMonthRevenue > 0,
      icon: Activity,
      gradient: "from-purple-500 to-pink-600",
    },
    {
      label: "Fulfilment",
      value: isLoading ? "—" : `${fulfillmentRate}%`,
      change: isLoading
        ? "..."
        : cancelRate === 0
          ? "No cancellations"
          : `${cancelRate}% cancelled`,
      positive: fulfillmentRate >= 80,
      icon: Building2,
      gradient: "from-orange-500 to-red-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col xl:flex-row justify-between xl:items-start gap-8">

          {/* ── Left: Title + Quick Actions ─────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="text-white" size={24} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight truncate">
                    {companyLoading
                      ? "Loading…"
                      : company?.name ?? "Company Hub"}
                  </h1>
                  <p className="text-gray-500 text-sm sm:text-base font-medium mt-0.5 truncate">
                    {company?.gstin
                      ? `GSTIN: ${company.gstin}`
                      : "Centralized business management & analytics"}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={action.action}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40
                      text-gray-700 font-medium hover:bg-white hover:shadow-md transition-all duration-200 text-sm"
                  >
                    <action.icon size={15} />
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right: Stat Cards ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4 w-full xl:w-auto xl:min-w-[620px]">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 xl:p-5 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2.5 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}
                  >
                    <stat.icon size={18} className="text-white" />
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap max-w-[90px] truncate
                      ${stat.positive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                      }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="text-gray-500 text-xs font-medium mb-1 truncate">
                  {stat.label}
                </p>
                <p className="text-xl xl:text-2xl font-bold text-gray-900 tabular-nums">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;