import axios from "axios";
import { getAuth, clearAuth } from "@/lib/auth";

export const API_BASE_URL =
  (typeof window !== "undefined" && (window as any).__API_BASE__) ||
  "https://futureapi.simplyfound.ggff.net/api";

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const auth = getAuth();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      clearAuth();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export type Role = "ROLE_USER" | "ROLE_SUPER_ADMIN";
export type FormStatus = "Pending" | "Completed";
export type CampaignType = "COMBINED" | "PER_BRAND";

export interface AuthState {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
}

export interface FormListItem {
  id: number;
  userId: number;
  ownerName: string;
  companyName: string;
  companyEmail: string;
  contactPerson: string;
  formPayload: any;
  status: FormStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: Role;
  isLocked: boolean;
  createdAt: string;
}

export interface UserAnalytics {
  totalForms: number;
  pendingForms: number;
  completedForms: number;
}

export interface AdminAnalytics extends UserAnalytics {
  totalUsers: number;
  perUser: Array<{
    userId: number;
    name: string;
    email: string;
    totalForms: number;
    pendingForms: number;
    completedForms: number;
  }>;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthState>("/auth/login", { email, password }).then((r) => r.data),
};

export const formsApi = {
  list: () => api.get<FormListItem[]>("/forms").then((r) => r.data),
  create: (body: any) => api.post<FormListItem>("/forms", body).then((r) => r.data),
  update: (id: number, body: any) =>
    api.put<FormListItem>(`/forms/${id}`, body).then((r) => r.data),
  setStatus: (id: number, status: FormStatus) =>
    api.patch<FormListItem>(`/forms/${id}/status`, null, { params: { status } }).then((r) => r.data),
  pdfUrl: (id: number) => `${API_BASE_URL}/forms/${id}/pdf`,
  downloadPdf: async (id: number) => {
    const res = await api.get(`/forms/${id}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const adminApi = {
  listUsers: () => api.get<UserRecord[]>("/admin/users").then((r) => r.data),
  createUser: (b: any) => api.post<UserRecord>("/admin/users", b).then((r) => r.data),
  updateUser: (id: number, b: any) => api.put<UserRecord>(`/admin/users/${id}`, b).then((r) => r.data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`).then((r) => r.data),
};

export const analyticsApi = {
  user: () => api.get<UserAnalytics>("/user/analytics").then((r) => r.data),
  admin: () => api.get<AdminAnalytics>("/admin/analytics").then((r) => r.data),
};
