import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthUser, getCurrentUser } from "../services/auth";
import { listProjects, Project, toggleFavorite, toggleSupport } from "../services/projects";
import { ThemeContext } from "../theme/ThemeContext";

type Scope = "todos" | "favoritos" | "meus";
type StatusFilter = "todos" | "publicado" | "concluido";
type SortMode = "recentes" | "apoios" | "favoritos" | "az";

export default function ProjectsHubScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<Scope>("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [projectCategory, setProjectCategory] = useState("Todas");
  const [supportCategory, setSupportCategory] = useState("Todas");
  const [sortMode, setSortMode] = useState<SortMode>("recentes");
  const [showFilters, setShowFilters] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [items, savedUser] = await Promise.all([
        listProjects(),
        getCurrentUser(),
      ]);
      setProjects(items);
      setUser(savedUser);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os projetos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const projectCategories = useMemo(() => ["Todas", ...Array.from(new Set(projects.map((item) => item.categoria))).sort()], [projects]);
  const supportCategories = useMemo(() => ["Todas", ...Array.from(new Set(projects.flatMap((item) => item.supportCategories || []))).sort()], [projects]);
  const activeFilterCount = Number(statusFilter !== "todos") + Number(projectCategory !== "Todas") + Number(supportCategory !== "Todas") + Number(sortMode !== "recentes");

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const visible = projects.filter((project) => {
      const matchesScope = scope === "todos"
        || (scope === "favoritos" && project.favorito)
        || (scope === "meus" && Number(project.criador?.id) === Number(user?.id));
      const matchesStatus = statusFilter === "todos" || project.status === statusFilter;
      const matchesProjectCategory = projectCategory === "Todas" || project.categoria === projectCategory;
      const matchesSupportCategory = supportCategory === "Todas" || project.supportCategories?.includes(supportCategory);
      const matchesSearch = !term || [project.titulo, project.descricao, project.categoria, project.criador?.nome || "", ...(project.supportCategories || [])]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
      return matchesScope && matchesStatus && matchesProjectCategory && matchesSupportCategory && matchesSearch;
    });
    return [...visible].sort((a, b) => {
      if (sortMode === "apoios") return b.totalApoios - a.totalApoios;
      if (sortMode === "favoritos") return b.totalFavoritos - a.totalFavoritos;
      if (sortMode === "az") return a.titulo.localeCompare(b.titulo, "pt-BR");
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [projectCategory, projects, scope, search, sortMode, statusFilter, supportCategory, user?.id]);

  async function updateFavorite(project: Project) {
    setPendingId(project.id);
    try {
      const result = await toggleFavorite(project.id);
      setProjects((current) => current.map((item) => item.id === project.id ? {
        ...item,
        favorito: result.favorito,
        totalFavoritos: Math.max(0, item.totalFavoritos + (result.favorito ? 1 : -1)),
      } : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o favorito.");
    } finally {
      setPendingId(null);
    }
  }

  async function updateSupport(project: Project) {
    setPendingId(project.id);
    try {
      const result = await toggleSupport(project.id);
      setProjects((current) => current.map((item) => item.id === project.id ? {
        ...item,
        apoiado: result.apoiado,
        totalApoios: Math.max(0, item.totalApoios + (result.apoiado ? 1 : -1)),
      } : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o apoio.");
    } finally {
      setPendingId(null);
    }
  }

  function clearFilters() {
    setStatusFilter("todos");
    setProjectCategory("Todas");
    setSupportCategory("Todas");
    setSortMode("recentes");
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Sincronizando projetos…</Text>
      </View>
    );
  }

  const director = user?.tipo === "diretor" || user?.tipo === "admin";
  const collaborator = user?.tipo === "colaborador";
  const scopeOptions: { id: Scope; label: string; icon: keyof typeof Ionicons.glyphMap; count: number }[] = [
    { id: "todos", label: "Explorar", icon: "compass-outline", count: projects.length },
    { id: "favoritos", label: "Favoritos", icon: "heart", count: projects.filter((item) => item.favorito).length },
    ...(director ? [{ id: "meus" as const, label: "Meus projetos", icon: "school-outline" as const, count: projects.filter((item) => Number(item.criador?.id) === Number(user?.id)).length }] : []),
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["left", "right"]}>
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
                placeholder="Buscar projeto, escola ou categoria"
                placeholderTextColor={colors.muted}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeTabs}>
              {scopeOptions.map((item) => {
                const active = scope === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setScope(item.id)}
                    style={[
                      styles.scopeTab,
                      {
                        backgroundColor: active ? colors.primarySoft : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={17} color={active ? colors.primary : colors.muted} />
                    <Text style={[styles.filterText, { color: active ? colors.primary : colors.muted }]}>{item.label}</Text>
                    <View style={[styles.scopeCount, { backgroundColor: active ? colors.primary : colors.surface }]}><Text style={{ color: active ? "#fff" : colors.muted, fontSize: 10, fontWeight: "900" }}>{item.count}</Text></View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.organizerRow}>
              <View><Text style={[styles.resultCount, { color: colors.text }]}>{filteredProjects.length} {filteredProjects.length === 1 ? "projeto" : "projetos"}</Text><Text style={[styles.resultHint, { color: colors.muted }]}>Resultados organizados para você</Text></View>
              <TouchableOpacity onPress={() => setShowFilters((current) => !current)} style={[styles.filterButton, { backgroundColor: showFilters || activeFilterCount ? colors.primarySoft : colors.card, borderColor: showFilters || activeFilterCount ? colors.primary : colors.border }]}>
                <Ionicons name="options-outline" size={19} color={showFilters || activeFilterCount ? colors.primary : colors.muted} />
                <Text style={{ color: showFilters || activeFilterCount ? colors.primary : colors.muted, fontSize: 12, fontWeight: "800" }}>Filtros{activeFilterCount ? ` · ${activeFilterCount}` : ""}</Text>
              </TouchableOpacity>
            </View>

            {showFilters && <View style={[styles.advancedFilters, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FilterGroup title="Situação" values={["todos", "publicado", "concluido"]} selected={statusFilter} onSelect={(value) => setStatusFilter(value as StatusFilter)} labels={{ todos: "Todas", publicado: "Em andamento", concluido: "Concluídos" }} colors={colors} />
              <FilterGroup title="Categoria do projeto" values={projectCategories} selected={projectCategory} onSelect={setProjectCategory} colors={colors} />
              <FilterGroup title="Tipo de colaboração" values={supportCategories} selected={supportCategory} onSelect={setSupportCategory} colors={colors} />
              <FilterGroup title="Ordenar por" values={["recentes", "apoios", "favoritos", "az"]} selected={sortMode} onSelect={(value) => setSortMode(value as SortMode)} labels={{ recentes: "Mais recentes", apoios: "Mais apoiados", favoritos: "Mais favoritados", az: "A–Z" }} colors={colors} />
              {activeFilterCount > 0 && <TouchableOpacity onPress={clearFilters} style={styles.clearFilters}><Ionicons name="refresh-outline" size={17} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: 12, fontWeight: "900" }}>Limpar filtros</Text></TouchableOpacity>}
            </View>}

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
              {scope === "favoritos" ? "Toque no coração de um projeto para guardá-lo aqui." : search || activeFilterCount ? "Ajuste a busca ou limpe os filtros." : "Crie o primeiro projeto para começar."}
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
                      onPress={() => void updateFavorite(item)}
                      style={styles.iconAction}
                    >
                      <Ionicons name={item.favorito ? "heart" : "heart-outline"} size={21} color={item.favorito ? colors.danger : colors.muted} />
                      <Text style={[styles.count, { color: colors.muted }]}>{item.totalFavoritos}</Text>
                    </TouchableOpacity>
                    {collaborator && (
                      <TouchableOpacity
                        disabled={pending}
                        onPress={() => void updateSupport(item)}
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

function FilterGroup({ title, values, selected, onSelect, labels = {}, colors }: { title: string; values: readonly string[]; selected: string; onSelect: (value: string) => void; labels?: Record<string, string>; colors: any }) {
  return <View style={styles.filterGroup}><Text style={[styles.filterGroupTitle, { color: colors.text }]}>{title}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterGroupOptions}>{values.map((value) => { const active = selected === value; return <TouchableOpacity key={value} onPress={() => onSelect(value)} style={[styles.filterChip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}><Text style={{ color: active ? "#fff" : colors.muted, fontSize: 11, fontWeight: "800" }}>{labels[value] || value}</Text></TouchableOpacity>; })}</ScrollView></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  list: { padding: 24, paddingBottom: 48, width: "100%", maxWidth: 900, alignSelf: "center" },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headingCopy: { flex: 1, paddingRight: 16 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 34, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  addButton: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", elevation: 3 },
  searchBox: { height: 54, borderRadius: 17, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 10 },
  scopeTabs: { gap: 9, paddingBottom: 16 },
  scopeTab: { minHeight: 44, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 7 },
  scopeCount: { minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  filterText: { fontSize: 12, fontWeight: "700" },
  organizerRow: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  resultCount: { fontSize: 15, fontWeight: "900" },
  resultHint: { fontSize: 10, marginTop: 2 },
  filterButton: { minHeight: 42, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 7 },
  advancedFilters: { borderWidth: 1, borderRadius: 22, padding: 15, marginBottom: 18 },
  filterGroup: { marginBottom: 14 },
  filterGroupTitle: { fontSize: 12, fontWeight: "900", marginBottom: 8 },
  filterGroupOptions: { gap: 7 },
  filterChip: { minHeight: 37, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  clearFilters: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
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
  iconAction: { minHeight: 44, minWidth: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 8 },
  count: { fontSize: 12, fontWeight: "700" },
  empty: { borderWidth: 1, borderRadius: 24, alignItems: "center", padding: 34, marginTop: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: "center", marginTop: 6 },
});
