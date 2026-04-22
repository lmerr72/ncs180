import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CalendarDays, 
  UserCircle, 
  LogOut,
  Menu,
  TrendingUp,
  BarChart3,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollapsibleSidebarNavItem } from "@/components/layout/CollapsibleSidebarNavItem";
import { useSidebarCollapsed } from "@/components/layout/useSidebarCollapsed";

function Arrow180Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12C4 7.58172 7.58172 4 12 4H18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M4 12C4 16.4183 7.58172 20 12 20H18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M15 1L18 4L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 17L18 20L15 23" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { collapsed, setCollapsed } = useSidebarCollapsed();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", icon: Building2 },
    { href: "/my-clients", label: "My Clients", icon: Users },
    { href: "/pipeline", label: "Pipeline", icon: TrendingUp },
    { href: "/tasks", label: "Tasks", icon: ClipboardList },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/metrics", label: "Metrics", icon: BarChart3 },
  ];
  const currentPage =
    location.pathname === "/profile"
      ? "My Profile"
      : navItems.find((item) => location.pathname === item.href)?.label ?? "Menu";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen w-full bg-slate-50/50">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative z-20 hidden flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-xl shadow-sidebar/10 transition-all duration-300 md:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border/50",
            collapsed ? "justify-center px-3" : "justify-between px-5"
          )}
        >
          <div className={cn("flex items-center text-sidebar-primary", collapsed ? "justify-center" : "gap-2")}>
            <div className="rounded-lg border border-primary/30 bg-primary/20 p-1.5">
              <Arrow180Logo className="w-5 h-5 text-primary" />
            </div>
            {!collapsed ? <span className="font-display text-xl font-bold tracking-tight text-white">NCS 180</span> : null}
          </div>
          <Button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
              collapsed ? "absolute -right-4 top-5 h-8 w-8 rounded-full border shadow-lg" : "h-9 w-9"
            )}
            onClick={() => setCollapsed(!collapsed)}
            size="icon"
            type="button"
            variant="outline"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <div className={cn("flex flex-1 flex-col overflow-y-auto py-6", collapsed ? "px-2" : "px-3")}>
          {!collapsed ? (
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Menu
            </div>
          ) : null}
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <CollapsibleSidebarNavItem
                collapsed={collapsed}
                icon={item.icon}
                isActive={isActive}
                key={item.href}
                label={item.label}
                to={item.href}
              />
            );
          })}
        </div>

        <div className={cn("flex flex-col gap-1 border-t border-sidebar-border/50 p-4", collapsed ? "px-2" : "px-4")}>
          <CollapsibleSidebarNavItem
            collapsed={collapsed}
            icon={UserCircle}
            isActive={location.pathname === "/profile"}
            label="My Profile"
            to="/profile"
          />
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Logout"
                  className="group flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 text-sidebar-foreground/50 transition-colors group-hover:text-destructive" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5 text-sidebar-foreground/50 transition-colors group-hover:text-destructive" />
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="md:hidden bg-sidebar border-b border-sidebar-border px-4 py-3 shadow-lg shadow-sidebar/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sidebar-primary">
              <div className="bg-primary/20 p-1.5 rounded-md border border-primary/30">
                <Arrow180Logo className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-base tracking-tight text-white">NCS 180</p>
                <p className="truncate text-xs font-medium text-sidebar-foreground/60">{currentPage}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open navigation menu"
                  className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 border-sidebar-border bg-sidebar p-2 text-sidebar-foreground"
                sideOffset={8}
              >
                <DropdownMenuLabel className="px-3 text-xs font-semibold uppercase text-sidebar-foreground/40">
                  Menu
                </DropdownMenuLabel>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <DropdownMenuItem asChild key={item.href}>
                      <NavLink
                        to={item.href}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors",
                          isActive
                            ? "bg-sidebar-primary/10 text-sidebar-primary"
                            : "text-sidebar-foreground/70 focus:bg-sidebar-accent/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 transition-colors",
                          isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                        )} />
                        {item.label}
                      </NavLink>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="mx-0 bg-sidebar-border/50" />
                <DropdownMenuItem asChild>
                  <NavLink
                    to="/profile"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors",
                      location.pathname === "/profile"
                        ? "bg-sidebar-primary/10 text-sidebar-primary"
                        : "text-sidebar-foreground/70 focus:bg-sidebar-accent/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <UserCircle className={cn(
                      "h-5 w-5 transition-colors",
                      location.pathname === "/profile" ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                    )} />
                    My Profile
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={handleLogout}
                >
                  <LogOut className="h-5 w-5 text-sidebar-foreground/50" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {children}
          </div>
        </div>
      </main>
      </div>
    </TooltipProvider>
  );
}
