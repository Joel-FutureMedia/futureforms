import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CheckCircle2, Clock, Users, Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/panel/overview")({ component: OverviewPage });

function StatCard({
  label, value, icon: Icon, tint,
}: { label: string; value: number | string; icon: any; tint: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-cute">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60 blur-2xl ${tint}`} />
      <div className="relative">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <p className="mt-5 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function OverviewPage() {
  const auth = useAuth();
  const isAdmin = auth?.role === "ROLE_SUPER_ADMIN";

  const userQ = useQuery({ queryKey: ["analytics:user"], queryFn: analyticsApi.user });
  const adminQ = useQuery({
    queryKey: ["analytics:admin"], queryFn: analyticsApi.admin, enabled: isAdmin,
  });

  return (
    <>
      <PageHeader
        title="Hi there Future Media"
        subtitle="Here's a quick look at what's brewing today."
        action={
          <Link
            to="/panel/builder"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-cute transition-transform hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" /> New form
          </Link>
        }
      />

      <Tabs defaultValue="me" className="space-y-6">
        <TabsList className="rounded-full bg-secondary p-1">
          <TabsTrigger value="me" className="rounded-full px-5">My performance</TabsTrigger>
          {isAdmin && <TabsTrigger value="system" className="rounded-full px-5">System analytics</TabsTrigger>}
        </TabsList>

        <TabsContent value="me" className="space-y-6">
          {userQ.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total forms" value={userQ.data?.totalForms ?? 0} icon={FileText} tint="bg-peach/40" />
              <StatCard label="Pending" value={userQ.data?.pendingForms ?? 0} icon={Clock} tint="bg-butter/50" />
              <StatCard label="Completed" value={userQ.data?.completedForms ?? 0} icon={CheckCircle2} tint="bg-mint/50" />
            </div>
          )}

          <div className="rounded-3xl bg-gradient-warm p-8 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-primary">Ready for the next brief?</h3>
                <p className="mt-1 text-sm text-primary/70">Spin up a new client discovery in seconds.</p>
              </div>
              <Link
                to="/panel/builder"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Start a form <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="system" className="space-y-6">
            {adminQ.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total users" value={adminQ.data?.totalUsers ?? 0} icon={Users} tint="bg-lavender/50" />
                <StatCard label="Total forms" value={adminQ.data?.totalForms ?? 0} icon={FileText} tint="bg-peach/40" />
                <StatCard label="Pending" value={adminQ.data?.pendingForms ?? 0} icon={Clock} tint="bg-butter/50" />
                <StatCard label="Completed" value={adminQ.data?.completedForms ?? 0} icon={CheckCircle2} tint="bg-mint/50" />
              </div>
            )}

            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <h3 className="font-display text-xl font-semibold">Per-user activity</h3>
              <p className="text-sm text-muted-foreground">Who's been busy lately.</p>
              <div className="mt-4 overflow-hidden border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Pending</th>
                      <th className="px-4 py-3">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(adminQ.data?.perUser ?? []).map((u) => (
                      <tr key={u.userId} className="hover:bg-secondary/40">
                        <td className="px-4 py-3">
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold">{u.totalForms}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-warning/25 px-2 py-0.5 text-xs">{u.pendingForms}</span></td>
                        <td className="px-4 py-3"><span className="rounded-full bg-success/25 px-2 py-0.5 text-xs">{u.completedForms}</span></td>
                      </tr>
                    ))}
                    {(!adminQ.data?.perUser || adminQ.data.perUser.length === 0) && (
                      <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">No activity yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
