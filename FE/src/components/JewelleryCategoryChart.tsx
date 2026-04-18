import { useInvoiceStats } from "@/features/invoice/useInvoice";
import { motion } from "framer-motion";
import { Gem } from "lucide-react";
import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const TABS = [
    {
        key: "GOLD_22K",
        label: "Gold 22K",
        cat: "GOLD",
        karat: "22K",
        barFrom: "#8b5cf6",   // purple start — ties to Daily Sales today-bar
        barTo: "#a855f7",   // indigo end   — ties to Growth chart
        gradId: "gTab22K",
        active: "bg-indigo-50 text-indigo-700 border-indigo-200",
        inactive: "text-gray-500 hover:text-indigo-600",
        pill: "bg-indigo-50",
        pillText: "text-indigo-700",
        pillBadge: "bg-indigo-100",
        dot: "#6366f1",
    },
    {
        key: "GOLD_18K",
        label: "Gold 18K",
        cat: "GOLD",
        karat: "18K",
        barFrom: "#8b5cf6",   // purple start — ties to Daily Sales today-bar
        barTo: "#a855f7",   // violet end
        gradId: "gTab18K",
        active: "bg-purple-50 text-purple-700 border-purple-200",
        inactive: "text-gray-500 hover:text-purple-600",
        pill: "bg-purple-50",
        pillText: "text-purple-700",
        pillBadge: "bg-purple-100",
        dot: "#8b5cf6",
    },
    {
        key: "SILVER",
        label: "Silver",
        cat: "SILVER",
        karat: null,         // all karats
        barFrom: "#06b6d4",   // cyan start  — ties to Daily Sales gradient
        barTo: "#6366f1",   // indigo end
        gradId: "gTabSilver",
        active: "bg-cyan-50 text-cyan-700 border-cyan-200",
        inactive: "text-gray-500 hover:text-cyan-600",
        pill: "bg-cyan-50",
        pillText: "text-cyan-700",
        pillBadge: "bg-cyan-100",
        dot: "#06b6d4",
    },
] as const;

