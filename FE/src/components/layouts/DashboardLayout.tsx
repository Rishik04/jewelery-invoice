import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const DashboardLayout = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="hidden md:block fixed top-0 left-0 h-screen z-40">
        <Sidebar expanded={expanded} setExpanded={setExpanded} />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${expanded ? "md:ml-64" : "md:ml-20"
          }`}
      >
        {/* Pass expanded to Header */}
        <Header expanded={expanded} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
