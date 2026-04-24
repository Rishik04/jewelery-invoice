import { useInvoiceStats } from "@/features/invoice/useInvoice";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Matches dashboard palette:
// best day   → indigo  #6366f1  (Growth chart)
// second     → purple  #8b5cf6  (Daily Sales today-bar)
// rest       → cyan    #06b6d4  (Daily Sales gradient)
const getBarColor = (rank: number) => {
  if (rank === 0) return "#6366f1";
  if (rank === 1) return "#8b5cf6";
  return "#06b6d4";
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-gray-100 min-w-[160px]">
      <p className="font-semibold text-gray-800 mb-2 text-sm">{label}</p>
      <div className="text-sm space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Revenue</span>
          <span className="font-bold text-indigo-600">₹{d?.revenueK}K</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Invoices</span>
          <span className="font-bold text-gray-700">{d?.count}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Avg/invoice</span>
          <span className="font-bold text-gray-700">₹{d?.avgK}K</span>
        </div>
      </div>
    </div>
  );
};

const BestDayOfWeekCard = () => {
  const { data: invoiceData, isLoading } = useInvoiceStats();
  const invoices = invoiceData?.data ?? [];

  const activeInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== "CANCELLED"),
    [invoices]
  );

  const dayData = useMemo(() => {
    const map: Record<number, { revenue: number; count: number }> = {};
    for (let i = 0; i < 7; i++) map[i] = { revenue: 0, count: 0 };

    for (const inv of activeInvoices) {
      const day = new Date(inv.createdAt).getDay();
      map[day].revenue += inv.totalAmount ?? 0;
      map[day].count += 1;
    }

    const sorted = Object.entries(map)
      .map(([d, v]) => ({ day: Number(d), ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    return DAYS.map((name, i) => {
      const v = map[i];
      const rank = sorted.findIndex((s) => s.day === i);
      const revenueK = Math.round((v.revenue / 1000) * 10) / 10;
      const avgK = v.count > 0
        ? Math.round((v.revenue / v.count / 1000) * 10) / 10
        : 0;
      return { name, revenueK, count: v.count, avgK, rank };
    });
  }, [activeInvoices]);

  const bestDay = [...dayData].sort((a, b) => b.revenueK - a.revenueK)[0];
  const totalRevK = Math.round(dayData.reduce((s, d) => s + d.revenueK, 0) * 10) / 10;
  const busiestCount = Math.max(...dayData.map((d) => d.count));
  const busiestDay = dayData.find((d) => d.count === busiestCount);

  const hasData = dayData.some((d) => d.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-100 shadow-xl"
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Best Day of Week</h3>
          <p className="text-gray-500 text-sm">Revenue & invoices by weekday</p>
        </div>
        <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 p-3 rounded-2xl shadow-md shrink-0">
          <CalendarDays size={20} className="text-white" />
        </div>
      </div>

      {/* ── Summary pills ─────────────────────────────────────────────────── */}
      {hasData && (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-indigo-50 rounded-2xl px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
              Best revenue
            </p>
            <p className="text-lg font-bold text-indigo-700">{bestDay?.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">₹{bestDay?.revenueK}K Total</p>
          </div>
          <div className="flex-1 bg-purple-50 rounded-2xl px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">
              Most invoices
            </p>
            <p className="text-lg font-bold text-purple-700">{busiestDay?.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{busiestDay?.count} Invoices</p>
          </div>
          <div className="flex-1 bg-cyan-50 rounded-2xl px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1">
              Weekly Total
            </p>
            <p className="text-lg font-bold text-cyan-700">₹{totalRevK}K</p>
            <p className="text-xs text-gray-500 mt-0.5">All Combined</p>
          </div>
        </div>
      )}

      {/* ── Chart ─────────────────────────────────────────────────────────── */}
      <div className="h-[220px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm animate-pulse">
            Loading chart…
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No invoice data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dayData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              barCategoryGap="25%"
            >
              <defs>
                {[0, 1, 2].map((rank) => (
                  <linearGradient key={rank} id={`gDay${rank}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getBarColor(rank)} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={getBarColor(rank)} stopOpacity={0.6} />
                  </linearGradient>
                ))}
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
                unit="K"
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
              <Bar dataKey="revenueK" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {dayData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={`url(#gDay${Math.min(d.rank, 2)})`}
                    opacity={d.count === 0 ? 0.2 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Day rank legend ───────────────────────────────────────────────── */}
      {hasData && (
        <div className="flex gap-3 mt-4">
          {[
            { label: "Top day", color: "#6366f1" },
            { label: "2nd day", color: "#8b5cf6" },
            { label: "Other days", color: "#06b6d4" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BestDayOfWeekCard;