import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthUser, getCurrentUser } from "../services/auth";
import { listProjects, Project } from "../services/projects";
import { ThemeContext } from "../theme/ThemeContext";

export default function HomeOverviewScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [currentUser, items] = await Promise.all([getCurrentUser(), listProjects()]);
      setUser(currentUser);
      setProjects(items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o resumo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const inProgress = projects.filter((item) => item.status === "publicado").length;
  const completed = projects.filter((item) => item.status === "concluido").length;

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={[styles.greeting, { color: colors.muted }]}>Olá, {user?.nome?.split(" ")[0] || "visitante"}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Vamos transformar ideias?</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{user?.nome?.charAt(0).toUpperCase() || "L"}</Text></View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>LEARNHUB</Text>
            <Text style={styles.heroTitle}>Educação ganha força quando vira colaboração.</Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate("Projetos")}>
              <Text style={[styles.heroButtonText, { color: colors.primary }]}>Explorar projetos</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Ionicons name="school-outline" size={68} color="#FFFFFF55" />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo da comunidade</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : (
          <View style={styles.stats}>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="folder-open-outline" size={22} color={colors.primary} /></View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{projects.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Projetos</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.accent + "25" }]}><Ionicons name="time-outline" size={22} color={colors.accent} /></View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{inProgress}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Em andamento</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.success + "20" }]}><Ionicons name="checkmark-circle-outline" size={22} color={colors.success} /></View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{completed}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Concluídos</Text>
            </View>
          </View>
        )}
        {!!error && <Text style={[styles.error, { color: colors.danger }]} onPress={() => void load()}>{error} Toque para tentar novamente.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, padding: 24, paddingBottom: 48, width: "100%", maxWidth: 900, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 25, fontWeight: "900", letterSpacing: -0.5, marginTop: 3 },
  avatar: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  hero: { minHeight: 210, borderRadius: 28, padding: 22, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  heroCopy: { flex: 1, paddingRight: 10 },
  heroEyebrow: { color: "#FFFFFFAA", fontSize: 10, letterSpacing: 1.5, fontWeight: "900" },
  heroTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 29, fontWeight: "900", marginTop: 8 },
  heroButton: { alignSelf: "flex-start", marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", gap: 7, alignItems: "center" },
  heroButtonText: { fontSize: 12, fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 28, marginBottom: 14 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, flexBasis: 100, minHeight: 145, borderWidth: 1, borderRadius: 20, padding: 18 },
  statIcon: { width: 39, height: 39, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statNumber: { fontSize: 25, fontWeight: "900", marginTop: 12 },
  statLabel: { fontSize: 11, lineHeight: 15, fontWeight: "600", marginTop: 2 },
  error: { fontSize: 13, lineHeight: 19, marginTop: 18 },
});
