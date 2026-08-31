import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 3000;

function extractHost(hostUri?: string | null) {
  if (!hostUri) return null;

  const withoutScheme = hostUri.trim().replace(/^[a-z][a-z\d+.-]*:\/\//i, "");
  const authority = withoutScheme.split("/")[0];
  const host = authority.split(":")[0];
  return host || null;
}

function isUsableMetroHost(host: string | null) {
  if (!host) return false;
  if (Platform.OS === "web" && (host === "localhost" || host === "127.0.0.1")) return true;

  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
  );
}

function withoutTrailingSlash(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function resolveApiUrl() {
  // SDK 54: hostUri contém o host usado pelo Metro no Expo Go em modo LAN.
  const metroHost = extractHost(Constants.expoConfig?.hostUri);
  if (isUsableMetroHost(metroHost)) {
    return { url: `http://${metroHost}:${API_PORT}`, source: "expo-host" as const };
  }

  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl?.trim()) {
    return { url: withoutTrailingSlash(configuredUrl), source: "environment" as const };
  }

  if (Platform.OS === "web") {
    return { url: `http://localhost:${API_PORT}`, source: "localhost" as const };
  }

  return { url: null, source: "unavailable" as const };
}

const resolvedApi = resolveApiUrl();

export const API_URL = resolvedApi.url;
export const API_URL_SOURCE = resolvedApi.source;

export function requireApiUrl() {
  if (API_URL) return API_URL;
  throw new Error(
    "Não foi possível localizar o servidor. Inicie o Expo em modo LAN ou configure EXPO_PUBLIC_API_URL.",
  );
}
