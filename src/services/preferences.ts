import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERENCES_KEY = "learnhub.userPreferences";

export type UserPreferences = {
  showMessagePreviews: boolean;
  showReadReceipts: boolean;
  hapticFeedback: boolean;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  showMessagePreviews: true,
  showReadReceipts: true,
  hapticFeedback: true,
};

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function updateUserPreferences(patch: Partial<UserPreferences>) {
  const next = { ...(await getUserPreferences()), ...patch };
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  return next;
}
