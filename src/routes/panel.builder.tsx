import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formsApi } from "@/lib/api";
import { PageHeader } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { type BuilderState, emptyBuilder, syncSections, emptySection3 } from "@/lib/formSchema";

type Search = { id?: number };

export const Route = createFileRoute("/panel/builder")({
  component: BuilderPage,
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: s.id ? Number(s.id) : undefined,
  }),
});

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft sm:p-8">
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function BuilderPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { id } = Route.useSearch();

  const [state, setState] = useState<BuilderState>(emptyBuilder);
  const [tab, setTab] = useState("s0");

  const existing = useQuery({
    queryKey: ["forms"],
    queryFn: formsApi.list,
    enabled: !!id,
  });

  useEffect(() => {
    if (id && existing.data) {
      const f = existing.data.find((x) => x.id === id);
      if (f) {
        setState({
          companyName: f.companyName,
          companyEmail: f.companyEmail,
          contactPerson: f.contactPerson,
          status: f.status,
          payload: { ...emptyBuilder().payload, ...(f.formPayload ?? {}), companyName: f.companyName, companyEmail: f.companyEmail, contactPerson: f.contactPerson },
        });
      }
    }
  }, [id, existing.data]);

  useEffect(() => {
    setState((s) => syncSections(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.payload.section1.campaignType, JSON.stringify(state.payload.section1.brands)]);

  const update = (fn: (s: BuilderState) => BuilderState) => setState((s) => fn({ ...s }));

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        companyName: state.companyName,
        companyEmail: state.companyEmail,
        contactPerson: state.contactPerson,
        formPayload: {
          ...state.payload,
          companyName: state.companyName,
          companyEmail: state.companyEmail,
          contactPerson: state.contactPerson,
        },
      };
      return id ? formsApi.update(id, body) : formsApi.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      qc.invalidateQueries({ queryKey: ["analytics:user"] });
      toast.success(id ? "Form updated 🌷" : "Form created 🌷");
      nav({ to: "/panel/forms" });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Couldn't save the form. Try again."),
  });

  const validate = () => {
    if (!state.companyName.trim()) return "Company name is required";
    if (!/^\S+@\S+\.\S+$/.test(state.companyEmail)) return "A valid company email is required";
    if (!state.contactPerson.trim()) return "Contact person is required";
    if (state.payload.section1.objectives.some((o) => !o.trim()))
      return "Please provide all 3 business objectives";
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) return toast.error(err);
    save.mutate();
  };

  const s1 = state.payload.section1;
  const s4 = state.payload.section4;
  const s5 = state.payload.section5;

  const tabs = useMemo(
    () => [
      { v: "s0", label: "Client" },
      { v: "s1", label: "Section 1" },
      { v: "s2", label: "Section 2" },
      { v: "s3", label: "Section 3" },
      { v: "s4", label: "Section 4" },
      { v: "s5", label: "Section 5" },
    ],
    []
  );

  return (
    <div className="pb-28">
      <PageHeader
        title={id ? "Edit form" : "New client discovery"}
        subtitle="Walk through each section. Your work autosaves locally as you type."
        action={
          <Button variant="ghost" onClick={() => nav({ to: "/panel/forms" })} className="rounded-full">
            <ArrowLeft className="h-4 w-4" /> Back to forms
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="flex w-full flex-wrap gap-1 rounded-2xl bg-secondary p-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.v} value={t.v} className="flex-1 rounded-xl px-4">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="s0">
          <Section title="Client basics" hint="The essentials that show up on every report.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Company name">
                <Input value={state.companyName} onChange={(e) => update((s) => ({ ...s, companyName: e.target.value }))} />
              </Field>
              <Field label="Company email">
                <Input type="email" value={state.companyEmail} onChange={(e) => update((s) => ({ ...s, companyEmail: e.target.value }))} />
              </Field>
              <Field label="Contact person">
                <Input value={state.contactPerson} onChange={(e) => update((s) => ({ ...s, contactPerson: e.target.value }))} />
              </Field>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="s1" className="space-y-6">
          <Section title="1.1 Company overview">
            <Field label="Business overview" hint="Please provide a brief overview of your business.">
              <Textarea rows={4} value={s1.businessOverview} onChange={(e) => update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, businessOverview: e.target.value } } }))} />
            </Field>
            <Field label="Industries / sectors">
              <Input value={s1.industry} onChange={(e) => update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, industry: e.target.value } } }))} />
            </Field>
          </Section>

          <Section title="1.2 Brand portfolio" hint="List the brands we'll be planning around.">
            <div className="space-y-3">
              {s1.brands.map((b, idx) => (
                <div key={idx} className="flex flex-wrap items-end gap-3 rounded-2xl bg-secondary/50 p-3">
                  <Field label="Brand name">
                    <Input value={b.name} onChange={(e) => {
                      const brands = [...s1.brands]; brands[idx] = { ...b, name: e.target.value };
                      update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, brands } } }));
                    }} />
                  </Field>
                  <Field label="Type">
                    <Input value={b.type} onChange={(e) => {
                      const brands = [...s1.brands]; brands[idx] = { ...b, type: e.target.value };
                      update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, brands } } }));
                    }} />
                  </Field>
                  <Button variant="ghost" size="sm" className="rounded-full text-destructive"
                    onClick={() => {
                      const brands = s1.brands.filter((_, i) => i !== idx);
                      update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, brands: brands.length ? brands : [{ name: "", type: "" }] } } }));
                    }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="rounded-full"
                onClick={() => update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, brands: [...s.payload.section1.brands, { name: "", type: "" }] } } }))}>
                <Plus className="h-4 w-4" /> Add brand
              </Button>
            </div>

            <Field label="Campaign type" hint="Combined campaign across all brands, or one per brand.">
              <RadioGroup
                value={s1.campaignType}
                onValueChange={(v) => update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, campaignType: v as any } } }))}
                className="flex flex-wrap gap-3"
              >
                {[
                  { v: "COMBINED", l: "Combined" },
                  { v: "PER_BRAND", l: "Per brand" },
                ].map((o) => (
                  <label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-2xl border bg-card px-4 py-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/30">
                    <RadioGroupItem value={o.v} /> {o.l}
                  </label>
                ))}
              </RadioGroup>
            </Field>
          </Section>

          <Section title="1.3 Business objectives" hint="Three clear goals for the next 12 months.">
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Field key={i} label={`Objective ${i + 1}`}>
                  <Input value={s1.objectives[i]} onChange={(e) => {
                    const objectives = [...s1.objectives] as [string, string, string]; objectives[i] = e.target.value;
                    update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, objectives } } }));
                  }} />
                </Field>
              ))}
            </div>
            <Field label="Primary focus">
              <Select value={s1.focusType} onValueChange={(v) => update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, focusType: v } } }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="expansion">Expansion</SelectItem>
                  <SelectItem value="retention">Retention</SelectItem>
                  <SelectItem value="repositioning">Repositioning</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="1.4 Key challenges">
            <Field label="Biggest challenges">
              <Textarea rows={3} value={s1.challenges} onChange={(e) => update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, challenges: e.target.value } } }))} />
            </Field>
            <Field label="Lost opportunities">
              <Textarea rows={3} value={s1.lostOpportunities} onChange={(e) => update((s) => ({ ...s, payload: { ...s.payload, section1: { ...s.payload.section1, lostOpportunities: e.target.value } } }))} />
            </Field>
          </Section>
        </TabsContent>

        <TabsContent value="s2">
          <Section title="Section 2 — Brand priorities" hint="One row per brand. Add brands in Section 1.">
            {state.payload.section2.length === 0 && (
              <p className="rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
                Add at least one brand in Section 1 to populate this table.
              </p>
            )}
            <div className="space-y-3">
              {state.payload.section2.map((row, idx) => (
                <div key={idx} className="grid gap-3 rounded-2xl bg-secondary/40 p-4 sm:grid-cols-4">
                  <Field label="Brand"><Input value={row.brandName} disabled /></Field>
                  <Field label="Objective">
                    <Input value={row.objective} placeholder="Awareness / Sales / Launch" onChange={(e) => {
                      const arr = [...state.payload.section2]; arr[idx] = { ...row, objective: e.target.value };
                      update((s) => ({ ...s, payload: { ...s.payload, section2: arr } }));
                    }} />
                  </Field>
                  <Field label="Priority">
                    <Select value={row.priorityLevel} onValueChange={(v) => {
                      const arr = [...state.payload.section2]; arr[idx] = { ...row, priorityLevel: v };
                      update((s) => ({ ...s, payload: { ...s.payload, section2: arr } }));
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Timeline">
                    <Input value={row.timeline} placeholder="e.g. Q1 – Q2 2026" onChange={(e) => {
                      const arr = [...state.payload.section2]; arr[idx] = { ...row, timeline: e.target.value };
                      update((s) => ({ ...s, payload: { ...s.payload, section2: arr } }));
                    }} />
                  </Field>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="s3" className="space-y-6">
          {state.payload.section3.map((dd, idx) => (
            <Section
              key={idx}
              title={`Deep dive — ${dd.brandName || "Brand"}`}
              hint={s1.campaignType === "COMBINED" ? "One combined deep dive." : "One deep dive per brand."}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Primary goal"><Input value={dd.primaryGoal} onChange={(e) => updateDD(idx, { primaryGoal: e.target.value })} /></Field>
                <Field label="Campaign type">
                  <Select value={dd.campaignType} onValueChange={(v) => updateDD(idx, { campaignType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["launch", "growth", "repositioning", "promotional"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Target audience"><Textarea rows={2} value={dd.targetAudience} onChange={(e) => updateDD(idx, { targetAudience: e.target.value })} /></Field>
                <Field label="Problem solved"><Textarea rows={2} value={dd.problemSolved} onChange={(e) => updateDD(idx, { problemSolved: e.target.value })} /></Field>
                <Field label="Customer type">
                  <RadioGroup value={dd.customerType} onValueChange={(v) => updateDD(idx, { customerType: v })} className="flex gap-3">
                    {["existing", "new"].map((o) => (
                      <label key={o} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-card px-4 py-2.5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/30">
                        <RadioGroupItem value={o} /> {o}
                      </label>
                    ))}
                  </RadioGroup>
                </Field>
                <Field label="Journey focus">
                  <Select value={dd.journeyFocus} onValueChange={(v) => updateDD(idx, { journeyFocus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Build awareness", "Drive consideration", "Convert to sales", "Build loyalty"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Buying barrier"><Input value={dd.buyingBarrier} onChange={(e) => updateDD(idx, { buyingBarrier: e.target.value })} /></Field>
              </div>

              <Field label="Three brand words" hint="Adjectives that describe how you want the brand to feel.">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <Input key={i} value={dd.brandWords[i]} onChange={(e) => {
                      const w = [...dd.brandWords] as [string, string, string]; w[i] = e.target.value;
                      updateDD(idx, { brandWords: w });
                    }} />
                  ))}
                </div>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Differentiation"><Textarea rows={2} value={dd.differentiation} onChange={(e) => updateDD(idx, { differentiation: e.target.value })} /></Field>
                <Field label="Current perception"><Textarea rows={2} value={dd.currentPerception} onChange={(e) => updateDD(idx, { currentPerception: e.target.value })} /></Field>
                <Field label="Desired perception"><Textarea rows={2} value={dd.desiredPerception} onChange={(e) => updateDD(idx, { desiredPerception: e.target.value })} /></Field>
                <Field label="Competitors"><Textarea rows={2} value={dd.competitors} onChange={(e) => updateDD(idx, { competitors: e.target.value })} /></Field>
                <Field label="Competitor strengths"><Textarea rows={2} value={dd.competitorStrengths} onChange={(e) => updateDD(idx, { competitorStrengths: e.target.value })} /></Field>
                <Field label="Key message"><Textarea rows={2} value={dd.keyMessage} onChange={(e) => updateDD(idx, { keyMessage: e.target.value })} /></Field>
                <Field label="Call to action"><Input value={dd.callToAction} onChange={(e) => updateDD(idx, { callToAction: e.target.value })} /></Field>
                <Field label="Channels used"><Input value={dd.channelsUsed} onChange={(e) => updateDD(idx, { channelsUsed: e.target.value })} /></Field>
                <Field label="What worked well"><Textarea rows={2} value={dd.workedWell} onChange={(e) => updateDD(idx, { workedWell: e.target.value })} /></Field>
                <Field label="What didn't work"><Textarea rows={2} value={dd.notWorkedWell} onChange={(e) => updateDD(idx, { notWorkedWell: e.target.value })} /></Field>
                <Field label="Audience engagement"><Textarea rows={2} value={dd.audienceEngagement} onChange={(e) => updateDD(idx, { audienceEngagement: e.target.value })} /></Field>
                <Field label="Platform preferences"><Input value={dd.platformPreferences} onChange={(e) => updateDD(idx, { platformPreferences: e.target.value })} /></Field>
                <Field label="Start date"><Input type="date" value={dd.startDate} onChange={(e) => updateDD(idx, { startDate: e.target.value })} /></Field>
                <Field label="Campaign duration"><Input value={dd.campaignDuration} placeholder="e.g. 8 weeks" onChange={(e) => updateDD(idx, { campaignDuration: e.target.value })} /></Field>
              </div>

              <Field label="Milestones">
                <div className="space-y-2">
                  {dd.milestones.map((m, mi) => (
                    <div key={mi} className="flex flex-wrap gap-2 rounded-2xl bg-secondary/50 p-3">
                      <Input type="date" value={m.date} className="w-44" onChange={(e) => {
                        const ms = [...dd.milestones]; ms[mi] = { ...m, date: e.target.value };
                        updateDD(idx, { milestones: ms });
                      }} />
                      <Input value={m.significance} className="flex-1" placeholder="Significance" onChange={(e) => {
                        const ms = [...dd.milestones]; ms[mi] = { ...m, significance: e.target.value };
                        updateDD(idx, { milestones: ms });
                      }} />
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateDD(idx, { milestones: dd.milestones.filter((_, i) => i !== mi) })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => updateDD(idx, { milestones: [...dd.milestones, { date: "", significance: "" }] })}>
                    <Plus className="h-4 w-4" /> Add milestone
                  </Button>
                </div>
              </Field>

              <Field label="Engagement opportunities">
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    ["competitions", "Competitions"],
                    ["liveActivations", "Live activations"],
                    ["influencer", "Influencer"],
                    ["events", "Events"],
                  ] as const).map(([k, l]) => (
                    <label key={k} className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                      <Checkbox checked={dd.engagementOpportunities[k]} onCheckedChange={(v) => updateDD(idx, { engagementOpportunities: { ...dd.engagementOpportunities, [k]: !!v } })} />
                      {l}
                    </label>
                  ))}
                </div>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Content available">
                  <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                    <Switch checked={dd.contentAvailable} onCheckedChange={(v) => updateDD(idx, { contentAvailable: v })} />
                    <span className="text-sm">{dd.contentAvailable ? "Yes" : "No"}</span>
                  </div>
                </Field>
                <Field label="Production support">
                  <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                    <Switch checked={dd.productionSupport} onCheckedChange={(v) => updateDD(idx, { productionSupport: v })} />
                    <span className="text-sm">{dd.productionSupport ? "Yes" : "No"}</span>
                  </div>
                </Field>
                <Field label="Brand stories"><Textarea rows={2} value={dd.brandStories} onChange={(e) => updateDD(idx, { brandStories: e.target.value })} /></Field>
                <Field label="Purchase locations"><Input value={dd.purchaseLocations} onChange={(e) => updateDD(idx, { purchaseLocations: e.target.value })} /></Field>
                <Field label="Sales focus">
                  <Select value={dd.salesFocus} onValueChange={(v) => updateDD(idx, { salesFocus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store_visits">Store visits</SelectItem>
                      <SelectItem value="online_sales">Online sales</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Campaign approach">
                  <Select value={dd.campaignApproach} onValueChange={(v) => updateDD(idx, { campaignApproach: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test_campaign">Test campaign</SelectItem>
                      <SelectItem value="growth_campaign">Growth campaign</SelectItem>
                      <SelectItem value="market_leadership_campaign">Market leadership</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Budget"><Input value={String(dd.budget ?? "")} onChange={(e) => updateDD(idx, { budget: e.target.value })} /></Field>
                <Field label="Success measurement"><Textarea rows={2} value={dd.successMeasurement} onChange={(e) => updateDD(idx, { successMeasurement: e.target.value })} /></Field>
                <Field label="KPIs"><Textarea rows={2} value={dd.kpis} onChange={(e) => updateDD(idx, { kpis: e.target.value })} /></Field>
              </div>
            </Section>
          ))}
          {state.payload.section3.length === 0 && (
            <Button variant="outline" className="rounded-full" onClick={() => update((s) => ({ ...s, payload: { ...s.payload, section3: [emptySection3()] } }))}>
              <Plus className="h-4 w-4" /> Add deep dive
            </Button>
          )}
        </TabsContent>

        <TabsContent value="s4">
          <Section title="Section 4 — Partnership openness">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Long-term media partnerships">
                <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                  <Switch checked={s4.longTermPartnership} onCheckedChange={(v) => update((s) => ({ ...s, payload: { ...s.payload, section4: { ...s.payload.section4, longTermPartnership: v } } }))} />
                  <span className="text-sm">{s4.longTermPartnership ? "Yes" : "No"}</span>
                </div>
              </Field>
              <Field label="Multi-platform campaigns">
                <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                  <Switch checked={s4.multiPlatform} onCheckedChange={(v) => update((s) => ({ ...s, payload: { ...s.payload, section4: { ...s.payload.section4, multiPlatform: v } } }))} />
                  <span className="text-sm">{s4.multiPlatform ? "Yes" : "No"}</span>
                </div>
              </Field>
            </div>
            <Field label="Upcoming events / launches / sponsorship opportunities">
              <Textarea rows={4} value={s4.opportunities} onChange={(e) => update((s) => ({ ...s, payload: { ...s.payload, section4: { ...s.payload.section4, opportunities: e.target.value } } }))} />
            </Field>
          </Section>
        </TabsContent>

        <TabsContent value="s5">
          <Section title="Section 5 — Decisions & timing">
            <Field label="Key decision-makers">
              <Textarea rows={3} value={s5.decisionMakers} onChange={(e) => update((s) => ({ ...s, payload: { ...s.payload, section5: { ...s.payload.section5, decisionMakers: e.target.value } } }))} />
            </Field>
            <Field label="Approval process">
              <Textarea rows={3} value={s5.approvalProcess} onChange={(e) => update((s) => ({ ...s, payload: { ...s.payload, section5: { ...s.payload.section5, approvalProcess: e.target.value } } }))} />
            </Field>
            <Field label="Timelines we should know about">
              <div className="space-y-2">
                {s5.timelines.map((t, ti) => (
                  <div key={ti} className="flex flex-wrap gap-2 rounded-2xl bg-secondary/50 p-3">
                    <Input type="date" value={t.date} className="w-44" onChange={(e) => {
                      const arr = [...s5.timelines]; arr[ti] = { ...t, date: e.target.value };
                      update((s) => ({ ...s, payload: { ...s.payload, section5: { ...s.payload.section5, timelines: arr } } }));
                    }} />
                    <Input value={t.significance} className="flex-1" placeholder="Significance" onChange={(e) => {
                      const arr = [...s5.timelines]; arr[ti] = { ...t, significance: e.target.value };
                      update((s) => ({ ...s, payload: { ...s.payload, section5: { ...s.payload.section5, timelines: arr } } }));
                    }} />
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => update((s) => ({ ...s, payload: { ...s.payload, section5: { ...s.payload.section5, timelines: s5.timelines.filter((_, i) => i !== ti) } } }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => update((s) => ({ ...s, payload: { ...s.payload, section5: { ...s.payload.section5, timelines: [...s5.timelines, { date: "", significance: "" }] } } }))}>
                  <Plus className="h-4 w-4" /> Add timeline
                </Button>
              </div>
            </Field>
          </Section>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/90 px-4 py-3 backdrop-blur lg:pl-72">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {state.companyName ? <>Editing <span className="font-medium text-foreground">{state.companyName}</span></> : "New form"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => nav({ to: "/panel/forms" })}>Cancel</Button>
            <Button className="rounded-full shadow-cute" onClick={onSave} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {id ? "Save changes" : "Create form"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  function updateDD(idx: number, patch: Partial<typeof state.payload.section3[number]>) {
    setState((s) => {
      const arr = [...s.payload.section3];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...s, payload: { ...s.payload, section3: arr } };
    });
  }
}
