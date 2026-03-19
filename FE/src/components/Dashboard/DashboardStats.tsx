import { useCompany } from "@/features/company/useCompany";
import { motion } from "framer-motion";
import { MapPin, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Area, AreaChart, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-gray-100">
      <p className="font-semibold text-gray-800">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// Placeholder monthly data — replace with real invoice aggregate API when available
const monthlyData = [
  { name: "Jan", invoices: 2, revenue: 24 },
  { name: "Feb", invoices: 3, revenue: 32 },
  { name: "Mar", invoices: 4, revenue: 45 },
  { name: "Apr", invoices: 5, revenue: 38 },
  { name: "May", invoices: 6, revenue: 52 },
  { name: "Jun", invoices: 8, revenue: 67 },
];

const ModernDashboardStats = () => {
  const { data: company } = useCompany();

  // Build state distribution from the single tenant company (placeholder for multi-company)
  const stateChartData = useMemo(() => {
    if (!company?.address?.state) return [];
    return [{ name: company.address.state, value: 1 }];
  }, [company]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="grid gap-6 md:grid-cols-2"
    >
      {/* Growth chart */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-100 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Growth Metrics</h3>
            <p className="text-gray-500 text-sm">Invoice count & revenue trend</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl shadow-md">
            <TrendingUp size={20} className="text-white" />
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue (₹K)" stroke="#6366f1" strokeWidth={3} fill="url(#gRev)" />
              <Area type="monotone" dataKey="invoices" name="Invoices" stroke="#8b5cf6" strokeWidth={3} fill="url(#gInv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State distribution */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-100 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">State Distribution</h3>
            <p className="text-gray-500 text-sm">Business presence by state</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-md">
            <MapPin size={20} className="text-white" />
          </div>
        </div>
        <div className="h-[300px]">
          {stateChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stateChartData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(v) => <span className="text-gray-700 font-medium">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No company data yet
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ModernDashboardStats;
