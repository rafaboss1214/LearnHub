import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AuthUser = { id: number; nome: string; email: string; tipo: "colaborador" | "diretor"; createdAt?: string };

const TOKEN_KEY = "learnhub.authToken";

function getApiUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  // No Expo Go, hostUri é o endereço da máquina que executa o Metro.
  // Assim, um celular na mesma rede alcança a API local sem usar o localhost do aparelho.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:3333`;

  return "http://localhost:3333";
}

const API_URL = getApiUrl();

async function saveToken(token: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(TOKEN_KEY, token);
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function getToken() {
  if (Platform.OS === "web") return AsyncStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearSession() {
  await Promise.all([
    Platform.OS === "web" ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY),
    AsyncStorage.removeItem("user"),
  ]);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique se a API está em execução e a URL configurada.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Não foi possível concluir a solicitação.");
  return body as T;
}

export async function register(payload: { nome: string; email: string; senha: string; tipo: AuthUser["tipo"] }) {
  return request<{ message: string; user: AuthUser }>("/cadastro", { method: "POST", body: JSON.stringify(payload) });
}

export async function login(email: string, senha: string) {
  const result = await request<{ token: string; user: AuthUser }>("/login", { method: "POST", body: JSON.stringify({ email, senha }) });
  await saveToken(result.token);
  await AsyncStorage.setItem("user", JSON.stringify(result.user));
  return result.user;
}

export async function getCurrentUser() {
  const token = await getToken();
  if (!token) return null;
  try {
    const result = await request<{ user: AuthUser }>("/usuario/me", { headers: { Authorization: `Bearer ${token}` } });
    await AsyncStorage.setItem("user", JSON.stringify(result.user));
    return result.user;
  } catch {
    await clearSession();
    return null;
  }
}
