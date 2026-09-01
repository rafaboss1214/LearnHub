import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ApiError, apiRequest } from "./api";

export type AuthUser = { id: number; nome: string; email: string; tipo: "colaborador" | "diretor"; createdAt?: string };

const TOKEN_KEY = "learnhub.authToken";

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

export async function register(payload: { nome: string; email: string; senha: string; tipo: AuthUser["tipo"] }) {
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
  await saveToken(result.token);
  await AsyncStorage.setItem("user", JSON.stringify(result.user));
  return result.user;
}

async function fetchCurrentUser(token: string) {
  if (!token) return null;
  try {
    const result = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    await AsyncStorage.setItem("user", JSON.stringify(result.user));
    return result.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await clearSession();
    return null;
  }
}

export async function getCurrentUser() {
  const [token, cachedUser] = await Promise.all([
    getToken(),
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
