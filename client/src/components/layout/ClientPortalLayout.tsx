import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileBarChart2,
  BriefcaseBusiness,
  BarChart3,
  FolderOpen,
  UserCircle,
  LogOut,
  UserCircle2,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface ClientPortalLayoutProps {
  children: ReactNode;
}

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/client/dashboard", label: "Dashboard",  icon: LayoutDashboard  },
    { href: "/client/reports",   label: "Reports",    icon: FileBarChart2     },
    { href: "/client/portfolio", label: "Portfolio",  icon: BriefcaseBusiness },
    { href: "/client/my-rep",    label: "My Rep",     icon: UserCircle2       },
    { href: "/client/metrics",   label: "Metrics",    icon: BarChart3         },
    { href: "/client/files",     label: "Files",      icon: FolderOpen        },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Client";
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "C";
  const currentPage =
    navItems.find((item) => location.pathname === item.href || location.pathname.startsWith(item.href + "/"))?.label ??
    "Menu";

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 relative z-20 shadow-xl shadow-sidebar/10">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
              <Arrow180Logo className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-white">NCS 180</span>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
                Client
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1.5">
          <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
            return (
              <NavLink key={item.href} to={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                )} />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom — user + logout */}
        <div className="p-4 border-t border-sidebar-border/50 flex flex-col gap-1">
          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{fullName}</p>
              <p className="text-[11px] text-sidebar-foreground/40 truncate capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group text-sm font-medium"
          >
            <LogOut className="w-5 h-5 text-sidebar-foreground/50 group-hover:text-destructive transition-colors" />
            Logout
          </button>
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
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold text-base tracking-tight text-white">NCS 180</p>
                  <span className="text-[10px] font-semibold uppercase text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
                    Client
                  </span>
                </div>
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
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
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
                <DropdownMenuLabel className="px-3 py-2">
                  <span className="block truncate text-sm font-semibold text-white">{fullName}</span>
                  <span className="block truncate text-[11px] font-normal capitalize text-sidebar-foreground/40">
                    {user?.role?.replace("_", " ")}
                  </span>
                </DropdownMenuLabel>
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
  );
}
