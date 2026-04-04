import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLogout } from "@/features/auth/useAuth";
import { useCompany } from "@/features/company/useCompany";
import { LogOut, Menu, Search, Settings, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Sidebar from "./Sidebar";

const Header = ({ expanded }: { expanded: boolean }) => {
  const logout = useLogout();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: company } = useCompany();

  const initials = company?.name
    ? company.name
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
    : "A";

  const comingSoon = (label: string) =>
    toast.info(`${label} — coming soon`, { description: "This page is not built yet." });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) comingSoon("Search");
  };

  return (
    <header
      className={`border-b sticky top-0 z-30 bg-white/95 backdrop-blur-sm transition-all duration-300
        ${expanded ? "md:pl-64" : "md:pl-20"}`}
    >
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">

        {/* Mobile sidebar trigger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 overflow-hidden">
            <Sidebar expanded={true} setExpanded={setSheetOpen} isMobile={true} />
          </SheetContent>
        </Sheet>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex md:justify-start">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search invoices, customers…"
              className="pl-9 rounded-full bg-gray-50 border-gray-200 focus:bg-white w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-indigo-300 transition-all">
                <AvatarImage src="" alt={company?.name ?? "User"} />
                <AvatarFallback className="bg-indigo-600 text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {company?.name ?? "My Account"}
              </p>
              {company?.gstin && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  GSTIN: {company.gstin}
                </p>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => comingSoon("Profile")}>
              <User className="h-4 w-4 mr-2 text-gray-500" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => comingSoon("Settings")}>
              <Settings className="h-4 w-4 mr-2 text-gray-500" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
};

export default Header;