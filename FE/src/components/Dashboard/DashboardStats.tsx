import { useInvoiceStats } from "@/features/invoice/useInvoice";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import BestDayOfWeekCard from "../charts/BestDayOfWeek";
import JewelleryCategoryChart from "../charts/JewelleryCategoryChart";
import GoldPriceMakingCard from "../charts/GoldPriceMakingCharges";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

// ─── Component ────────────────────────────────────────────────────────────────

const ModernDashboardStats = () => {
  const { data: invoiceData, isLoading } = useInvoiceStats();
  const invoices = invoiceData?.data ?? [];

  const activeInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== "CANCELLED"),
    [invoices]
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
        name: MONTHS[month],
        invoices: monthInvoices.length,
        revenue: Math.round((revenue / 1000) * 10) / 10,
      };
    });
  }, [activeInvoices]);

  const hasMonthlyData = monthlyData.some((m) => m.invoices > 0);

  return (
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

      <JewelleryCategoryChart />
      <GoldPriceMakingCard />
      <BestDayOfWeekCard />
    </motion.div>
  );
};

export default ModernDashboardStats;