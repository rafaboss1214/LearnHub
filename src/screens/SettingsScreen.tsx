import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import React, { useCallback, useContext, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { AuthUser, clearRememberedAccounts, clearSession, getCurrentUser } from "../services/auth";
import { DEFAULT_PREFERENCES, getUserPreferences, updateUserPreferences, UserPreferences } from "../services/preferences";
import { ThemeContext } from "../theme/ThemeContext";

export default function SettingsScreen({ navigation }: any) {
  const { dark, toggleTheme, colors } = useContext(ThemeContext);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useFocusEffect(useCallback(() => {
    void Promise.all([getCurrentUser(), getUserPreferences()]).then(([current, saved]) => {
      setUser(current);
      setPreferences(saved);
    });
  }, []));

  async function changePreference(key: keyof UserPreferences, value: boolean) {
    const next = await updateUserPreferences({ [key]: value });
    setPreferences(next);
  }

  function resetToLogin() {
    navigation.getParent()?.reset({ index: 0, routes: [{ name: "Login" }] });
  }

  async function changeAccount() {
    await clearSession();
    resetToLogin();
  }

  function confirmClearAccounts() {
    Alert.alert("Remover contas lembradas?", "Os e-mails salvos deixarão de aparecer na tela de login. Sua conta não será excluída.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => void clearRememberedAccounts().then(() => Alert.alert("Contas removidas", "A lista de contas lembradas foi limpa.")) },
    ]);
  }

  function confirmLogout() {
    Alert.alert("Sair da conta?", "Você poderá entrar novamente com seu e-mail e senha.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => void changeAccount() },
    ]);
  }

  return <ScrollView style={[styles.page, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>PREFERÊNCIAS</Text>
    <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
    <Text style={[styles.subtitle, { color: colors.muted }]}>Ajuste o LearnHub ao seu jeito de usar.</Text>

    <View style={[styles.profile, { backgroundColor: colors.primary }]}>
      <View style={styles.avatar}><Text style={[styles.avatarText, { color: colors.primary }]}>{user?.nome?.charAt(0).toUpperCase() || "L"}</Text></View>
      <View style={{ flex: 1 }}><Text style={styles.profileName}>{user?.nome || "Usuário LearnHub"}</Text><Text style={styles.profileMeta}>{user?.email || "Carregando conta…"}</Text></View>
    </View>

    <Section title="Aparência" colors={colors}>
      <ToggleRow icon="moon-outline" title="Tema escuro" detail="Usar cores escuras em todas as telas" value={dark} onValueChange={toggleTheme} colors={colors} />
      <ActionRow icon="phone-portrait-outline" title="Configurações do dispositivo" detail="Permissões e notificações do sistema" onPress={() => void Linking.openSettings()} colors={colors} last />
    </Section>

    <Section title="Mensagens e privacidade" colors={colors}>
      <ToggleRow icon="chatbox-ellipses-outline" title="Prévia das mensagens" detail="Mostrar a última mensagem na lista de conversas" value={preferences.showMessagePreviews} onValueChange={(value: boolean) => void changePreference("showMessagePreviews", value)} colors={colors} />
      <ToggleRow icon="checkmark-done-outline" title="Confirmação de leitura" detail="Mostrar quando suas mensagens foram visualizadas" value={preferences.showReadReceipts} onValueChange={(value: boolean) => void changePreference("showReadReceipts", value)} colors={colors} />
      <ToggleRow icon="phone-portrait-outline" title="Feedback tátil" detail="Vibrar levemente ao enviar uma mensagem" value={preferences.hapticFeedback} onValueChange={(value: boolean) => void changePreference("hapticFeedback", value)} colors={colors} last />
    </Section>

    <Section title="Conta" colors={colors}>
      <ActionRow icon="people-outline" title="Trocar de conta" detail="Voltar para a seleção de contas" onPress={() => void changeAccount()} colors={colors} />
      <ActionRow icon="trash-outline" title="Limpar contas lembradas" detail="Remover e-mails salvos da tela de login" onPress={confirmClearAccounts} colors={colors} danger />
      <ActionRow icon="log-out-outline" title="Sair da conta" detail="Encerrar a sessão neste dispositivo" onPress={confirmLogout} colors={colors} danger last />
    </Section>

    <Text style={[styles.version, { color: colors.muted }]}>LearnHub {Constants.expoConfig?.version || "1.0.0"}</Text>
  </ScrollView>;
}

function Section({ title, colors, children }: any) {
  return <><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text><View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View></>;
}

function RowBase({ icon, title, detail, colors, last, danger, right, onPress }: any) {
  const content = <><View style={[styles.rowIcon, { backgroundColor: danger ? colors.danger + "16" : colors.primarySoft }]}><Ionicons name={icon} size={21} color={danger ? colors.danger : colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: danger ? colors.danger : colors.text }]}>{title}</Text><Text style={[styles.rowDetail, { color: colors.muted }]}>{detail}</Text></View>{right}</>;
  const style = [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }];
  return onPress ? <TouchableOpacity onPress={onPress} style={style}>{content}</TouchableOpacity> : <View style={style}>{content}</View>;
}

function ToggleRow({ value, onValueChange, colors, ...props }: any) {
  return <RowBase {...props} colors={colors} right={<Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primarySoft }} thumbColor={value ? colors.primary : colors.muted} />} />;
}

function ActionRow({ colors, ...props }: any) {
  return <RowBase {...props} colors={colors} right={<Ionicons name="chevron-forward" size={19} color={colors.muted} />} />;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { padding: 20, paddingBottom: 48, width: "100%", maxWidth: 760, alignSelf: "center" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 32, fontWeight: "900", marginTop: 4 }, subtitle: { fontSize: 14, marginTop: 5 },
  profile: { borderRadius: 24, padding: 18, flexDirection: "row", alignItems: "center", gap: 13, marginTop: 22 }, avatar: { width: 52, height: 52, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 21, fontWeight: "900" }, profileName: { color: "#fff", fontSize: 16, fontWeight: "900" }, profileMeta: { color: "#ffffffbb", fontSize: 11, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginTop: 25, marginBottom: 10 }, section: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, overflow: "hidden" }, row: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 12 }, rowIcon: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" }, rowTitle: { fontSize: 14, fontWeight: "900" }, rowDetail: { fontSize: 11, lineHeight: 16, marginTop: 3 }, version: { fontSize: 11, textAlign: "center", marginTop: 25 },
});
