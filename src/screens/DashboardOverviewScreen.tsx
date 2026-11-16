import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentUser } from "../services/auth";
import { listProjects, Project } from "../services/projects";
import { ThemeContext } from "../theme/ThemeContext";

export default function DashboardOverviewScreen() {
  const { colors } = useContext(ThemeContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [items, currentUser] = await Promise.all([listProjects(), getCurrentUser()]);
      setProjects(items.filter((item) => Number(item.criador?.id) === Number(currentUser?.id)));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const supports = projects.reduce((sum, item) => sum + item.totalApoios, 0);
  const favorites = projects.reduce((sum, item) => sum + item.totalFavoritos, 0);
  const completed = projects.filter((item) => item.status === "concluido").length;
  const categories = Object.entries(projects.reduce<Record<string, number>>((summary, item) => {
    summary[item.categoria] = (summary[item.categoria] || 0) + 1;
    return summary;
  }, {})).sort((a, b) => b[1] - a[1]);

  const cards = [
    { label: "Projetos da escola", value: projects.length, icon: "folder-outline" as const, color: colors.primary },
    { label: "Apoios recebidos", value: supports, icon: "hand-left-outline" as const, color: colors.success },
    { label: "Favoritos recebidos", value: favorites, icon: "heart-outline" as const, color: colors.danger },
    { label: "Concluídos", value: completed, icon: "checkmark-done-outline" as const, color: colors.accent },
  ];

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>VISÃO GERAL</Text>
        <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Indicadores exclusivos dos projetos criados por esta escola.</Text>
        {loading ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : (
          <>
            <View style={styles.grid}>
              {cards.map((card) => (
                <View key={card.label} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.cardIcon, { backgroundColor: card.color + "20" }]}><Ionicons name={card.icon} size={23} color={card.color} /></View>
                  <Text style={[styles.number, { color: colors.text }]}>{card.value}</Text>
                  <Text style={[styles.label, { color: colors.muted }]}>{card.label}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.insight, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="analytics-outline" size={26} color={colors.primary} />
              <View style={styles.insightCopy}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Impacto visível</Text>
                <Text style={[styles.insightText, { color: colors.muted }]}>Os números consideram somente os projetos desta conta, sem misturar iniciativas de outras escolas.</Text>
              </View>
            </View>
            {!!categories.length && <View style={[styles.categoriesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.categoriesHeader}><View><Text style={[styles.categoriesTitle, { color: colors.text }]}>Projetos por categoria</Text><Text style={[styles.categoriesSubtitle, { color: colors.muted }]}>Distribuição das iniciativas da escola</Text></View><Ionicons name="options-outline" size={22} color={colors.primary} /></View>
              {categories.map(([category, total]) => <View key={category} style={[styles.categoryRow, { borderTopColor: colors.border }]}><Text style={[styles.categoryName, { color: colors.text }]}>{category}</Text><View style={[styles.categoryCount, { backgroundColor: colors.primarySoft }]}><Text style={{ color: colors.primary, fontWeight: "900", fontSize: 11 }}>{total}</Text></View></View>)}
            </View>}
          </>
        )}
        {!!error && <Text style={[styles.error, { color: colors.danger }]} onPress={() => void load()}>{error} Toque para tentar novamente.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 24, paddingBottom: 48, width: "100%", maxWidth: 900, alignSelf: "center" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  title: { fontSize: 34, fontWeight: "900", letterSpacing: -0.8, marginTop: 4 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 23 },
  loader: { marginTop: 50 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { flexGrow: 1, flexBasis: 140, minHeight: 148, borderWidth: 1, borderRadius: 23, padding: 22 },
  cardIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  number: { fontSize: 31, fontWeight: "900", marginTop: 14 },
  label: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  insight: { borderRadius: 23, padding: 18, flexDirection: "row", alignItems: "flex-start", marginTop: 22 },
  insightCopy: { flex: 1, marginLeft: 13 },
  insightTitle: { fontSize: 16, fontWeight: "800" },
  insightText: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  categoriesCard: { borderWidth: 1, borderRadius: 23, padding: 18, marginTop: 16 },
  categoriesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  categoriesTitle: { fontSize: 16, fontWeight: "900" },
  categoriesSubtitle: { fontSize: 11, marginTop: 3 },
  categoryRow: { minHeight: 48, borderTopWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  categoryName: { flex: 1, fontSize: 13, fontWeight: "700" },
  categoryCount: { minWidth: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  error: { fontSize: 13, lineHeight: 18, marginTop: 18 },
});
