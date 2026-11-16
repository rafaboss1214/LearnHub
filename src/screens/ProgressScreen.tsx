import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getProgress, Progress } from "../services/community";
import { ThemeContext } from "../theme/ThemeContext";

export default function ProgressScreen() {
  const { colors } = useContext(ThemeContext);
  const [data, setData] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [progressAnimation] = useState(() => new Animated.Value(0));

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      setData(await getProgress());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar a progressão.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    if (!data) return;
    progressAnimation.setValue(0);
    Animated.timing(progressAnimation, { toValue: data.progressPercent, duration: 700, useNativeDriver: false }).start();
  }, [data, progressAnimation]);

  const animatedWidth = progressAnimation.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const unlocked = data?.achievements.filter((item) => item.unlocked).length || 0;

  return <View style={[styles.page, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>JORNADA DE IMPACTO</Text>
    <Text style={[styles.title, { color: colors.text }]}>Sua progressão</Text>
    <Text style={[styles.subtitle, { color: colors.muted }]}>Complete missões, evolua de nível e desbloqueie conquistas enquanto transforma sua comunidade.</Text>

    {loading && <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />}
    {!!error && <TouchableOpacity onPress={() => void load()} style={[styles.errorCard, { borderColor: colors.danger }]}><Ionicons name="refresh-outline" size={21} color={colors.danger} /><Text style={[styles.error, { color: colors.danger }]}>{error} Toque para tentar novamente.</Text></TouchableOpacity>}

    {data && <>
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroTop}>
          <View style={styles.levelOrb}><Ionicons name={data.level >= data.maxLevel ? "trophy" : "shield"} size={34} color={colors.primary} /><View style={[styles.levelNumber, { backgroundColor: colors.primary }]}><Text style={styles.levelNumberText}>{data.level}</Text></View></View>
          <View style={{ flex: 1 }}><Text style={styles.levelOverline}>NÍVEL {data.level} DE {data.maxLevel}</Text><Text style={styles.levelTitle}>{data.levelTitle}</Text><Text style={styles.xp}>{data.xp} XP acumulados</Text></View>
          <View style={styles.badgeCount}><Ionicons name="ribbon" size={18} color="#FFD166" /><Text style={styles.badgeCountText}>{unlocked}/{data.achievements.length}</Text></View>
        </View>
        <View style={styles.track}><Animated.View style={[styles.fill, { width: animatedWidth }]} /></View>
        <View style={styles.progressLegend}><Text style={styles.progressText}>{data.progressPercent}% do nível</Text><Text style={styles.progressText}>{data.xpForNextLevel > 0 ? `${data.xpForNextLevel} XP restantes` : "Nível máximo alcançado"}</Text></View>
      </View>

      <View style={styles.stats}>
        <Stat icon="checkmark-done" value={data.completed} label="Concluídas" color={colors.success} colors={colors} />
        <Stat icon="flame" value={data.streak} label="Dias em sequência" color="#FF7A45" colors={colors} />
        <Stat icon="chatbubbles" value={data.stats.messages} label="Mensagens" color="#15AABF" colors={colors} />
      </View>

      <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: colors.text }]}>Missões atuais</Text><Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Pequenos objetivos para continuar avançando.</Text></View><Ionicons name="game-controller-outline" size={25} color={colors.primary} /></View>
      <View style={styles.missions}>{data.missions.map((mission) => {
        const percentage = Math.min(100, Math.round((mission.current / Math.max(1, mission.target)) * 100));
        return <View key={mission.id} style={[styles.mission, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.missionIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name={mission.icon as any} size={23} color={colors.primary} /></View>
          <View style={{ flex: 1 }}><View style={styles.missionTitleRow}><Text style={[styles.missionTitle, { color: colors.text }]}>{mission.title}</Text><Text style={[styles.missionCount, { color: colors.primary }]}>{Math.min(mission.current, mission.target)}/{mission.target}</Text></View><Text style={[styles.missionDetail, { color: colors.muted }]}>{mission.detail}</Text><View style={[styles.missionTrack, { backgroundColor: colors.border }]}><View style={[styles.missionFill, { width: `${percentage}%`, backgroundColor: colors.primary }]} /></View><View style={styles.reward}><Ionicons name="sparkles" size={13} color="#FFB020" /><Text style={styles.rewardText}>{mission.reward}</Text></View></View>
        </View>;
      })}</View>

      <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: colors.text }]}>Selos e conquistas</Text><Text style={[styles.sectionSubtitle, { color: colors.muted }]}>{unlocked} de {data.achievements.length} desbloqueados</Text></View><Ionicons name="ribbon-outline" size={25} color={colors.primary} /></View>
      <View style={styles.achievements}>{data.achievements.map((achievement) => <View key={achievement.id} style={[styles.achievement, { backgroundColor: colors.card, borderColor: achievement.unlocked ? achievement.color : colors.border, opacity: achievement.unlocked ? 1 : .65 }]}>
        <View style={[styles.achievementIcon, { backgroundColor: achievement.unlocked ? achievement.color + "22" : colors.background }]}><Ionicons name={(achievement.unlocked ? achievement.icon : "lock-closed") as any} size={27} color={achievement.unlocked ? achievement.color : colors.muted} />{achievement.unlocked && <View style={[styles.unlockedCheck, { backgroundColor: colors.success }]}><Ionicons name="checkmark" size={11} color="#fff" /></View>}</View>
        <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</Text><Text style={[styles.achievementDescription, { color: colors.muted }]}>{achievement.description}</Text><Text style={[styles.achievementProgress, { color: achievement.unlocked ? colors.success : colors.primary }]}>{achievement.unlocked ? "CONQUISTADO" : `${achievement.progress}/${achievement.target}`}</Text>
      </View>)}</View>

      <View style={[styles.tip, { backgroundColor: colors.primarySoft }]}><Ionicons name="information-circle-outline" size={25} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.tipTitle, { color: colors.primary }]}>Como ganhar XP</Text><Text style={[styles.tipText, { color: colors.text }]}>Quando os dois participantes confirmam a conclusão de uma colaboração, cada um recebe 20 XP automaticamente.</Text></View></View>
    </>}
  </ScrollView></View>;
}

