import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formsApi, type FormListItem, type FormStatus } from "@/lib/api";
import { PageHeader } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Pencil, Download, RefreshCw, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "@/lib/date";

export const Route = createFileRoute("/panel/forms")({ component: FormsPage });

function FormsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"All" | FormStatus>("All");
  const [q, setQ] = useState("");

  const list = useQuery({ queryKey: ["forms"], queryFn: formsApi.list });

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: number; status: FormStatus }) => formsApi.setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      qc.invalidateQueries({ queryKey: ["analytics:user"] });
      qc.invalidateQueries({ queryKey: ["analytics:admin"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Couldn't update status"),
  });

  const filtered = useMemo(() => {
    const all = list.data ?? [];
    return all
      .filter((f) => (tab === "All" ? true : f.status === tab))
      .filter((f) =>
        !q
          ? true
          : [f.companyName, f.contactPerson, f.companyEmail, f.ownerName]
              .join(" ")
              .toLowerCase()
              .includes(q.toLowerCase())
      );
  }, [list.data, tab, q]);

  return (
    <>
      <PageHeader
        title="Forms"
        subtitle="Search, edit, and manage your client discovery briefs."
        action={
          <Button onClick={() => nav({ to: "/panel/builder" })} className="rounded-full shadow-cute">
            <Plus className="h-4 w-4" /> New form
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="rounded-full bg-secondary p-1">
            <TabsTrigger value="All" className="rounded-full px-5">All</TabsTrigger>
            <TabsTrigger value="Pending" className="rounded-full px-5">Pending</TabsTrigger>
            <TabsTrigger value="Completed" className="rounded-full px-5">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, contact, owner…"
            className="h-11 rounded-full pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5">Company</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Owner</th>
              <th className="px-5 py-3.5">Updated</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.isLoading &&
              [0, 1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-5 py-4"><Skeleton className="h-8 w-full rounded-xl" /></td>
                </tr>
              ))}

            {!list.isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-display text-lg font-semibold">No forms here yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start a fresh client discovery and watch it appear right here.
                    </p>
                    <Button onClick={() => nav({ to: "/panel/builder" })} className="rounded-full">
                      <Plus className="h-4 w-4" /> New form
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {filtered.map((f: FormListItem) => (
              <tr key={f.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-5 py-4">
                  <p className="font-semibold">{f.companyName}</p>
                  <p className="text-xs text-muted-foreground">{f.companyEmail}</p>
                </td>
                <td className="px-5 py-4">{f.contactPerson}</td>
                <td className="px-5 py-4 text-muted-foreground">{f.ownerName}</td>
                <td className="px-5 py-4 text-muted-foreground">{format(f.updatedAt)}</td>
                <td className="px-5 py-4"><StatusChip status={f.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      title="Edit"
                      onClick={() => nav({ to: "/panel/builder", search: { id: f.id } as any })}
                      className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      title="Toggle status"
                      onClick={() =>
                        toggle.mutate({ id: f.id, status: f.status === "Pending" ? "Completed" : "Pending" })
                      }
                      className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      title="Download PDF"
                      onClick={() =>
                        formsApi.downloadPdf(f.id).catch(() => toast.error("Couldn't download PDF"))
                      }
                      className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
