import { useCompany } from "@/features/company/useCompany";
import { useInvoiceStats } from "@/features/invoice/useInvoice";
import { motion } from "framer-motion";
import { MapPin, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


// ─── Tooltip ─────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-gray-100">
      {label && <p className="font-semibold text-gray-800 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const ModernDashboardStats = () => {
  const { data: company } = useCompany();
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
        // Show revenue in thousands, rounded to 1 decimal
        revenue: Math.round(revenue / 1000 * 10) / 10,
      };
    });
  }, [activeInvoices]);

  // ── Customer state distribution from invoice data ─────────────────────────
  const stateChartData = useMemo(() => {
    const stateCounts: Record<string, number> = {};

    for (const inv of activeInvoices) {
      const state =
        inv.customer?.address?.state ||
        inv.customer?.state ||
        inv.billingAddress?.state ||
        null;

      if (state) {
        stateCounts[state] = (stateCounts[state] ?? 0) + 1;
      }
    }

    // Fallback: if no customer state data, use company's own state as single entry
    if (Object.keys(stateCounts).length === 0 && company?.address?.state) {
      return [{ name: company.address.state, value: 1 }];
    }

    return Object.entries(stateCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // cap at 6 slices
  }, [activeInvoices, company]);

  const hasStateData = stateChartData.length > 0;
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
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  formatter={(v) => (
                    <span className="text-gray-600 font-medium">{v}</span>
                  )}
                />
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

      {/* ── State Distribution ─────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-100 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Customer States</h3>
            <p className="text-gray-500 text-sm">Invoice distribution by customer state</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-md shrink-0">
            <MapPin size={20} className="text-white" />
          </div>
        </div>

        <div className="h-[280px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm animate-pulse">
              Loading chart…
            </div>
          ) : !hasStateData ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No customer state data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateChartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {stateChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(v) => (
                    <span className="text-gray-600 font-medium">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ModernDashboardStats;