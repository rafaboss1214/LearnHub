import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getProgress, Progress } from "../services/community";
import { ThemeContext } from "../theme/ThemeContext";

export default function ProgressScreen() {
  const { colors } = useContext(ThemeContext);
  const [data, setData] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await getProgress());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar a progressão.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const target = data?.nextLevelXp || data?.xp || 1;
  const percentage = Math.min(100, Math.round(((data?.xp || 0) / target) * 100));

  return <View style={[styles.page, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>PROGRESSÃO</Text>
    <Text style={[styles.title, { color: colors.text }]}>Seu impacto</Text>
    <Text style={[styles.subtitle, { color: colors.muted }]}>Cada colaboração concluída por acordo concede 20 XP.</Text>
    {loading && <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} />}
    {!!error && <TouchableOpacity onPress={() => void load()}><Text style={[styles.error, { color: colors.danger }]}>{error} Toque para tentar novamente.</Text></TouchableOpacity>}
    {data && <>
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.levelIcon}><Ionicons name="trophy-outline" size={34} color={colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={styles.levelLabel}>NÍVEL {data.level}</Text><Text style={styles.xp}>{data.xp} XP</Text><View style={styles.track}><View style={[styles.fill, { width: `${percentage}%` }]} /></View><Text style={styles.next}>{data.nextLevelXp > data.xp ? `${data.nextLevelXp - data.xp} XP para o próximo nível` : "Nível máximo atual"}</Text></View>
      </View>
      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="checkmark-done-outline" size={25} color={colors.success} /><Text style={[styles.statValue, { color: colors.text }]}>{data.completed}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Colaborações concluídas</Text></View>
        <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="sparkles-outline" size={25} color={colors.primary} /><Text style={[styles.statValue, { color: colors.text }]}>20 XP</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Por conclusão confirmada</Text></View>
      </View>
      <View style={[styles.info, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.infoIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="people-outline" size={28} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.infoTitle, { color: colors.text }]}>Como avançar</Text><Text style={[styles.infoText, { color: colors.muted }]}>Participe de projetos, combine a colaboração pelo chat e confirme a conclusão com a escola para receber seus pontos.</Text></View></View>
    </>}
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { padding: 20, paddingBottom: 44 }, eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 32, fontWeight: "900", marginTop: 4 }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5 }, error: { marginTop: 22 }, hero: { borderRadius: 26, padding: 20, marginTop: 24, flexDirection: "row", alignItems: "center", gap: 15 }, levelIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }, levelLabel: { color: "#ffffffbb", fontSize: 11, fontWeight: "900", letterSpacing: 1 }, xp: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 2 }, track: { height: 7, borderRadius: 4, backgroundColor: "#ffffff33", marginTop: 10, overflow: "hidden" }, fill: { height: "100%", backgroundColor: "#fff" }, next: { color: "#ffffffbb", fontSize: 10, marginTop: 6 }, stats: { flexDirection: "row", gap: 11, marginTop: 16 }, stat: { flex: 1, minHeight: 142, borderWidth: 1, borderRadius: 19, padding: 18, alignItems: "center", justifyContent: "center" }, statValue: { fontSize: 24, fontWeight: "900", marginTop: 8 }, statLabel: { fontSize: 12, lineHeight: 17, marginTop: 3, textAlign: "center" }, info: { borderWidth: 1, borderRadius: 22, padding: 18, flexDirection: "row", gap: 13, alignItems: "center", marginTop: 16 }, infoIcon: { width: 54, height: 54, borderRadius: 17, alignItems: "center", justifyContent: "center" }, infoTitle: { fontSize: 16, fontWeight: "900" }, infoText: { fontSize: 12, lineHeight: 18, marginTop: 4 },
});
