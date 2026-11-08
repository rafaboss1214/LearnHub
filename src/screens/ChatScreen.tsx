import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthUser, getCurrentUser } from "../services/auth";
import { ChatMessage, Conversation, listConversations, listMessages, markMessagesRead, sendMessage, updateClosure } from "../services/community";
import { ThemeContext } from "../theme/ThemeContext";

export default function ChatScreen({ route }: any) {
  const { colors } = useContext(ThemeContext);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const selectedRequestId = selected?.request.id;
  const routeRequestId = Number(route.params?.requestId || 0);

  const loadConversations = useCallback(async () => {
    try {
      const [current, rows] = await Promise.all([getCurrentUser(), listConversations()]);
      setUser(current); setConversations(rows); setError("");
      const targetId = routeRequestId || selectedRequestId || 0;
      const target = rows.find((item) => item.request.id === targetId);
      if (target) setSelected(target);
      else if (selectedRequestId) setSelected(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar as conversas."); }
    finally { setLoading(false); }
  }, [routeRequestId, selectedRequestId]);

  useFocusEffect(useCallback(() => { void loadConversations(); }, [loadConversations]));

  const loadMessages = useCallback(async (requestId: number) => {
    try {
      const rows = await listMessages(requestId);
      setMessages(rows);
      await markMessagesRead(requestId);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível abrir a conversa."); }
  }, []);
  useFocusEffect(useCallback(() => {
    if (selectedRequestId) void loadMessages(selectedRequestId);
  }, [loadMessages, selectedRequestId]));

  async function submit() {
    const text = draft.trim();
    if (!selected || !text) return;
    setBusy(true);
    try { await sendMessage(selected.request.id, text); setDraft(""); await loadMessages(selected.request.id); }
    catch (caught) { Alert.alert("Mensagem não enviada", caught instanceof Error ? caught.message : "Tente novamente."); }
    finally { setBusy(false); }
  }

  async function closure(action: "request" | "confirm" | "decline") {
    if (!selected) return;
    setBusy(true);
    try { await updateClosure(selected.request.id, action); await loadConversations(); await loadMessages(selected.request.id); }
    catch (caught) { Alert.alert("Não foi possível atualizar", caught instanceof Error ? caught.message : "Tente novamente."); }
    finally { setBusy(false); }
  }

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (!selected) return <View style={[styles.page, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content}><Text style={[styles.eyebrow, { color: colors.primary }]}>MENSAGENS</Text><Text style={[styles.title, { color: colors.text }]}>Conversas</Text><Text style={[styles.subtitle, { color: colors.muted }]}>O chat é liberado quando uma solicitação é aceita.</Text>{!!error && <Text style={{ color: colors.danger, marginTop: 16 }}>{error}</Text>}{!conversations.length && <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="chatbubbles-outline" size={42} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma conversa ainda</Text></View>}{conversations.map((item) => <TouchableOpacity key={item.request.id} onPress={() => setSelected(item)} style={[styles.conversation, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{item.other.name.charAt(0).toUpperCase()}</Text></View><View style={{ flex: 1 }}><View style={styles.row}><Text style={[styles.name, { color: colors.text }]}>{item.other.name}</Text>{item.unread > 0 && <View style={[styles.unread, { backgroundColor: colors.primary }]}><Text style={styles.unreadText}>{item.unread}</Text></View>}</View><Text style={[styles.project, { color: colors.primary }]}>{item.request.project.title} · {item.request.category}</Text><Text numberOfLines={1} style={[styles.preview, { color: colors.muted }]}>{item.lastMessage || "Comece a conversa"}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></TouchableOpacity>)}</ScrollView></View>;

  const request = selected.request;
  const currentId = Number(user?.id);
  const ownClosureConfirmation = currentId === Number(request.school.id) ? request.closure?.schoolConfirmed : request.closure?.supporterConfirmed;
  const canSend = request.status === "aceita" && !request.closure;

  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}><TouchableOpacity onPress={() => setSelected(null)}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity><View style={{ flex: 1 }}><Text style={[styles.name, { color: colors.text }]}>{selected.other.name}</Text><Text style={[styles.project, { color: colors.primary }]}>{request.project.title} · {request.category}</Text></View></View>
    {request.closure && request.status === "aceita" && <View style={[styles.closure, { backgroundColor: colors.primarySoft }]}><Text style={[styles.closureTitle, { color: colors.text }]}>Encerramento solicitado</Text><Text style={[styles.closureText, { color: colors.muted }]}>Confirme se a colaboração foi realizada. A confirmação dos dois participantes concede 20 XP.</Text><View style={styles.actions}>{!ownClosureConfirmation && <TouchableOpacity disabled={busy} onPress={() => void closure("confirm")} style={[styles.action, { backgroundColor: colors.success }]}><Text style={styles.white}>Confirmar conclusão</Text></TouchableOpacity>}<TouchableOpacity disabled={busy} onPress={() => void closure("decline")} style={[styles.outline, { borderColor: colors.danger }]}><Text style={{ color: colors.danger, fontWeight: "800" }}>Continuar colaboração</Text></TouchableOpacity></View></View>}
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messages} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>{!messages.length && <Text style={[styles.emptyChat, { color: colors.muted }]}>Envie a primeira mensagem desta colaboração.</Text>}{messages.map((message) => { const mine = Number(message.sender.id) === currentId; return <View key={message.id} style={[styles.bubble, mine ? styles.mine : styles.theirs, { backgroundColor: mine ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={{ color: mine ? "#fff" : colors.text, lineHeight: 20 }}>{message.text}</Text><Text style={{ color: mine ? "#ffffffaa" : colors.muted, fontSize: 10, marginTop: 5 }}>{new Date(message.createdAt).toLocaleString("pt-BR")}</Text></View>; })}</ScrollView>
    {request.status === "aceita" && !request.closure && <TouchableOpacity disabled={busy} onPress={() => void closure("request")} style={styles.closeLink}><Text style={{ color: colors.muted, fontWeight: "700" }}>Solicitar encerramento por acordo</Text></TouchableOpacity>}
    <View style={[styles.composer, { backgroundColor: colors.card, borderTopColor: colors.border }]}><TextInput editable={canSend && !busy} value={draft} onChangeText={setDraft} placeholder={canSend ? "Escreva uma mensagem" : "Conversa encerrada ou pausada"} placeholderTextColor={colors.muted} multiline maxLength={2000} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} /><TouchableOpacity disabled={!canSend || !draft.trim() || busy} onPress={() => void submit()} style={[styles.send, { backgroundColor: colors.primary, opacity: canSend && draft.trim() ? 1 : .4 }]}><Ionicons name="send" size={19} color="#fff" /></TouchableOpacity></View>
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, content: { padding: 20, paddingBottom: 44 }, eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 32, fontWeight: "900", marginTop: 4 }, subtitle: { fontSize: 14, marginTop: 5 }, empty: { borderWidth: 1, borderRadius: 24, padding: 34, alignItems: "center", marginTop: 24 }, emptyTitle: { fontSize: 18, fontWeight: "900", marginTop: 10 }, conversation: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 }, avatar: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#fff", fontSize: 18, fontWeight: "900" }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, name: { fontSize: 15, fontWeight: "900" }, project: { fontSize: 11, fontWeight: "800", marginTop: 3 }, preview: { fontSize: 12, marginTop: 4 }, unread: { minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" }, unreadText: { color: "#fff", fontSize: 10, fontWeight: "900" }, header: { minHeight: 70, borderBottomWidth: 1, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 13 }, messages: { padding: 16, paddingBottom: 22 }, bubble: { maxWidth: "84%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 9, borderWidth: 1 }, mine: { alignSelf: "flex-end", borderBottomRightRadius: 5 }, theirs: { alignSelf: "flex-start", borderBottomLeftRadius: 5 }, emptyChat: { textAlign: "center", marginTop: 28 }, composer: { borderTopWidth: 1, padding: 10, flexDirection: "row", alignItems: "flex-end", gap: 8 }, input: { flex: 1, minHeight: 46, maxHeight: 110, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 11 }, send: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" }, closeLink: { alignItems: "center", padding: 9 }, closure: { padding: 14 }, closureTitle: { fontSize: 14, fontWeight: "900" }, closureText: { fontSize: 12, lineHeight: 18, marginTop: 4 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }, action: { minHeight: 40, borderRadius: 12, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, outline: { minHeight: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, white: { color: "#fff", fontWeight: "800" } });
