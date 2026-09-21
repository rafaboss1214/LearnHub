import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthUser, deleteAccount, getCurrentUser, updateProfile } from "../services/auth";
import { listProjects, Project } from "../services/projects";
import { ThemeContext } from "../theme/ThemeContext";

export default function ProfileOverviewScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [currentUser, items] = await Promise.all([getCurrentUser(), listProjects()]);
      setUser(currentUser);
      setName(currentUser?.nome || "");
      setEmail(currentUser?.email || "");
      setProjects(items);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  const ownProjects = projects.filter((item) => item.criador?.id === user?.id).length;
  const favorites = projects.filter((item) => item.favorito).length;

  async function saveProfile() {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Campos obrigatórios", "Informe nome e e-mail.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ nome: name.trim(), email: email.trim() });
      setUser(updated);
      setEditing(false);
    } catch (caught) {
      Alert.alert("Não foi possível atualizar", caught instanceof Error ? caught.message : "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function confirmAccountDeletion() {
    Alert.alert("Excluir conta", "Sua conta será removida. Projetos publicados continuarão disponíveis para a comunidade. Deseja continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir conta",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAccount();
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } catch (caught) {
            Alert.alert("Não foi possível excluir", caught instanceof Error ? caught.message : "Tente novamente.");
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={[styles.page, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}> 
        <View style={styles.avatar}><Text style={[styles.avatarText, { color: colors.primary }]}>{user?.nome?.charAt(0).toUpperCase() || "L"}</Text></View>
        <Text style={styles.name}>{user?.nome || "Usuário LearnHub"}</Text>
        <Text style={styles.role}>{user?.tipo === "diretor" ? "Diretor" : "Colaborador"}</Text>
      </View>
      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.statNumber, { color: colors.text }]}>{ownProjects}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Projetos criados</Text></View>
        <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.statNumber, { color: colors.text }]}>{favorites}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Favoritos</Text></View>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados da conta</Text>
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}><Ionicons name="mail-outline" size={21} color={colors.primary} /><View><Text style={[styles.infoLabel, { color: colors.muted }]}>E-mail</Text><Text style={[styles.infoValue, { color: colors.text }]}>{user?.email}</Text></View></View>
        <View style={styles.infoRow}><Ionicons name="finger-print-outline" size={21} color={colors.primary} /><View><Text style={[styles.infoLabel, { color: colors.muted }]}>Identificador</Text><Text style={[styles.infoValue, { color: colors.text }]}>#{user?.id}</Text></View></View>
      </View>
      {editing ? (
        <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.muted }]}>Nome</Text>
          <TextInput value={name} onChangeText={setName} placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} />
          <Text style={[styles.infoLabel, { color: colors.muted }]}>E-mail</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} />
          <View style={styles.editActions}>
            <TouchableOpacity disabled={saving} onPress={() => setEditing(false)} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryText, { color: colors.muted }]}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity disabled={saving} onPress={() => void saveProfile()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Salvar</Text>}</TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[styles.editProfile, { backgroundColor: colors.primarySoft }]} onPress={() => setEditing(true)}><Ionicons name="create-outline" size={19} color={colors.primary} /><Text style={[styles.refreshText, { color: colors.primary }]}>Editar perfil</Text></TouchableOpacity>
      )}
      {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
      <TouchableOpacity style={[styles.refresh, { borderColor: colors.primary }]} onPress={() => void load()}><Ionicons name="refresh-outline" size={19} color={colors.primary} /><Text style={[styles.refreshText, { color: colors.primary }]}>Atualizar dados</Text></TouchableOpacity>
      <TouchableOpacity style={styles.deleteAccount} onPress={confirmAccountDeletion}><Text style={[styles.deleteAccountText, { color: colors.danger }]}>Excluir minha conta</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 20, paddingBottom: 42 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  profileCard: { borderRadius: 28, alignItems: "center", padding: 28 },
  avatar: { width: 82, height: 82, borderRadius: 25, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 34, fontWeight: "900" },
  name: { color: "#FFFFFF", fontSize: 23, fontWeight: "900", marginTop: 14 },
  role: { color: "#FFFFFFBB", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginTop: 5 },
  stats: { flexDirection: "row", gap: 12, marginTop: 18 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 18, alignItems: "center" },
  statNumber: { fontSize: 26, fontWeight: "900" },
  statLabel: { fontSize: 12, fontWeight: "600", marginTop: 3 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  infoCard: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 18 },
  infoRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600" },
  infoValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  refresh: { alignSelf: "center", borderWidth: 1, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 11, marginTop: 24 },
  refreshText: { fontSize: 13, fontWeight: "800" },
  editProfile: { alignSelf: "center", borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 18, paddingVertical: 12, marginTop: 20 },
  editCard: { borderWidth: 1, borderRadius: 22, padding: 18, marginTop: 18 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14, marginTop: 6, marginBottom: 14 },
  editActions: { flexDirection: "row", gap: 10 },
  secondaryButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 13, fontWeight: "700" },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  deleteAccount: { alignSelf: "center", padding: 13, marginTop: 7 },
  deleteAccountText: { fontSize: 12, fontWeight: "700" },
  error: { fontSize: 13, textAlign: "center", marginTop: 16 },
});
