import { requireApiUrl } from "../config/api";

const REQUEST_TIMEOUT_MS = 10000;
export const CONNECTION_ERROR_MESSAGE =
  "Não foi possível conectar ao LearnHub agora. Verifique sua internet e tente novamente.";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let apiUrl: string;
  try {
    apiUrl = requireApiUrl();
  } catch {
    throw new ApiError(CONNECTION_ERROR_MESSAGE);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });

    if (response.status === 204) return undefined as T;

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(body.message || "Não foi possível concluir a solicitação.", response.status);
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(CONNECTION_ERROR_MESSAGE);
  } finally {
    clearTimeout(timeout);
  }
}

export async function warmUpApi() {
  try {
    await apiRequest("/api/health");
  } catch {
    // Aquecimento é oportunista; erros reais continuam sendo exibidos nas ações do usuário.
  }
}
