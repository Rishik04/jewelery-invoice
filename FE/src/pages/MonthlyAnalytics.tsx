import { useInvoiceStats } from "@/features/invoice/useInvoice";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

// ─── FY helpers (Apr–Mar, matching Invoice.tsx logic) ────────────────────────
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const getCurrentFYStartYear = () => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

const getFYLabel = (startYear: number) =>
  `FY ${startYear}–${String(startYear + 1).slice(-2)}`;

// Returns 12 months Apr→Mar for a given FY start year
const getFYMonths = (startYear: number) =>
  Array.from({ length: 12 }, (_, i) => {
    const monthIdx = (3 + i) % 12;
    const year = monthIdx >= 3 ? startYear : startYear + 1;
    return { monthIdx, year, label: MONTHS_SHORT[monthIdx], key: `${year}-${monthIdx}` };
  });

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtK = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};
const fmtG = (n: number) => `${Number(n.toFixed(2))}g`;

// ─── Sub-components ───────────────────────────────────────────────────────────
const DivLabel = ({ label, color }: { label: string; color: string }) => (
  <p className={`text-[10px] font-bold uppercase tracking-widest ${color} mt-3 mb-1.5`}>{label}</p>
);

const StatRow = ({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: string }) => (
  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500">{label}</span>
    <div className="text-right">
      <span className={`text-sm font-bold ${accent ?? "text-gray-800"}`}>{value}</span>
      {sub && <span className="text-[10px] text-gray-400 ml-1">({sub})</span>}
    </div>
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface MonthStat {
  monthIdx: number;
  year: number;
  label: string;
  key: string;
  revenue: number;
  invoiceCount: number;
  gst: number;
  making: number;
  gold22g: number;
  gold22Rev: number;
  gold18g: number;
  gold18Rev: number;
  silverG: number;
  silverRev: number;
  isEmpty: boolean;
}

// ─── Month Card ───────────────────────────────────────────────────────────────
const MonthCard = ({ stat, index }: { stat: MonthStat; index: number }) => {
  const now = new Date();
  const isNow = stat.monthIdx === now.getMonth() && stat.year === now.getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className={`bg-white/80 backdrop-blur-lg rounded-3xl p-5 border shadow-lg flex flex-col
        ${isNow ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-100"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-lg font-bold text-gray-900">{stat.label}</p>
          <p className="text-xs text-gray-400">{stat.year}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {isNow && (
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">NOW</span>
          )}
          {stat.isEmpty
            ? <span className="text-[10px] font-semibold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">No data</span>
            : <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{stat.invoiceCount} inv</span>
          }
        </div>
      </div>

      {stat.isEmpty ? (
        <div className="flex-1 flex items-center justify-center h-24 text-gray-300 text-xs">
          No invoices this month
        </div>
      ) : (
        <>
          {/* Revenue section */}
          <DivLabel label="Revenue & Charges" color="text-indigo-400" />
          <StatRow label="Total Revenue"   value={fmtK(stat.revenue)} accent="text-indigo-700" />
          <StatRow label="GST Collected"   value={fmtK(stat.gst)}     accent="text-green-600" />
          <StatRow label="Making Charges"  value={fmtK(stat.making)}  accent="text-cyan-600" />

          {/* Gold section */}
          {(stat.gold22g > 0 || stat.gold18g > 0) && (
            <>
              <DivLabel label="Gold" color="text-amber-500" />
              {stat.gold22g > 0 && (
                <StatRow
                  label="22K Gold"
                  value={fmtG(stat.gold22g)}
                  sub={fmtK(stat.gold22Rev)}
                  accent="text-amber-600"
                />
              )}
              {stat.gold18g > 0 && (
                <StatRow
                  label="18K Gold"
                  value={fmtG(stat.gold18g)}
                  sub={fmtK(stat.gold18Rev)}
                  accent="text-amber-500"
                />
              )}
              {stat.gold22g > 0 && stat.gold18g > 0 && (
                <StatRow
                  label="Total Gold"
                  value={fmtG(stat.gold22g + stat.gold18g)}
                  accent="text-amber-700"
                />
              )}
            </>
          )}

          {/* Silver section */}
          {stat.silverG > 0 && (
            <>
              <DivLabel label="Silver" color="text-slate-400" />
              <StatRow
                label="Silver"
                value={fmtG(stat.silverG)}
                sub={fmtK(stat.silverRev)}
                accent="text-slate-600"
              />
            </>
          )}
        </>
      )}
    </motion.div>
  );
};

// ─── FY Total Summary Banner ──────────────────────────────────────────────────
const FYSummary = ({ stats, fyLabel }: { stats: MonthStat[]; fyLabel: string }) => {
  const totals = useMemo(() => {
    const active = stats.filter((s) => !s.isEmpty);
    return {
      revenue:  active.reduce((s, m) => s + m.revenue, 0),
      gst:      active.reduce((s, m) => s + m.gst, 0),
      making:   active.reduce((s, m) => s + m.making, 0),
      gold22g:  active.reduce((s, m) => s + m.gold22g, 0),
      gold18g:  active.reduce((s, m) => s + m.gold18g, 0),
      silverG:  active.reduce((s, m) => s + m.silverG, 0),
      invoices: active.reduce((s, m) => s + m.invoiceCount, 0),
    };
  }, [stats]);

  if (totals.invoices === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-3xl p-6 shadow-xl text-white"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-4">{fyLabel} — Total</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Revenue",  value: fmtK(totals.revenue) },
          { label: "GST",      value: fmtK(totals.gst) },
          { label: "Making",   value: fmtK(totals.making) },
          { label: "22K Gold", value: fmtG(totals.gold22g) },
          { label: "18K Gold", value: fmtG(totals.gold18g) },
          { label: "Silver",   value: fmtG(totals.silverG) },
          { label: "Invoices", value: totals.invoices.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">{label}</p>
            <p className="text-base font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const MonthlyAnalyticsPage = () => {
  const { data: invoiceData, isLoading } = useInvoiceStats();
  const allInvoices = invoiceData?.data ?? [];

  const currentFYStart = getCurrentFYStartYear();
  const [fyStart, setFyStart] = useState(currentFYStart);

  const fyMonths = useMemo(() => getFYMonths(fyStart), [fyStart]);

  const monthStats: MonthStat[] = useMemo(() => {
    return fyMonths.map(({ monthIdx, year, label, key }) => {
      const monthInvoices = allInvoices.filter((inv) => {
        if (inv.status === "CANCELLED") return false;
        const d = new Date(inv.createdAt);
        return d.getFullYear() === year && d.getMonth() === monthIdx;
      });

      if (monthInvoices.length === 0) {
        return {
          monthIdx, year, label, key,
          revenue: 0, invoiceCount: 0, gst: 0, making: 0,
          gold22g: 0, gold22Rev: 0, gold18g: 0, gold18Rev: 0,
          silverG: 0, silverRev: 0, isEmpty: true,
        };
      }

      let revenue = 0, gst = 0, making = 0;
      let gold22g = 0, gold22Rev = 0;
      let gold18g = 0, gold18Rev = 0;
      let silverG = 0, silverRev = 0;

      for (const inv of monthInvoices) {
        revenue += inv.totalAmount ?? 0;
        gst     += inv.tax ?? 0;

        for (const item of inv.items ?? []) {
          const cat   = (item.category ?? "").toUpperCase();
          const karat = item.karat ?? "";
          const wt    = item.weight ?? 0;
          const rev   = (item.total ?? 0) + (item.makingCharges ?? 0);

          making += item.makingCharges ?? 0;

          if (cat === "GOLD" && karat === "22K") { gold22g += wt; gold22Rev += rev; }
          if (cat === "GOLD" && karat === "18K") { gold18g += wt; gold18Rev += rev; }
          if (cat === "SILVER")                  { silverG += wt; silverRev += rev; }
        }
      }

      return {
        monthIdx, year, label, key,
        revenue, invoiceCount: monthInvoices.length,
        gst, making,
        gold22g, gold22Rev,
        gold18g, gold18Rev,
        silverG, silverRev,
        isEmpty: false,
      };
    });
  }, [allInvoices, fyMonths]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2.5 rounded-xl">
                <TrendingUp size={20} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Monthly Summary</h1>
            </div>
            <p className="text-gray-500 text-sm ml-14">
              Month-by-month breakdown · Gold (18K & 22K) · Silver · GST · Revenue
            </p>
          </div>

          {/* FY Toggler */}
          <div className="flex items-center gap-2 bg-white/80 border border-gray-200 rounded-2xl px-3 py-2 shadow-sm self-start sm:self-auto">
            <button
              onClick={() => setFyStart((y) => y - 1)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-800 min-w-[100px] text-center">
              {getFYLabel(fyStart)}
            </span>
            <button
              onClick={() => setFyStart((y) => y + 1)}
              disabled={fyStart >= currentFYStart}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </motion.div>

        {/* FY Summary banner */}
        {!isLoading && <FYSummary stats={monthStats} fyLabel={getFYLabel(fyStart)} />}

        {/* Month cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white/60 rounded-3xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <motion.div
            key={fyStart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {monthStats.map((stat, i) => (
              <MonthCard key={stat.key} stat={stat} index={i} />
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default MonthlyAnalyticsPage;