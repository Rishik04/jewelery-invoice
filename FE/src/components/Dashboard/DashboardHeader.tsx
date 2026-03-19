import { motion } from 'framer-motion';
import {
  Activity,
  Building2,
  DollarSign,
  Download,
  PlusCircle,
  Settings,
  TrendingUp,
  Upload
} from 'lucide-react';

const ModernDashboardHeader = ({ stats, loading }) => {
  const quickActions = [
    { icon: PlusCircle, label: 'New Company', action: () => console.log('New Company') },
    { icon: Upload, label: 'Import Data', action: () => console.log('Import') },
    { icon: Download, label: 'Export', action: () => console.log('Export') },
    { icon: Settings, label: 'Settings', action: () => console.log('Settings') }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative p-8">
        <div className="flex flex-col xl:flex-row justify-between xl:items-start gap-8">
          {/* Main Header */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Company Hub
                  </h1>
                  <p className="text-gray-600 text-lg font-medium">
                    Centralized business management & analytics
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.action}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 
                      text-gray-700 font-medium hover:bg-white hover:shadow-lg transition-all duration-300 text-sm"
                  >
                    <action.icon size={16} />
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 min-w-0 xl:min-w-[600px]">
            {[
              {
                label: 'Total Revenue',
                // value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`, 
                value: `₹20L`,
                change: `+2%`,
                positive: 2 > 0,
                icon: DollarSign,
                gradient: 'from-emerald-500 to-teal-600'
              },
              {
                label: 'Active Companies',
                value: 33,
                change: `of 4`,
                positive: true,
                icon: Building2,
                gradient: 'from-blue-500 to-indigo-600'
              },
              {
                label: 'Growth Rate',
                value: `2%`,
                change: 'this month',
                positive: 4 > 0,
                icon: TrendingUp,
                gradient: 'from-purple-500 to-pink-600'
              },
              {
                label: 'Performance',
                value: '92%',
                change: '+4.2%',
                positive: true,
                icon: Activity,
                gradient: 'from-orange-500 to-red-600'
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon size={20} className="text-white" />
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${stat.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernDashboardHeader