import { Link, useLocation, useNavigate, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Plus, Users, LogOut, Menu, X, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { clearAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: any; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/panel/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/panel/forms", label: "Forms", icon: FileText },
  { to: "/panel/builder", label: "New form", icon: Plus },
  { to: "/panel/admin", label: "Admin", icon: Users, adminOnly: true },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((i) => !i.adminOnly || auth?.role === "ROLE_SUPER_ADMIN");

  const logout = () => {
    clearAuth();
    nav({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background bg-hero-glow">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Logo className="h-7" />
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-cute"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", active ? "" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
                {item.label === "New form" && !active && (
                  <Sparkles className="ml-auto h-4 w-4 text-accent-foreground/60" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-cute font-display text-sm font-bold text-primary">
              {auth?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{auth?.name ?? "Guest"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {auth?.role === "ROLE_SUPER_ADMIN" ? "Super admin" : "Staff"}
              </p>
            </div>
            <button onClick={logout} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <Logo className="h-6" />
        <Button size="sm" variant="ghost" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
          {children ?? <Outlet />}
        </div>
      </main>

      {open && (
        <div className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
