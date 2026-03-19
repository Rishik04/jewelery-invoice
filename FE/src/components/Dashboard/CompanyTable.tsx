import { motion } from "framer-motion";
import {
  AlertTriangle, Building2, CreditCard, Edit, Filter,
  LayoutGrid, List, Mail, MapPin, PlusCircle, Receipt, Search, Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const CompanyCard = ({ company, index, onEdit, onDelete, onView }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.01 }}
    className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
  >
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
          <Building2 size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors truncate">{company.name}</h3>
          <p className="text-gray-500 text-sm font-mono">{company.gstin}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600"><Mail size={14} /><span className="truncate">{company.email}</span></div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={14} />
          <span className="truncate">
            {company.address?.city || company.address?.street || "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600"><CreditCard size={14} /><span>{company.bank?.bankName || "—"}</span></div>
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => onView(company)}
        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 text-sm">
        <Receipt size={14} /> Invoice
      </motion.button>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onEdit(company)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
        <Edit size={16} />
      </motion.button>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onDelete(company)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
        <Trash2 size={16} />
      </motion.button>
    </div>
  </motion.div>
);

const ModernCompanyTable = ({
  filteredCompanies, loading, error, searchTerm, setSearchTerm,
  handleEdit, handleDelete, handleAddNew,
}: any) => {
  // FIX: viewMode and filterStatus were props from parent but parent never passed them
  // moved to local state here
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  const handleView = (company: any) => navigate(`/${company._id}/invoice`);

  const displayCompanies = filterStatus === "all"
    ? filteredCompanies
    : filteredCompanies?.filter((c: any) => c.status === filterStatus);

  const renderContent = () => {
    if (loading) return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/80 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
            </div>
          </div>
        ))}
      </div>
    );

    if (error) return (
      <div className="text-center py-16">
        <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Data</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );

    if (!displayCompanies?.length) return (
      <div className="text-center py-16">
        <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">{searchTerm ? "No matching companies" : "No companies yet"}</h3>
        <motion.button whileHover={{ scale: 1.05 }} onClick={handleAddNew}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 mx-auto">
          <PlusCircle size={18} /> Add Company
        </motion.button>
      </div>
    );

    return (
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
        {displayCompanies.map((company: any, i: number) => (
          <CompanyCard key={company._id} company={company} index={i} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 border-b border-white/30 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
              <p className="text-gray-500 text-sm">Manage your business entities</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search companies..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border-2 border-gray-200/50 rounded-xl outline-none focus:border-blue-400 font-medium text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-3 pr-7 py-2.5 bg-white/80 border-2 border-gray-200/50 rounded-xl outline-none font-medium text-sm appearance-none cursor-pointer">
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Filter size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}><LayoutGrid size={17} /></button>
                <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}><List size={17} /></button>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddNew}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg text-sm flex items-center gap-2 whitespace-nowrap">
                <PlusCircle size={16} /> Add Company
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">{renderContent()}</div>
    </motion.div>
  );
};

export default ModernCompanyTable;
