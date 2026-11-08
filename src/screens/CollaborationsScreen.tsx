import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthUser, getCurrentUser } from "../services/auth";
import { Collaboration, CollaborationStatus, decideCollaboration, issueCertificate, listCollaborations } from "../services/community";
import { ThemeContext } from "../theme/ThemeContext";

const labels: Record<CollaborationStatus, string> = { pendente: "Pendente", aceita: "Aceita", recusada: "Recusada", concluida: "Concluída" };

export default function CollaborationsScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<Collaboration[]>([]);
  const [filter, setFilter] = useState<"todas" | CollaborationStatus>("todas");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState<Collaboration | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const [current, collaborations] = await Promise.all([getCurrentUser(), listCollaborations()]);
      setUser(current); setRows(collaborations); setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar as solicitações.");
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const visible = useMemo(() => filter === "todas" ? rows : rows.filter((row) => row.status === filter), [filter, rows]);

  async function act(id: number, action: () => Promise<unknown>) {
    setBusy(id);
    try { await action(); await load(); }
    catch (caught) { Alert.alert("Não foi possível concluir", caught instanceof Error ? caught.message : "Tente novamente."); }
    finally { setBusy(null); }
  }

  async function confirmRejection() {
    if (!rejecting || reason.trim().length < 3) return;
    const target = rejecting;
    setRejecting(null);
    await act(target.id, () => decideCollaboration(target.id, "recusada", reason.trim()));
    setReason("");
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>COLABORAÇÕES</Text>
        <Text style={[styles.title, { color: colors.text }]}>Solicitações</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{user?.tipo === "colaborador" ? "Acompanhe suas ofertas de ajuda." : "Analise as ofertas recebidas nos seus projetos."}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(["todas", "pendente", "aceita", "recusada", "concluida"] as const).map((item) => {
            const selected = filter === item;
            return <TouchableOpacity key={item} onPress={() => setFilter(item)} style={[styles.filter, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.card }]}><Text style={{ color: selected ? colors.primary : colors.muted, fontWeight: "800" }}>{item === "todas" ? "Todas" : labels[item]}</Text></TouchableOpacity>;
          })}
        </ScrollView>

        {loading && <ActivityIndicator color={colors.primary} />}
        {!!error && <TouchableOpacity onPress={() => void load()}><Text style={[styles.error, { color: colors.danger }]}>{error} Toque para tentar novamente.</Text></TouchableOpacity>}
        {!loading && !visible.length && <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="people-outline" size={42} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma solicitação</Text><Text style={[styles.emptyText, { color: colors.muted }]}>As colaborações aparecerão aqui.</Text></View>}

        {visible.map((row) => {
          const owner = Number(row.school.id) === Number(user?.id);
          return <View key={row.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.text }]}>{row.project.title}</Text><Text style={[styles.person, { color: colors.muted }]}>{owner ? row.supporter.name : row.school.name}</Text></View><View style={[styles.badge, { backgroundColor: row.status === "concluida" ? colors.success + "20" : colors.primarySoft }]}><Text style={{ color: row.status === "concluida" ? colors.success : colors.primary, fontSize: 11, fontWeight: "900" }}>{labels[row.status]}</Text></View></View>
            <Text style={[styles.category, { color: colors.primary }]}>{row.category}</Text>
            <Text style={[styles.description, { color: colors.text }]}>{row.description}</Text>
            {!!row.availability && <Text style={[styles.meta, { color: colors.muted }]}>Disponibilidade: {row.availability}</Text>}
            {!!row.rejectionReason && <Text style={[styles.rejection, { color: colors.danger }]}>Motivo: {row.rejectionReason}</Text>}
            {!!row.closure && row.status === "aceita" && <Text style={[styles.notice, { color: colors.accent }]}>Encerramento solicitado; aguarda confirmação no chat.</Text>}
            <View style={styles.actions}>
              {owner && row.status === "pendente" && <><TouchableOpacity disabled={busy === row.id} onPress={() => void act(row.id, () => decideCollaboration(row.id, "aceita"))} style={[styles.primary, { backgroundColor: colors.success }]}><Text style={styles.white}>Aceitar</Text></TouchableOpacity><TouchableOpacity onPress={() => setRejecting(row)} style={[styles.outline, { borderColor: colors.danger }]}><Text style={{ color: colors.danger, fontWeight: "800" }}>Recusar</Text></TouchableOpacity></>}
              {(row.status === "aceita" || row.status === "concluida") && <TouchableOpacity onPress={() => navigation.navigate("Mensagens", { requestId: row.id })} style={[styles.primary, { backgroundColor: colors.primary }]}><Ionicons name="chatbubble-ellipses-outline" color="#fff" size={17} /><Text style={styles.white}>Abrir conversa</Text></TouchableOpacity>}
              {owner && row.status === "concluida" && !row.certificateCode && <TouchableOpacity disabled={busy === row.id} onPress={() => void act(row.id, () => issueCertificate(row.id))} style={[styles.outline, { borderColor: colors.primary }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>Emitir certificado</Text></TouchableOpacity>}
              {!!row.certificateCode && <View style={styles.certificate}><Ionicons name="ribbon-outline" size={17} color={colors.success} /><Text style={{ color: colors.success, fontWeight: "700" }}>Certificado emitido</Text></View>}
            </View>
          </View>;
        })}
      </ScrollView>

      <Modal visible={Boolean(rejecting)} transparent animationType="fade" onRequestClose={() => setRejecting(null)}>
        <View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: colors.card }]}><Text style={[styles.modalTitle, { color: colors.text }]}>Motivo da recusa</Text><TextInput value={reason} onChangeText={setReason} multiline maxLength={1000} placeholder="Explique o motivo ao colaborador" placeholderTextColor={colors.muted} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.actions}><TouchableOpacity onPress={() => setRejecting(null)} style={[styles.outline, { borderColor: colors.border }]}><Text style={{ color: colors.muted, fontWeight: "800" }}>Cancelar</Text></TouchableOpacity><TouchableOpacity disabled={reason.trim().length < 3} onPress={() => void confirmRejection()} style={[styles.primary, { backgroundColor: colors.danger, opacity: reason.trim().length < 3 ? .5 : 1 }]}><Text style={styles.white}>Confirmar</Text></TouchableOpacity></View></View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({ page: { flex: 1 }, content: { padding: 20, paddingBottom: 44 }, eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 32, fontWeight: "900", marginTop: 4 }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5 }, filters: { gap: 8, paddingVertical: 18 }, filter: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 }, card: { borderWidth: 1, borderRadius: 22, padding: 17, marginBottom: 14 }, cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, cardTitle: { fontSize: 18, fontWeight: "900" }, person: { fontSize: 12, marginTop: 3 }, badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 }, category: { fontSize: 11, fontWeight: "900", marginTop: 14 }, description: { fontSize: 14, lineHeight: 21, marginTop: 7 }, meta: { fontSize: 12, marginTop: 9 }, rejection: { fontSize: 12, lineHeight: 18, marginTop: 8 }, notice: { fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 8 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 15 }, primary: { minHeight: 42, borderRadius: 13, paddingHorizontal: 14, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" }, outline: { minHeight: 42, borderRadius: 13, borderWidth: 1, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, white: { color: "#fff", fontWeight: "800" }, certificate: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 6 }, empty: { borderWidth: 1, borderRadius: 24, padding: 32, alignItems: "center" }, emptyTitle: { fontSize: 18, fontWeight: "900", marginTop: 10 }, emptyText: { fontSize: 13, marginTop: 5 }, error: { marginBottom: 14, fontSize: 13 }, modalBackdrop: { flex: 1, backgroundColor: "#0009", alignItems: "center", justifyContent: "center", padding: 22 }, modal: { width: "100%", borderRadius: 24, padding: 20 }, modalTitle: { fontSize: 20, fontWeight: "900" }, modalInput: { minHeight: 120, borderWidth: 1, borderRadius: 15, padding: 13, textAlignVertical: "top", marginTop: 14 } });
