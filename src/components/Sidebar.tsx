"use client";

import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  Banknote,
  BarChart,
  Cloud,
  Settings,
  Menu,
  Building2, // New icon for Company Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { name: "Home", icon: Home, path: "/" },
  { name: "Farmers", icon: Users, path: "/farmers" },
  { name: "Items", icon: Package, path: "/items" },
  { name: "Sale Invoices", icon: ShoppingCart, path: "/sale" }, // Updated name and path
  { name: "Purchase Invoices", icon: ShoppingCart, path: "/purchase" }, // Updated name and path
  { name: "Manufacturing Expenses", icon: Receipt, path: "/manufacturing-expenses" },
  { name: "Cash & Bank", icon: Banknote, path: "/cash-bank" },
  { name: "Reports", icon: BarChart, path: "/reports" },
  { name: "Sync, Share & Backup", icon: Cloud, path: "/sync-backup" },
  { name: "Utilities", icon: Settings, path: "/utilities" },
  { name: "Settings", icon: Settings, path: "/settings" },
  { name: "Company Settings", icon: Building2, path: "/company-settings" }, // New nav item
];

const SidebarContent = () => (
  <ScrollArea className="h-full py-4">
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Vyapar</h2>
      <div className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                isActive ? "bg-muted text-primary" : ""
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </NavLink>
        ))}
      </div>
    </div>
  </ScrollArea>
);

const Sidebar = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50 print-hide">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-64 p-0 print-hide">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex flex-col h-full w-64 border-r bg-background print-hide">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;