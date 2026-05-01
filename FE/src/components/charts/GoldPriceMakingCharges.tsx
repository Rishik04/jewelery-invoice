import { motion } from "framer-motion";
import { IndianRupee } from "lucide-react";
import { useMemo } from "react";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-gray-100 min-w-[190px]">
            <p className="font-semibold text-gray-800 mb-2 text-sm">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex justify-between gap-4 text-sm">
                    <span style={{ color: p.color ?? p.fill }} className="font-medium">{p.name}</span>
                    <span className="font-bold text-gray-700">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

interface GoldPriceMakingCardProps {
    invoices: any[];
    isLoading?: boolean;
    currMonthlyInv: any[];
}

const GoldPriceMakingCard = ({ invoices, isLoading, currMonthlyInv }: GoldPriceMakingCardProps) => {

    // ── Monthly data ──────────────────────────────────────────────────────────
    const monthlyData = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const year = d.getFullYear();
            const month = d.getMonth();
            const acc = {
                making: 0,
                rate22: 0, count22: 0,
                rate18: 0, count18: 0,
            };
            for (const inv of invoices) {
                const created = new Date(inv.createdAt);
                if (created.getFullYear() !== year || created.getMonth() !== month) continue;
                for (const item of inv.items ?? []) {
                    const cat = (item.category ?? "").toUpperCase();
                    if (cat !== "GOLD") continue;
                    acc.making += item.makingCharges ?? 0;
                    if (item.karat === "22K" && item.rate) {
                        acc.rate22 += item.rate;
                        acc.count22 += 1;
                    }
                    if (item.karat === "18K" && item.rate) {
                        acc.rate18 += item.rate;
                        acc.count18 += 1;
                    }
                }
            }
            return {
                name: MONTHS[month],
                "22K Rate": acc.count22 > 0 ? Math.round(acc.rate22 / acc.count22) : null,
                "18K Rate": acc.count18 > 0 ? Math.round(acc.rate18 / acc.count18) : null,
                "Making (₹K)": Math.round((acc.making / 1000) * 10) / 10,
            };
        });
    }, [invoices]);

    const summary = useMemo(() => {
        let totalMaking = 0;
        let rate22Sum = 0, rate22Count = 0;
        let rate18Sum = 0, rate18Count = 0;
        for (const inv of currMonthlyInv) {
            for (const item of inv.items ?? []) {
                const cat = (item.category ?? "").toUpperCase();
                if (cat !== "GOLD") continue;
                totalMaking += item.makingCharges ?? 0;
                if (item.karat === "22K" && item.rate) { rate22Sum += item.rate; rate22Count++; }
                if (item.karat === "18K" && item.rate) { rate18Sum += item.rate; rate18Count++; }
            }
        }
        return {
            totalMakingK: Math.round((totalMaking / 1000) * 10) / 10,
            avg22K: rate22Count > 0 ? Math.round(rate22Sum / rate22Count) : null,
            avg18K: rate18Count > 0 ? Math.round(rate18Sum / rate18Count) : null,
        };
    }, [currMonthlyInv]);

    const hasData = monthlyData.some((m) => m["Making (₹K)"] > 0);
    const subLabel = "Avg ₹/gram (18K & 22K) & Making Collected";


    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-100 shadow-xl"
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Gold Rate & Making Charges</h3>
                    <p className="text-gray-500 text-sm">{subLabel}</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-2xl shadow-md shrink-0">
                    <IndianRupee size={20} className="text-white" />
                </div>
            </div>

            {/* ── Summary pills ── */}
            <div className="flex gap-3 mb-5">
                {summary.avg22K && (
                    <div className="flex-1 bg-indigo-50 rounded-2xl px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Avg 22K Rate</p>
                        <p className="text-lg font-bold text-indigo-700">₹{summary.avg22K.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Per Gram</p>
                    </div>
                )}
                {summary.avg18K && (
                    <div className="flex-1 bg-purple-50 rounded-2xl px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">Avg 18K Rate</p>
                        <p className="text-lg font-bold text-purple-700">₹{summary.avg18K.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Per Gram</p>
                    </div>
                )}
                <div className="flex-1 bg-cyan-50 rounded-2xl px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1">Making Collected</p>
                    <p className="text-lg font-bold text-cyan-700">₹{summary.totalMakingK}K</p>
                    <p className="text-xs text-gray-500 mt-0.5">All Time</p>
                </div>
            </div>

            {/* ── Chart ── */}
            <div className="h-[210px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm animate-pulse">
                        Loading chart…
                    </div>
                ) : !hasData ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No data yet
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={monthlyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gMaking" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.85} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.5} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="making" orientation="left" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="K" width={36} />
                            <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v) => <span className="text-gray-500 font-medium">{v}</span>} />
                            <Bar yAxisId="making" dataKey="Making (₹K)" fill="url(#gMaking)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                            <Line yAxisId="rate" type="monotone" dataKey="22K Rate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                            <Line yAxisId="rate" type="monotone" dataKey="18K Rate" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
};

export default GoldPriceMakingCard;