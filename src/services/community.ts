import { apiRequest } from "./api";
import { getAuthToken } from "./auth";

export const SUPPORT_CATEGORIES = [
  "Mão de obra",
  "Recursos materiais",
  "Conhecimento",
  "Serviços",
  "Outros",
] as const;

export type CollaborationStatus = "pendente" | "aceita" | "recusada" | "concluida";
export type Collaboration = {
  id: number;
  project: { id: number; title: string; status: string };
  school: { id: number; name: string };
  supporter: { id: number; name: string };
  category: string;
  description: string;
  availability: string;
  status: CollaborationStatus;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  closure: { requestedBy: number; schoolConfirmed: boolean; supporterConfirmed: boolean } | null;
  certificateCode: string | null;
};

export type Conversation = {
  request: Collaboration;
  other: { id: number; name: string };
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export type ChatMessage = {
  id: number;
  sender: { id: number; name: string };
  recipientId: number;
  text: string;
  createdAt: string;
  read: boolean;
};

export type Certificate = {
  code: string;
  collaborator: string;
  school: string;
  project: string;
  contribution: string;
  category: string;
  completedAt: string;
  issuedAt: string;
};

export type Progress = {
  xp: number;
  level: number;
  completed: number;
  nextLevelXp: number;
  certificates: Certificate[];
};

async function authorized<T>(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
  return apiRequest<T>(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
}

export async function createCollaboration(projectId: number, input: { category: string; description: string; availability?: string }) {
  const result = await authorized<{ collaboration: Collaboration }>(`/api/projects/${projectId}/requests`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.collaboration;
}

export async function listCollaborations() {
  const result = await authorized<{ collaborations: Collaboration[] }>("/api/collaborations");
  return result.collaborations;
}

export async function decideCollaboration(id: number, status: "aceita" | "recusada", reason = "") {
  const result = await authorized<{ collaboration: Collaboration }>(`/api/collaborations/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status, reason }),
  });
  return result.collaboration;
}

export async function updateClosure(id: number, action: "request" | "confirm" | "decline") {
  const result = await authorized<{ collaboration: Collaboration }>(`/api/collaborations/${id}/closure`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
  return result.collaboration;
}

export async function issueCertificate(id: number) {
  const result = await authorized<{ certificate: Certificate }>(`/api/collaborations/${id}/certificate`, { method: "POST" });
  return result.certificate;
}

export async function getCertificate(code: string) {
  const result = await authorized<{ certificate: Certificate }>(`/api/certificates/${encodeURIComponent(code)}`);
  return result.certificate;
}

export async function listConversations() {
  const result = await authorized<{ conversations: Conversation[] }>("/api/conversations");
  return result.conversations;
}

export async function listMessages(id: number) {
  const result = await authorized<{ messages: ChatMessage[] }>(`/api/collaborations/${id}/messages`);
  return result.messages;
}

export async function sendMessage(id: number, text: string) {
  return authorized<{ message: ChatMessage }>(`/api/collaborations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function markMessagesRead(id: number) {
  return authorized<void>(`/api/collaborations/${id}/messages/read`, { method: "PUT" });
}

export async function getProgress() {
  const result = await authorized<{ progress: Progress }>("/api/progress");
  return result.progress;
}

export async function getNotifications() {
  const result = await authorized<{ notifications: { count: number; items: { kind: string; count: number; title: string; detail: string }[] } }>("/api/notifications");
  return result.notifications;
}

export async function reportProject(projectId: number, reason: string, details: string) {
  return authorized(`/api/projects/${projectId}/reports`, {
    method: "POST",
    body: JSON.stringify({ reason, details }),
  });
}

export async function getAdminDashboard() {
  const result = await authorized<{ dashboard: { projects: number; pendingReports: number; resolvedReports: number; collaborations: number } }>("/api/admin/moderation/dashboard");
  return result.dashboard;
}

export async function listReports() {
  const result = await authorized<{ reports: { id: number; projectTitle: string; reporter: string; reason: string; details: string; status: string; note: string }[] }>("/api/admin/moderation/reports");
  return result.reports;
}

export async function updateReport(id: number, action: "review" | "archive", note = "") {
  return authorized<void>(`/api/admin/moderation/reports/${id}`, {
    method: "PUT",
    body: JSON.stringify({ action, note }),
  });
}
