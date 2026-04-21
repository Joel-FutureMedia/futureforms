import type { CampaignType, FormStatus } from "@/lib/api";

export interface BrandRow { name: string; type: string }
export interface MilestoneRow { date: string; significance: string }

export interface Section1 {
  businessOverview: string;
  industry: string;
  brands: BrandRow[];
  campaignType: CampaignType;
  objectives: [string, string, string];
  focusType: string;
  challenges: string;
  lostOpportunities: string;
}

export interface Section2Item {
  brandName: string;
  objective: string;
  priorityLevel: string;
  timeline: string;
}

export interface Section3Item {
  brandName: string;
  primaryGoal: string;
  campaignType: string;
  targetAudience: string;
  problemSolved: string;
  customerType: string;
  journeyFocus: string;
  buyingBarrier: string;
  brandWords: [string, string, string];
  differentiation: string;
  currentPerception: string;
  desiredPerception: string;
  competitors: string;
  competitorStrengths: string;
  keyMessage: string;
  callToAction: string;
  channelsUsed: string;
  workedWell: string;
  notWorkedWell: string;
  audienceEngagement: string;
  platformPreferences: string;
  startDate: string;
  campaignDuration: string;
  milestones: MilestoneRow[];
  engagementOpportunities: {
    competitions: boolean;
    liveActivations: boolean;
    influencer: boolean;
    events: boolean;
  };
  contentAvailable: boolean;
  productionSupport: boolean;
  brandStories: string;
  purchaseLocations: string;
  salesFocus: string;
  campaignApproach: string;
  budget: number | string;
  successMeasurement: string;
  kpis: string;
}

export interface Section4 {
  longTermPartnership: boolean;
  multiPlatform: boolean;
  opportunities: string;
}

export interface Section5 {
  decisionMakers: string;
  approvalProcess: string;
  timelines: MilestoneRow[];
}

export interface ClientDiscoveryPayload {
  companyName: string;
  companyEmail: string;
  contactPerson: string;
  section1: Section1;
  section2: Section2Item[];
  section3: Section3Item[];
  section4: Section4;
  section5: Section5;
}

export interface BuilderState {
  companyName: string;
  companyEmail: string;
  contactPerson: string;
  status: FormStatus;
  payload: ClientDiscoveryPayload;
}

export const emptySection3 = (brandName = ""): Section3Item => ({
  brandName,
  primaryGoal: "",
  campaignType: "growth",
  targetAudience: "",
  problemSolved: "",
  customerType: "existing",
  journeyFocus: "Build awareness",
  buyingBarrier: "",
  brandWords: ["", "", ""],
  differentiation: "",
  currentPerception: "",
  desiredPerception: "",
  competitors: "",
  competitorStrengths: "",
  keyMessage: "",
  callToAction: "",
  channelsUsed: "",
  workedWell: "",
  notWorkedWell: "",
  audienceEngagement: "",
  platformPreferences: "",
  startDate: "",
  campaignDuration: "",
  milestones: [],
  engagementOpportunities: { competitions: false, liveActivations: false, influencer: false, events: false },
  contentAvailable: false,
  productionSupport: false,
  brandStories: "",
  purchaseLocations: "",
  salesFocus: "both",
  campaignApproach: "growth_campaign",
  budget: "",
  successMeasurement: "",
  kpis: "",
});

export const emptyBuilder = (): BuilderState => ({
  companyName: "",
  companyEmail: "",
  contactPerson: "",
  status: "Pending",
  payload: {
    companyName: "",
    companyEmail: "",
    contactPerson: "",
    section1: {
      businessOverview: "",
      industry: "",
      brands: [{ name: "", type: "" }],
      campaignType: "COMBINED",
      objectives: ["", "", ""],
      focusType: "growth",
      challenges: "",
      lostOpportunities: "",
    },
    section2: [],
    section3: [emptySection3()],
    section4: { longTermPartnership: false, multiPlatform: false, opportunities: "" },
    section5: { decisionMakers: "", approvalProcess: "", timelines: [] },
  },
});

/**
 * Keep section2 and section3 in sync with brand list + campaignType.
 */
export function syncSections(state: BuilderState): BuilderState {
  const { brands, campaignType } = state.payload.section1;
  const validBrands = brands.filter((b) => b.name.trim().length > 0);

  // Section 2: one row per brand
  const s2 = validBrands.map((b) => {
    const existing = state.payload.section2.find((s) => s.brandName === b.name);
    return existing ?? { brandName: b.name, objective: "", priorityLevel: "Medium", timeline: "" };
  });

  // Section 3: one if combined, one per brand if per-brand
  let s3: Section3Item[];
  if (campaignType === "COMBINED") {
    const existing = state.payload.section3[0];
    s3 = [existing ? { ...existing, brandName: "Combined" } : emptySection3("Combined")];
  } else {
    s3 = validBrands.map((b) => {
      const existing = state.payload.section3.find((s) => s.brandName === b.name);
      return existing ?? emptySection3(b.name);
    });
    if (s3.length === 0) s3 = [emptySection3("")];
  }

  return {
    ...state,
    payload: { ...state.payload, section2: s2, section3: s3 },
  };
}