function Stat({ icon, value, label, color, colors }: any) {
  return <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={icon} size={23} color={color} /><Text style={[styles.statValue, { color: colors.text }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { padding: 20, paddingBottom: 52 }, eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 34, fontWeight: "900", marginTop: 4, letterSpacing: -.5 }, subtitle: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  errorCard: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", gap: 9, alignItems: "center", marginTop: 22 }, error: { flex: 1, fontSize: 12, lineHeight: 18 },
  hero: { borderRadius: 28, padding: 20, marginTop: 24, overflow: "hidden" }, heroTop: { flexDirection: "row", alignItems: "center", gap: 14 }, levelOrb: { width: 68, height: 68, borderRadius: 23, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }, levelNumber: { position: "absolute", right: -4, bottom: -4, width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center" }, levelNumberText: { color: "#fff", fontSize: 10, fontWeight: "900" }, levelOverline: { color: "#FFFFFFB8", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, levelTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 2 }, xp: { color: "#FFFFFFCC", fontSize: 11, fontWeight: "700", marginTop: 3 }, badgeCount: { alignItems: "center", gap: 3 }, badgeCountText: { color: "#fff", fontSize: 10, fontWeight: "900" }, track: { height: 10, borderRadius: 6, backgroundColor: "#FFFFFF30", marginTop: 18, overflow: "hidden" }, fill: { height: "100%", borderRadius: 6, backgroundColor: "#fff" }, progressLegend: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 }, progressText: { color: "#FFFFFFC8", fontSize: 10, fontWeight: "700" },
  stats: { flexDirection: "row", gap: 9, marginTop: 14 }, stat: { flex: 1, minHeight: 112, borderWidth: 1, borderRadius: 20, padding: 12, alignItems: "center", justifyContent: "center" }, statValue: { fontSize: 23, fontWeight: "900", marginTop: 5 }, statLabel: { fontSize: 10, lineHeight: 14, marginTop: 2, textAlign: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 12 }, sectionTitle: { fontSize: 20, fontWeight: "900" }, sectionSubtitle: { fontSize: 11, marginTop: 3 }, missions: { gap: 10 }, mission: { borderWidth: 1, borderRadius: 21, padding: 15, flexDirection: "row", gap: 12 }, missionIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" }, missionTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, missionTitle: { flex: 1, fontSize: 14, fontWeight: "900" }, missionCount: { fontSize: 11, fontWeight: "900" }, missionDetail: { fontSize: 11, lineHeight: 16, marginTop: 3 }, missionTrack: { height: 6, borderRadius: 4, overflow: "hidden", marginTop: 9 }, missionFill: { height: "100%", borderRadius: 4 }, reward: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 }, rewardText: { color: "#C88900", fontSize: 9, fontWeight: "900" },
  achievements: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, achievement: { width: "48%", minHeight: 188, borderWidth: 1, borderRadius: 22, padding: 15, alignItems: "center" }, achievementIcon: { width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center" }, unlockedCheck: { position: "absolute", right: -4, bottom: -4, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }, achievementTitle: { fontSize: 13, fontWeight: "900", textAlign: "center", marginTop: 11 }, achievementDescription: { fontSize: 10, lineHeight: 14, textAlign: "center", marginTop: 5, flex: 1 }, achievementProgress: { fontSize: 9, fontWeight: "900", letterSpacing: .5, marginTop: 8 },
  tip: { borderRadius: 21, padding: 16, flexDirection: "row", gap: 12, alignItems: "center", marginTop: 22 }, tipTitle: { fontSize: 14, fontWeight: "900" }, tipText: { fontSize: 11, lineHeight: 17, marginTop: 3 },
});
