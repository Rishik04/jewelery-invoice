import { useInvoiceStats } from "@/features/invoice/useInvoice";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import BestDayOfWeekCard from "../charts/BestDayOfWeek";
import GoldPriceMakingCard from "../charts/GoldPriceMakingCharges";
import JewelleryCategoryChart from "../charts/JewelleryCategoryChart";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// ─── Tooltip ─────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-gray-100">
      {label && <p className="font-semibold text-gray-800 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-sm font-medium" style={{ color: p.color ?? p.fill }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const ModernDashboardStats = () => {
  const { data: invoiceData, isLoading } = useInvoiceStats();
  const allInvoices = invoiceData?.data ?? [];

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const prev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const next = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  // Filter to selected month, exclude cancelled
  const monthInvoices = useMemo(
    () =>
      allInvoices.filter((inv) => {
        if (inv.status === "CANCELLED") return false;
        const d = new Date(inv.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [allInvoices, year, month]
  );



  const activeInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.status !== "CANCELLED"),
    [allInvoices]
  );

  // ── Monthly growth data: last 6 calendar months ───────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const year = d.getFullYear();
      const month = d.getMonth();

      const monthInvoices = activeInvoices.filter((inv) => {
        const created = new Date(inv.createdAt);
        return created.getFullYear() === year && created.getMonth() === month;
      });

      const revenue = monthInvoices.reduce(
        (sum, inv) => sum + (inv.totalAmount ?? 0),
        0
      );

      return {
        name: MONTHS_SHORT[month],
        invoices: monthInvoices.length,
        revenue: Math.round((revenue / 1000) * 10) / 10,
      };
    });
  }, [activeInvoices]);

  const hasMonthlyData = monthlyData.some((m) => m.invoices > 0);

  return (
    <div className="space-y-6">
      {/* ── Month Picker ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Analytics</h2>
          <p className="text-sm text-gray-500">
            {monthInvoices.length} invoice{monthInvoices.length !== 1 ? "s" : ""} in {MONTHS_SHORT[month]} {year}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/80 border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
          <button
            onClick={prev}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>

          <span className="text-sm font-bold text-gray-800 min-w-[90px] text-center">
            {MONTHS_SHORT[month]} {year}
          </span>

          <button
            onClick={next}
            disabled={isCurrentMonth}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>

          {isCurrentMonth && (
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full ml-1">
              NOW
            </span>
          )}
        </div>
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* ── Growth Chart ───────────────────────────────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-100 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Growth Metrics</h3>
                <p className="text-gray-500 text-sm">Invoice count & revenue (₹K) — last 6 months</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl shadow-md shrink-0">
                <TrendingUp size={20} className="text-white" />
              </div>
            </div>

            <div className="h-[280px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm animate-pulse">
                  Loading chart…
                </div>
              ) : !hasMonthlyData ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No invoice data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₹K)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#gRev)"
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="invoices"
                      name="Invoices"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#gInv)"
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <JewelleryCategoryChart invoices={monthInvoices} isLoading={isLoading} />
          <GoldPriceMakingCard invoices={activeInvoices} currMonthlyInv={monthInvoices} isLoading={isLoading} />
          <BestDayOfWeekCard invoices={monthInvoices} isLoading={isLoading} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ModernDashboardStats;