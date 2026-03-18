import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CalendarDays, 
  UserCircle, 
  LogOut,
  TrendingUp,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/all-clients", label: "All Clients", icon: Building2 },
    { href: "/my-clients", label: "My Clients", icon: Users },
    { href: "/pipeline", label: "Pipeline", icon: TrendingUp },
    { href: "/tasks", label: "Tasks", icon: ClipboardList },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/metrics", label: "Metrics", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 relative z-20 shadow-xl shadow-sidebar/10">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
              <Arrow180Logo className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">NCS 180</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1.5">
          <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
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

        <div className="p-4 border-t border-sidebar-border/50 flex flex-col gap-1">
          <NavLink
            to="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
              location.pathname === "/profile"
                ? "bg-sidebar-primary/10 text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <UserCircle className={cn(
              "w-5 h-5 transition-colors",
              location.pathname === "/profile" ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
            )} />
            My Profile
          </NavLink>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
