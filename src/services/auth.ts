import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ApiError, apiAssetUrl, apiRequest } from "./api";

export type CommunityType = "aluno" | "responsavel" | "comunidade";
export type UserAddress = { cep: string; rua: string; bairro: string; cidade: string; estado: string; numero: string; complemento: string };
export type AuthUser = {
  id: number;
  nome: string;
  email: string;
  tipo: "colaborador" | "diretor" | "admin";
  communityType?: CommunityType | null;
  descricao?: string;
  endereco?: UserAddress;
  habilidades?: string;
  institutionEvidence?: string;
  institutionStatus?: "nao_verificada" | "pendente" | "aprovada" | "recusada" | null;
  institutionReason?: string;
  avatarPath?: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type RememberedAccount = Pick<AuthUser, "id" | "nome" | "email" | "tipo">;

const TOKEN_KEY = "learnhub.authToken";
const ACCOUNTS_KEY = "learnhub.rememberedAccounts";

function hydrateUser(user: AuthUser) {
  return { ...user, avatarUrl: apiAssetUrl(user.avatarPath || "") };
}

async function rememberAccount(user: AuthUser) {
  const accounts = await getRememberedAccounts();
  const entry: RememberedAccount = { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo };
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify([entry, ...accounts.filter((item) => item.email !== user.email)].slice(0, 5)));
}

async function saveToken(token: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(TOKEN_KEY, token);
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken() {
  if (Platform.OS === "web") return AsyncStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearSession() {
  await Promise.all([
    Platform.OS === "web" ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY),
    AsyncStorage.removeItem("user"),
  ]);
}

export async function register(payload: { nome: string; email: string; senha: string; tipo: "colaborador" | "diretor"; communityType?: CommunityType; institutionEvidence?: string; cep?: string; rua?: string; bairro?: string; cidade?: string; estado?: string; numero?: string; complemento?: string }) {
  return apiRequest<{ message: string; user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(email: string, senha: string) {
  const result = await apiRequest<{ token: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
  const user = hydrateUser(result.user);
  await saveToken(result.token);
  await AsyncStorage.setItem("user", JSON.stringify(user));
  await rememberAccount(user);
  return user;
}

async function fetchCurrentUser(token: string) {
  if (!token) return null;
  try {
    const result = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = hydrateUser(result.user);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    await rememberAccount(user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await clearSession();
    return null;
  }
}

export async function getCurrentUser() {
  const [token, cachedUser] = await Promise.all([
    getAuthToken(),
    AsyncStorage.getItem("user"),
  ]);
  if (!token) return null;

  if (cachedUser) {
    try {
      const user = JSON.parse(cachedUser) as AuthUser;
      // Abre o app imediatamente; o servidor confirma a sessão sem bloquear a interface.
      void fetchCurrentUser(token);
      return user;
    } catch {
      await AsyncStorage.removeItem("user");
    }
  }

  return fetchCurrentUser(token);
}

async function authorizedAuthRequest<T>(options: RequestInit) {
  const token = await getAuthToken();
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
  return apiRequest<T>("/api/auth/me", {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
}

export async function updateProfile(payload: { nome?: string; email?: string; senha?: string; descricao?: string; habilidades?: string; endereco?: Partial<UserAddress>; avatarBase64?: string; avatarMime?: string; removeAvatar?: boolean }) {
  const result = await authorizedAuthRequest<{ user: AuthUser }>({
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const user = hydrateUser(result.user);
  await AsyncStorage.setItem("user", JSON.stringify(user));
  await rememberAccount(user);
  return user;
}

export async function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>("/api/auth/request-reset", { method: "POST", body: JSON.stringify({ email }) });
}

export async function resetPassword(email: string, code: string, senha: string) {
  return apiRequest<{ message: string }>("/api/auth/reset", { method: "POST", body: JSON.stringify({ email, code, senha }) });
}

export async function requestInstitutionReview(institutionEvidence: string) {
  const token = await getAuthToken();
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
  const result = await apiRequest<{ user: AuthUser }>("/api/auth/institution", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ institutionEvidence }),
  });
  const user = hydrateUser(result.user);
  await AsyncStorage.setItem("user", JSON.stringify(user));
  return user;
}

export async function getRememberedAccounts(): Promise<RememberedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function removeRememberedAccount(email: string) {
  const accounts = await getRememberedAccounts();
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.filter((item) => item.email !== email)));
}

export async function deleteAccount() {
  await authorizedAuthRequest<void>({ method: "DELETE" });
  await clearSession();
}
