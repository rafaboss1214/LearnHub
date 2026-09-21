import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthUser } from "../services/auth";
import { listProjects, Project, toggleFavorite, toggleSupport } from "../services/projects";
import { ThemeContext } from "../theme/ThemeContext";

type Filter = "todos" | "publicado" | "concluido";

export default function ProjectsHubScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [items, savedUser] = await Promise.all([
        listProjects(),
        AsyncStorage.getItem("user"),
      ]);
      setProjects(items);
      setUser(savedUser ? JSON.parse(savedUser) : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os projetos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return projects.filter((project) => {
      const matchesFilter = filter === "todos" || project.status === filter;
      const matchesSearch = !term || [project.titulo, project.descricao, project.categoria]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [filter, projects, search]);

  async function runProjectAction(projectId: number, action: () => Promise<unknown>) {
    setPendingId(projectId);
    try {
      await action();
      await load(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir a ação.");
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Sincronizando projetos…</Text>
      </View>
    );
  }

  const director = user?.tipo === "diretor";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>COMUNIDADE LEARNHUB</Text>
                <Text style={[styles.title, { color: colors.text }]}>Projetos</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  Ideias reais, organizadas e sincronizadas na nuvem.
                </Text>
              </View>
              {director && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate("FormularioProjeto")}
                  accessibilityLabel="Criar projeto"
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={20} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar projeto ou categoria"
                placeholderTextColor={colors.muted}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            <View style={styles.filters}>
              {(["todos", "publicado", "concluido"] as Filter[]).map((item) => {
                const active = filter === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setFilter(item)}
                    style={[
                      styles.filter,
                      {
                        backgroundColor: active ? colors.primarySoft : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.filterText, { color: active ? colors.primary : colors.muted }]}>
                      {item === "todos" ? "Todos" : item === "publicado" ? "Em andamento" : "Concluídos"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!error && (
              <TouchableOpacity style={[styles.errorBox, { borderColor: colors.danger }]} onPress={() => void load()}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error} Toque para tentar novamente.</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="folder-open-outline" size={42} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum projeto por aqui</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {search || filter !== "todos" ? "Ajuste a busca ou os filtros." : "Crie o primeiro projeto para começar."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pending = pendingId === item.id;
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("DetalhesProjeto", { projectId: item.id })}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {item.imagemUrl ? (
                <Image source={{ uri: item.imagemUrl }} style={styles.image} />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="bulb-outline" size={36} color={colors.primary} />
                </View>
              )}

              <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                  <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>{item.categoria}</Text>
                  <View style={[styles.status, { backgroundColor: item.status === "concluido" ? colors.success + "20" : colors.primarySoft }]}>
                    <Text style={[styles.statusText, { color: item.status === "concluido" ? colors.success : colors.primary }]}>
                      {item.status === "concluido" ? "Concluído" : "Em andamento"}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.titulo}</Text>
                <Text style={[styles.description, { color: colors.muted }]} numberOfLines={3}>{item.descricao}</Text>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.creatorRow}>
                    <Ionicons name="person-circle-outline" size={20} color={colors.muted} />
                    <Text style={[styles.creator, { color: colors.muted }]} numberOfLines={1}>
                      {item.criador?.nome || "Equipe LearnHub"}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      disabled={pending}
                      onPress={() => void runProjectAction(item.id, () => toggleFavorite(item.id))}
                      style={styles.iconAction}
                    >
                      <Ionicons name={item.favorito ? "heart" : "heart-outline"} size={21} color={item.favorito ? colors.danger : colors.muted} />
                      <Text style={[styles.count, { color: colors.muted }]}>{item.totalFavoritos}</Text>
                    </TouchableOpacity>
                    {!director && (
                      <TouchableOpacity
                        disabled={pending}
                        onPress={() => void runProjectAction(item.id, () => toggleSupport(item.id))}
                        style={styles.iconAction}
                      >
                        <Ionicons name={item.apoiado ? "hand-left" : "hand-left-outline"} size={21} color={item.apoiado ? colors.success : colors.muted} />
                        <Text style={[styles.count, { color: colors.muted }]}>{item.totalApoios}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  list: { padding: 20, paddingBottom: 36 },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headingCopy: { flex: 1, paddingRight: 16 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 34, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  addButton: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", elevation: 3 },
  searchBox: { height: 54, borderRadius: 17, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 10 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 22 },
  filter: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  filterText: { fontSize: 12, fontWeight: "700" },
  errorBox: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: "row", gap: 9, marginBottom: 18 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  card: { borderWidth: 1, borderRadius: 24, overflow: "hidden", marginBottom: 18, elevation: 2 },
  image: { width: "100%", height: 170 },
  imagePlaceholder: { width: "100%", height: 120, alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  category: { flex: 1, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: "800" },
  cardTitle: { fontSize: 20, lineHeight: 25, fontWeight: "800", marginTop: 12 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  cardFooter: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  creatorRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  creator: { flex: 1, fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 12 },
  iconAction: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  count: { fontSize: 12, fontWeight: "700" },
  empty: { borderWidth: 1, borderRadius: 24, alignItems: "center", padding: 34, marginTop: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: "center", marginTop: 6 },
});
