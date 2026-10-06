import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import Feedback, { FeedbackState } from "../components/Feedback";
import { getPlatformDashboard, PlatformDashboard } from "../services/admin";
import { deleteProject, listProjects, Project } from "../services/projects";
import { ThemeContext } from "../theme/ThemeContext";

export default function AdminScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 4 : 2;
  const metricWidth = (Math.min(width, 1000) - 48 - 12 * (columns - 1)) / columns;
  const [dashboard, setDashboard] = useState<PlatformDashboard | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summary, items] = await Promise.all([getPlatformDashboard(), listProjects()]);
      setDashboard(summary); setProjects(items);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar a administração."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function remove(project: Project) {
    setDeleting(project.id);
    try { await deleteProject(project.id); await load(); }
    catch (caught) { setFeedback({ title: "Falha ao excluir", message: caught instanceof Error ? caught.message : "Tente novamente." }); }
    finally { setDeleting(null); }
  }
  const cards = dashboard ? [
    ["Usuários", dashboard.usuarios], ["Diretores", dashboard.diretores], ["Projetos", dashboard.projetos],
    ["Concluídos", dashboard.concluidos], ["Apoios", dashboard.apoios], ["Favoritos", dashboard.favoritos], ["Comentários", dashboard.comentarios],
  ] as const : [];
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = projects.filter(item => [item.titulo, item.categoria, item.criador?.nome || ""].some(value => value.toLocaleLowerCase("pt-BR").includes(term)));
  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <Feedback value={feedback} onClose={() => setFeedback(null)} />
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}><Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} /><Text style={[styles.title, { color: colors.text }]}>Administração</Text></View>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Visão geral da plataforma e gestão de todos os projetos.</Text>
      {!!error && <Pressable onPress={() => void load()} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.danger }]}><Text style={{ color: colors.danger }}>{error} Toque para tentar novamente.</Text></Pressable>}
      {loading && !dashboard && <ActivityIndicator color={colors.primary} />}
      {!error && <>
        <View style={styles.grid}>{cards.map(([label, value]) => <View key={label} style={[styles.metric, { width: metricWidth, backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.number, { color: colors.primary }]}>{value}</Text><Text style={{ color: colors.muted }}>{label}</Text></View>)}</View>
        <Text style={[styles.section, { color: colors.text }]}>Projetos por categoria</Text>
        {!dashboard?.categorias.length && <Text style={{ color: colors.muted }}>As categorias aparecerão após a publicação dos primeiros projetos.</Text>}
        {dashboard?.categorias.map(item => <View key={item.categoria} style={[styles.category, { backgroundColor: colors.card }]}><Text style={[styles.copy, { color: colors.text }]}>{item.categoria}</Text><Text style={{ color: colors.primary, fontWeight: "800" }}>{item.total}</Text></View>)}
        <Text style={[styles.section, { color: colors.text }]}>Todos os projetos ({projects.length})</Text>
        <TextInput accessibilityLabel="Buscar projetos" placeholder="Buscar título, categoria ou autor" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} style={[styles.search, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} />
        {!filtered.length && <Text style={[styles.subtitle, { color: colors.muted }]}>Nenhum projeto encontrado.</Text>}
        {filtered.map(project => <View key={project.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.projectTitle, { color: colors.text }]}>{project.titulo}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{project.criador?.nome || "Equipe LearnHub"} · {project.categoria} · {project.status === "concluido" ? "Concluído" : "Em andamento"}</Text>
          <View style={styles.actions}>
            <Pressable style={[styles.button, { backgroundColor: colors.primarySoft }]} onPress={() => navigation.navigate("Projetos", { screen: "DetalhesProjeto", params: { projectId: project.id } })}><Text style={{ color: colors.primary, fontWeight: "800" }}>Ver projeto</Text></Pressable>
            <Pressable disabled={deleting !== null} accessibilityLabel={`Excluir ${project.titulo}`} style={[styles.button, { backgroundColor: colors.danger + "18" }]} onPress={() => setFeedback({ title: "Excluir projeto?", message: `“${project.titulo}” e suas interações serão removidos permanentemente.`, destructive: true, confirm: () => void remove(project) })}>
              {deleting === project.id ? <ActivityIndicator color={colors.danger} /> : <Text style={{ color: colors.danger, fontWeight: "800" }}>Excluir</Text>}
            </Pressable>
          </View>
        </View>)}
      </>}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1 }, content: { padding: 24, paddingBottom: 48, width: "100%", maxWidth: 1000, alignSelf: "center" },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 }, title: { fontSize: 28, fontWeight: "900", flexShrink: 1 },
  subtitle: { fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, metric: { borderWidth: 1, borderRadius: 20, padding: 22 }, number: { fontSize: 32, fontWeight: "900", marginBottom: 8 },
  section: { fontSize: 20, fontWeight: "800", marginTop: 28, marginBottom: 16 }, category: { flexDirection: "row", gap: 12, padding: 18, borderRadius: 14, marginBottom: 8 }, copy: { flex: 1 },
  search: { minHeight: 56, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  card: { padding: 22, borderWidth: 1, borderRadius: 22, marginBottom: 14 }, projectTitle: { fontSize: 18, fontWeight: "800" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, button: { minHeight: 48, paddingHorizontal: 20, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
