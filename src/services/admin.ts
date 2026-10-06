import { apiRequest } from "./api";
import { getAuthToken } from "./auth";

export type PlatformDashboard = {
  usuarios: number; diretores: number; projetos: number; concluidos: number;
  apoios: number; favoritos: number; comentarios: number;
  categorias: { categoria: string; total: number }[];
};
export async function getPlatformDashboard() {
  const token = await getAuthToken();
  if (!token) throw new Error("Entre novamente para acessar a administração.");
  const result = await apiRequest<{ dashboard: PlatformDashboard }>("/api/admin/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.dashboard;
}
