import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/useAuth";
import { useCompany } from "@/features/company/useCompany";
import { motion } from "framer-motion";
import {
  BarChart3,
  ChartLine,
  ChevronFirst,
  ChevronLast,
  FileText,
  LayoutDashboard,
  LogOut,
  Sparkle,
  Users
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";

// ─── Context ──────────────────────────────────────────────────────────────────

const SidebarContext = React.createContext({
  expanded: true,
  isMobile: false,
  onNavClick: () => { },
});

interface SidebarProps {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile?: boolean;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = ({ expanded, setExpanded, isMobile = false }: SidebarProps) => {
  const logout = useLogout();
  const { data: company } = useCompany();

  const initials = company?.name
    ? company.name
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
    : "A";

  // On mobile (Sheet), close after navigation. On desktop, leave expanded state alone.
  const onNavClick = () => {
    if (isMobile) setExpanded(false as any);
  };

  return (
    <aside className="h-screen w-full bg-white border-r shadow-sm flex flex-col overflow-hidden">
      <nav className="h-full flex flex-col">

        {/* Logo */}
        <div className="p-4 pb-2 flex justify-between items-center">
          <motion.div
            animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex items-center gap-2"
          >
            <BarChart3 className="h-6 w-6 text-indigo-500 shrink-0" />
            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
              {company?.name ?? "CompanyDash"}
            </span>
          </motion.div>

          {/* Only show collapse toggle on desktop */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((c) => !c)}
              className="rounded-lg bg-gray-50 hover:bg-gray-100 shrink-0"
            >
              {expanded ? <ChevronFirst size={18} /> : <ChevronLast size={18} />}
            </Button>
          )}
        </div>

        {/* Nav Items */}
        <SidebarContext.Provider value={{ expanded, isMobile, onNavClick }}>
          <ul className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto overflow-hidden">
            <NavItem icon={<LayoutDashboard size={18} />} text="Dashboard" to="/dashboard" />
            <NavItem icon={<FileText size={18} />} text="Invoices" to="/invoices" />
            <NavItem icon={<Users size={18} />} text="Customers" to="/customers" />
            <NavItem icon={<Sparkle size={18} />} text="Products" to="/products" />
            <NavItem icon={<ChartLine size={18} />} text="Analytics" to="/analytics" />
          </ul>
        </SidebarContext.Provider>

        {/* User footer */}
        <div className="border-t p-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm">
            {initials}
          </div>

          {/* Name + email */}
          <motion.div
            animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-1 min-w-0"
          >
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {company?.name ?? "My Company"}
            </p>
            {company?.gstin && (
              <p className="text-xs text-gray-500 truncate leading-tight">
                {company.gstin}
              </p>
            )}
          </motion.div>

          {/* Logout */}
          {expanded && (
            <button
              onClick={logout}
              title="Logout"
              className="shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
};

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  /** Pass true if the route isn't built yet — shows a toast instead of navigating */
  comingSoon?: boolean;
}

const NavItem = ({ icon, text, to, comingSoon }: NavItemProps) => {
  const { expanded, onNavClick } = React.useContext(SidebarContext);
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  const handleClick = (e: React.MouseEvent) => {
    if (comingSoon) {
      e.preventDefault();
      toast.info(`${text} — coming soon`, { description: "This page is not built yet." });
      return;
    }
    onNavClick();
  };

  return (
    <li className="relative group">
      <Link
        to={to}
        onClick={handleClick}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm
          transition-all duration-150
          ${isActive
            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
            : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
          }
        `}
      >
        {/* Icon — white when active, indigo when not */}
        <span className={`shrink-0 ${isActive ? "text-white" : "text-indigo-400"}`}>
          {icon}
        </span>

        {/* Label */}
        <motion.span
          animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden whitespace-nowrap"
        >
          {text}
        </motion.span>
      </Link>

      {/* Collapsed tooltip */}
      {!expanded && (
        <div className="
          absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
          px-2.5 py-1.5 rounded-lg text-xs font-medium
          bg-gray-900 text-white shadow-lg whitespace-nowrap
          invisible opacity-0 -translate-x-1 transition-all duration-150
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          pointer-events-none
        ">
          {text}
        </div>
      )}
    </li>
  );
};

export default Sidebar;