import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, analyticsApi, type UserRecord, type Role } from "@/lib/api";
import { PageHeader } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Lock, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "@/lib/date";

export const Route = createFileRoute("/panel/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("futuremedia.auth");
    if (!raw) throw redirect({ to: "/login" });
    try {
      const auth = JSON.parse(raw);
      if (auth.role !== "ROLE_SUPER_ADMIN") throw redirect({ to: "/panel/overview" });
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminPage,
});

interface UserDraft { id?: number; name: string; email: string; password: string; role: Role; isLocked: boolean }

function AdminPage() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin:users"], queryFn: adminApi.listUsers });
  const analytics = useQuery({ queryKey: ["analytics:admin"], queryFn: analyticsApi.admin });

  const [editing, setEditing] = useState<UserDraft | null>(null);
  const [confirmDel, setConfirmDel] = useState<UserRecord | null>(null);

  const save = useMutation({
    mutationFn: (d: UserDraft) =>
      d.id ? adminApi.updateUser(d.id, d) : adminApi.createUser(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin:users"] });
      qc.invalidateQueries({ queryKey: ["analytics:admin"] });
      toast.success(editing?.id ? "User updated" : "User created");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Couldn't save user"),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin:users"] });
      qc.invalidateQueries({ queryKey: ["analytics:admin"] });
      toast.success("User deleted");
      setConfirmDel(null);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Couldn't delete this user");
      setConfirmDel(null);
    },
  });

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Manage your team and keep an eye on per-user performance."
        action={
          <Button
            onClick={() => setEditing({ name: "", email: "", password: "", role: "ROLE_USER", isLocked: false })}
            className="rounded-full shadow-cute"
          >
            <Plus className="h-4 w-4" /> New user
          </Button>
        }
      />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="rounded-full bg-secondary p-1">
          <TabsTrigger value="users" className="rounded-full px-5">Users</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-full px-5">Per-user analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="overflow-hidden bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.isLoading &&
                  [0, 1, 2].map((i) => (
                    <tr key={i}><td colSpan={5} className="px-5 py-4"><Skeleton className="h-8 w-full rounded-xl" /></td></tr>
                  ))}
                {users.data?.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-cute text-sm font-bold text-primary">
                          {u.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${u.role === "ROLE_SUPER_ADMIN" ? "bg-lavender/40 ring-1 ring-inset ring-lavender" : "bg-mint/40 ring-1 ring-inset ring-mint"}`}>
                        {u.role === "ROLE_SUPER_ADMIN" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                        {u.role === "ROLE_SUPER_ADMIN" ? "Super admin" : "Staff"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs text-destructive">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{format(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing({ id: u.id, name: u.name, email: u.email, password: "", role: u.role, isLocked: u.isLocked })}
                          className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDel(u)}
                          className="rounded-xl p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.data?.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="rounded-3xl bg-card p-6 shadow-soft">
            <div className="overflow-hidden border">
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
                  {analytics.data?.perUser?.map((u) => (
                    <tr key={u.userId} className="hover:bg-secondary/40">
                      <td className="px-4 py-3"><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                      <td className="px-4 py-3 font-semibold">{u.totalForms}</td>
                      <td className="px-4 py-3">{u.pendingForms}</td>
                      <td className="px-4 py-3">{u.completedForms}</td>
                    </tr>
                  ))}
                  {(!analytics.data?.perUser || analytics.data.perUser.length === 0) && (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">No data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing?.id ? "Edit user" : "New user"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{editing.id ? "Password (leave blank to keep current)" : "Password"}</Label>
                <Input type="password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v as Role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ROLE_USER">Staff</SelectItem>
                      <SelectItem value="ROLE_SUPER_ADMIN">Super admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Locked</Label>
                  <div className="flex h-10 items-center gap-3 rounded-xl border bg-card px-3">
                    <Switch checked={editing.isLocked} onCheckedChange={(v) => setEditing({ ...editing, isLocked: v })} />
                    <span className="text-sm">{editing.isLocked ? "Locked" : "Active"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="rounded-full shadow-cute" disabled={save.isPending}
              onClick={() => editing && save.mutate(editing)}>
              {editing?.id ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDel?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user. Their forms remain in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDel && del.mutate(confirmDel.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