type TabKey = typeof TABS[number]["key"];

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, tabDot }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-gray-100 min-w-[170px]">
            <p className="font-semibold text-gray-800 mb-2 text-sm">{label}</p>
            <div className="text-sm space-y-1">
                <div className="flex justify-between gap-6">
                    <span className="text-gray-500">Weight</span>
                    <span className="font-bold" style={{ color: tabDot }}>{d?.weight}g</span>
                </div>
                <div className="flex justify-between gap-6">
                    <span className="text-gray-500">Revenue</span>
                    <span className="font-bold text-gray-800">₹{d?.revenueK}K</span>
                </div>
                <div className="flex justify-between gap-6">
                    <span className="text-gray-500">Qty sold</span>
                    <span className="font-bold text-gray-600">{d?.count}</span>
                </div>
            </div>
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────
const JewelleryCategoryChart = () => {
    const { data: invoiceData, isLoading } = useInvoiceStats();
    const invoices = invoiceData?.data ?? [];

    const [activeTab, setActiveTab] = useState<TabKey>("GOLD_22K");

    const activeInvoices = useMemo(
        () => invoices.filter((inv) => inv.status !== "CANCELLED"),
        [invoices]
    );

    // ── Per-tab aggregated data ───────────────────────────────────────────────
    const tabData = useMemo(() => {
        const result: Record<TabKey, {
            items: { name: string; weight: number; revenueK: number; count: number }[];
            totalWeight: number;
            totalRevenueK: number;
            totalCount: number;
        }> = {} as any;

        for (const tab of TABS) {
            const map: Record<string, { weight: number; revenue: number; count: number }> = {};

            for (const inv of activeInvoices) {
                for (const item of inv.items ?? []) {
                    const cat = (item.category ?? "").toUpperCase();
                    const karat = item.karat ?? "";

                    const catMatch = cat === tab.cat;
                    const karatMatch = tab.karat === null || karat === tab.karat;
                    if (!catMatch || !karatMatch) continue;

                    const key = item.name?.trim() ?? "Unknown";
                    if (!map[key]) map[key] = { weight: 0, revenue: 0, count: 0 };
                    map[key].weight += item.weight ?? 0;
                    map[key].revenue += item.total ?? 0;
                    map[key].count += item.quantity ?? 1;
                }
            }

            const items = Object.entries(map)
                .map(([name, v]) => ({
                    name,
                    weight: v.weight,
                    revenueK: Math.round((v.revenue / 1000) * 10) / 10,
                    count: v.count,
                }))
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 8);                         // top 8

            const totalWeight = items.reduce((s, i) => s + i.weight, 0);
            const totalRevenueK = Math.round(items.reduce((s, i) => s + i.revenueK, 0) * 10) / 10;
            const totalCount = items.reduce((s, i) => s + i.count, 0);

            result[tab.key] = { items, totalWeight, totalRevenueK, totalCount };
        }
        return result;
    }, [activeInvoices]);

    // ── Visible tabs (only show tabs with data) ───────────────────────────────
    const visibleTabs = TABS.filter((t) => tabData[t.key]?.items.length > 0);

    const currentTab = TABS.find((t) => t.key === activeTab) ?? TABS[0];
    const currentData = tabData[activeTab];
    const chartHeight = Math.max(180, (currentData?.items.length ?? 0) * 44);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-100 shadow-xl"
        >
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Items Sold by Weight</h3>
                    <p className="text-gray-500 text-sm">Top 8 items per karat — total grams sold</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-2xl shadow-md shrink-0">
                    <Gem size={20} className="text-white" />
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────────── */}
            <div className="flex gap-2 mb-5">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
              px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all duration-200
              ${activeTab === tab.key
                                ? tab.active + " shadow-sm"
                                : "bg-transparent border-transparent " + tab.inactive}
            `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Summary pill for active tab ───────────────────────────────────── */}
            {currentData && currentData.totalCount > 0 && (
                <div className={`flex gap-3 mb-5`}>
                    <div className={`flex-1 ${currentTab.pill} rounded-2xl px-4 py-3`}>
                        <p className={`text-xs font-bold uppercase tracking-widest ${currentTab.pillText} mb-1`}>
                            Total weight
                        </p>
                        <p className={`text-lg font-bold ${currentTab.pillText}`}>{currentData.totalWeight}g</p>
                    </div>
                    <div className={`flex-1 ${currentTab.pill} rounded-2xl px-4 py-3`}>
                        <p className={`text-xs font-bold uppercase tracking-widest ${currentTab.pillText} mb-1`}>
                            Revenue
                        </p>
                        <p className={`text-lg font-bold ${currentTab.pillText}`}>₹{currentData.totalRevenueK}K</p>
                    </div>
                    <div className={`flex-1 ${currentTab.pill} rounded-2xl px-4 py-3`}>
                        <p className={`text-xs font-bold uppercase tracking-widest ${currentTab.pillText} mb-1`}>
                            Items sold
                        </p>
                        <p className={`text-lg font-bold ${currentTab.pillText}`}>{currentData.totalCount}</p>
                    </div>
                </div>
            )}

            {/* ── Chart ─────────────────────────────────────────────────────────── */}
            <div style={{ height: chartHeight }}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm animate-pulse">
                        Loading chart…
                    </div>
                ) : !currentData?.items.length ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No {currentTab.label} items sold yet
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={currentData.items}
                            layout="vertical"
                            margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
                            barCategoryGap="28%"
                        >
                            <defs>
                                {TABS.map((t) => (
                                    <linearGradient key={t.gradId} id={t.gradId} x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor={t.barFrom} stopOpacity={0.95} />
                                        <stop offset="100%" stopColor={t.barTo} stopOpacity={0.8} />
                                    </linearGradient>
                                ))}
                            </defs>

                            <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                axisLine={false}
                                tickLine={false}
                                unit="g"
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                width={90}
                            />
                            <Tooltip
                                content={(props) => <ChartTooltip {...props} tabDot={currentTab.dot} />}
                                cursor={{ fill: "rgba(99,102,241,0.05)" }}
                            />
                            <Bar dataKey="weight" radius={[0, 8, 8, 0]} maxBarSize={28}>
                                {currentData.items.map((_, i) => (
                                    <Cell key={i} fill={`url(#${currentTab.gradId})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
};

export default JewelleryCategoryChart;