import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronFirst,
  ChevronLast,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";

// Sidebar Context for managing state
const SidebarContext = React.createContext({ expanded: true });

interface SidebarProps {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ expanded, setExpanded }: SidebarProps) => {
  return (
    <aside className="h-screen bg-white border-r shadow-sm">
      <nav className="h-full flex flex-col">
        <div className="p-4 pb-2 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -20 }}
            transition={{ duration: 0.3 }}
            className={`overflow-hidden transition-all ${expanded ? "w-40" : "w-0"}`}
          >
            <div className="flex items-center">
              <BarChart3 className="h-7 w-7 mr-2 text-indigo-500" />
              <span className="text-xl font-bold">CompanyDash</span>
            </div>
          </motion.div>
          <Button
            variant="ghost"
            onClick={() => setExpanded((curr) => !curr)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            {expanded ? <ChevronFirst /> : <ChevronLast />}
          </Button>
        </div>
        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3 space-y-1">
            <NavItem icon={<LayoutDashboard />} text="Dashboard" to="/dashboard" alert />
            <NavItem icon={<FileText />} text="Invoices" to="/invoices" alert />
            <NavItem icon={<Users />} text="Customers" to="/customers"alert />
            <NavItem icon={<Package />} text="Products" to="/products" alert/>
            <NavItem icon={<ShoppingCart />} text="Orders" to="/orders" alert/>
            <hr className="my-3 border-white/40" />
            <NavItem icon={<Settings />} text="Settings" to="/settings" alert/>
            <NavItem icon={<HelpCircle />} text="Help & Support" to="/help"alert />
          </ul>
        </SidebarContext.Provider>

        {/* User Profile */}
        <div className="border-t border-white/40 flex p-3 items-center">
          <img
            src="https://placehold.co/100x100/6366f1/white?text=A"
            alt="User avatar"
            className="w-10 h-10 rounded-xl shadow-md"
          />
          <div
            className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"
              }`}
          >
            <div className="leading-4">
              <h4 className="font-semibold text-gray-900">Admin User</h4>
              <span className="text-xs text-gray-600">
                admin@company.com
              </span>
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="ml-2 cursor-pointer text-gray-600 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </motion.div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  alert?: boolean;
}

const NavItem = ({ icon, text, to, alert }: NavItemProps) => {
  const { expanded } = React.useContext(SidebarContext);
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative flex items-center py-2 px-3 my-1
        font-medium rounded-xl cursor-pointer
        transition-all group
        ${isActive
          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
          : "hover:bg-indigo-50 text-gray-600"
        }
      `}
    >
      <Link to={to} className="flex items-center w-full">
        <motion.div whileHover={{ scale: 1.1 }} className="text-indigo-500">
          {icon}
        </motion.div>
        <span
          className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"
            }`}
        >
          {text}
        </span>
        {alert && (
          <div
            className={`absolute right-2 w-2 h-2 rounded-full bg-pink-500 ${!expanded && "top-2"
              }`}
          />
        )}

        {!expanded && (
          <div
            className={`
              absolute left-full rounded-md px-2 py-1 ml-6
              bg-indigo-100 text-indigo-800 text-sm shadow-lg
              invisible opacity-0 -translate-x-3 transition-all
              group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
            `}
          >
            {text}
          </div>
        )}
      </Link>
    </motion.li>
  );
};

export default Sidebar;
