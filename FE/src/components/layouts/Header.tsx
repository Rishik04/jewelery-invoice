import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLogout } from "@/features/auth/useAuth";
import { LogOutIcon, Menu, Moon, Search, Settings, Sun, User } from "lucide-react";
import {
  Menubar, MenubarContent, MenubarItem, MenubarMenu,
  MenubarSeparator, MenubarTrigger,
} from "../ui/menubar";
import Sidebar from "./Sidebar";
import { useState } from "react";

const Header = ({ expanded }: { expanded: boolean }) => {
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`border-b sticky top-0 z-30 bg-white/95 backdrop-blur transition-all duration-300
        ${expanded ? "md:pl-64" : "md:pl-20"}`}
    >
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile sidebar */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar expanded={true} setExpanded={setOpen} />
          </SheetContent>
        </Sheet>

        {/* Search */}
        <div className="flex-1 flex justify-center md:justify-start">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-8 rounded-full md:max-w-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Theme toggle (stub — add next-themes if needed) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Light</DropdownMenuItem>
              <DropdownMenuItem>Dark</DropdownMenuItem>
              <DropdownMenuItem>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile / Logout */}
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>
                <Settings className="h-4 w-4" />
              </MenubarTrigger>
              <MenubarContent align="end">
                <MenubarItem>
                  <User className="h-4 w-4 mr-2" /> Profile
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                  onClick={logout}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOutIcon className="h-4 w-4 mr-2" /> Logout
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>

          <Avatar className="h-9 w-9">
            <AvatarImage
              src="https://placehold.co/36x36/6366f1/white?text=A"
              alt="User"
            />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
