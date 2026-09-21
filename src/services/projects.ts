import { apiRequest } from "./api";
import { getAuthToken } from "./auth";

export type ProjectStatus = "publicado" | "concluido";

export type ProjectComment = {
  id: number;
  texto: string;
  usuario: { id: number; nome: string } | null;
  createdAt: string;
};

export type Project = {
  id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  imagemUrl: string;
  status: ProjectStatus;
  criador: { id: number; nome: string } | null;
  totalFavoritos: number;
  totalApoios: number;
  favorito: boolean;
  apoiado: boolean;
  comentarios?: ProjectComment[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = {
  titulo: string;
  descricao: string;
  categoria: string;
  imagemUrl?: string;
  status?: ProjectStatus;
};

async function authorizedRequest<T>(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
  return apiRequest<T>(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
}

export async function listProjects() {
  const result = await authorizedRequest<{ projects: Project[] }>("/api/projects");
  return result.projects;
}

export async function getProject(id: number) {
  const result = await authorizedRequest<{ project: Project }>(`/api/projects/${id}`);
  return result.project;
}

export async function createProject(input: ProjectInput) {
  const result = await authorizedRequest<{ project: Project }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.project;
}

export async function updateProject(id: number, input: Partial<ProjectInput>) {
  const result = await authorizedRequest<{ project: Project }>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return result.project;
}

export async function deleteProject(id: number) {
  return authorizedRequest<void>(`/api/projects/${id}`, { method: "DELETE" });
}

export async function toggleFavorite(id: number) {
  return authorizedRequest<{ favorito: boolean }>(`/api/projects/${id}/favorite`, {
    method: "POST",
  });
}

export async function toggleSupport(id: number) {
  return authorizedRequest<{ apoiado: boolean }>(`/api/projects/${id}/support`, {
    method: "POST",
  });
}

export async function addComment(id: number, texto: string) {
  const result = await authorizedRequest<{ comment: ProjectComment }>(
    `/api/projects/${id}/comments`,
    { method: "POST", body: JSON.stringify({ texto }) },
  );
  return result.comment;
}

export async function deleteComment(commentId: number) {
  return authorizedRequest<void>(`/api/projects/comments/${commentId}`, { method: "DELETE" });
}
