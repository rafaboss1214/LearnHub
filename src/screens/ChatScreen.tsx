import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, type ScrollViewInstance } from "react-native";
import { AuthUser, getCurrentUser } from "../services/auth";
import { ChatMessage, Conversation, listConversations, listMessages, markMessagesRead, sendMessage, updateClosure } from "../services/community";
import { DEFAULT_PREFERENCES, getUserPreferences, UserPreferences } from "../services/preferences";
import { ThemeContext } from "../theme/ThemeContext";

export default function ChatScreen({ route }: any) {
  const { colors } = useContext(ThemeContext);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<ScrollViewInstance>(null);
  const selectedRequestId = selected?.request.id;
  const routeRequestId = Number(route.params?.requestId || 0);

  const loadConversations = useCallback(async () => {
    try {
      const [current, rows, savedPreferences] = await Promise.all([getCurrentUser(), listConversations(), getUserPreferences()]);
      setUser(current); setConversations(rows); setPreferences(savedPreferences); setError("");
      const targetId = routeRequestId || selectedRequestId || 0;
      const target = rows.find((item) => item.request.id === targetId);
      if (target) setSelected(target);
      else if (selectedRequestId) setSelected(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar as conversas."); }
    finally { setLoading(false); }
  }, [routeRequestId, selectedRequestId]);

  useFocusEffect(useCallback(() => { void loadConversations(); }, [loadConversations]));

  const loadMessages = useCallback(async (requestId: number, scroll = true) => {
    try {
      const rows = await listMessages(requestId);
      setMessages(rows);
      await markMessagesRead(requestId);
      setConversations((current) => current.map((item) => item.request.id === requestId ? { ...item, unread: 0 } : item));
      if (scroll) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível abrir a conversa."); }
  }, []);

  useFocusEffect(useCallback(() => {
    if (selectedRequestId) void loadMessages(selectedRequestId);
  }, [loadMessages, selectedRequestId]));

  useEffect(() => {
    if (!selectedRequestId) return;
    const timer = setInterval(() => void loadMessages(selectedRequestId, false), 4000);
    return () => clearInterval(timer);
  }, [loadMessages, selectedRequestId]);

  const categories = useMemo(() => ["Todas", ...Array.from(new Set(conversations.map((item) => item.request.category)))], [conversations]);
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return conversations.filter((item) => (category === "Todas" || item.request.category === category) && (!term || [item.other.name, item.request.project.title, item.request.category].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))));
  }, [category, conversations, query]);
  const grouped = useMemo(() => {
    const groups = new Map<string, Conversation[]>();
    visible.forEach((item) => {
      const key = user?.tipo === "diretor" ? item.request.category : "Conversas";
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    return Array.from(groups.entries());
  }, [user?.tipo, visible]);

  async function submit() {
    const text = draft.trim();
    if (!selected || !text) return;
    setBusy(true);
    try {
      await sendMessage(selected.request.id, text);
      setDraft("");
      if (preferences.hapticFeedback) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadMessages(selected.request.id);
    } catch (caught) { Alert.alert("Mensagem não enviada", caught instanceof Error ? caught.message : "Tente novamente."); }
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

  if (!selected) return <View style={[styles.page, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={[styles.eyebrow, { color: colors.primary }]}>MENSAGENS</Text><Text style={[styles.title, { color: colors.text }]}>Conversas</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Converse com seus parceiros depois que a colaboração for aceita.</Text>
    <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="search-outline" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar pessoa, projeto ou categoria" placeholderTextColor={colors.muted} style={{ flex: 1, minHeight: 46, color: colors.text }} /></View>
    {user?.tipo === "diretor" && categories.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{categories.map((item) => { const active = category === item; return <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.filter, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}><Text style={{ color: active ? "#fff" : colors.text, fontWeight: "800", fontSize: 12 }}>{item}</Text></TouchableOpacity>; })}</ScrollView>}
    {!!error && <Text style={{ color: colors.danger, marginTop: 16 }}>{error}</Text>}
    {!conversations.length && <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="chatbubbles-outline" size={42} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma conversa ainda</Text><Text style={[styles.emptyText, { color: colors.muted }]}>As conversas aparecerão após uma solicitação ser aceita.</Text></View>}
    {conversations.length > 0 && !visible.length && <Text style={[styles.noResult, { color: colors.muted }]}>Nenhuma conversa encontrada.</Text>}
    {grouped.map(([group, items]) => <View key={group}><Text style={[styles.groupTitle, { color: colors.muted }]}>{user?.tipo === "diretor" ? group.toUpperCase() : "CONVERSAS"}</Text>{items.map((item) => <TouchableOpacity key={item.request.id} onPress={() => setSelected(item)} style={[styles.conversation, { backgroundColor: colors.card, borderColor: colors.border }]}><Avatar uri={item.avatarUrl} name={item.other.name} size={54} colors={colors} /><View style={{ flex: 1 }}><View style={styles.row}><Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{item.other.name}</Text>{item.unread > 0 && <View style={[styles.unread, { backgroundColor: colors.primary }]}><Text style={styles.unreadText}>{item.unread}</Text></View>}</View><Text numberOfLines={1} style={[styles.project, { color: colors.primary }]}>{item.request.project.title}</Text>{preferences.showMessagePreviews && <Text numberOfLines={1} style={[styles.preview, { color: colors.muted }]}>{item.lastMessage || "Comece a conversa"}</Text>}</View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></TouchableOpacity>)}</View>)}
  </ScrollView></View>;

  const request = selected.request;
  const currentId = Number(user?.id);
  const ownClosureConfirmation = currentId === Number(request.school.id) ? request.closure?.schoolConfirmed : request.closure?.supporterConfirmed;
  const canSend = request.status === "aceita" && !request.closure;

  const conversationColors = { background: "#100D1A", header: "#191425", card: "#272033", border: "#3B304D", text: "#F8F5FF", muted: "#B7AEC6", accent: "#B7ABFF" };

  return <View style={[styles.page, { backgroundColor: conversationColors.background }]}>
    <View style={[styles.header, { backgroundColor: conversationColors.header, borderBottomColor: conversationColors.border }]}><TouchableOpacity onPress={() => setSelected(null)} style={styles.back}><Ionicons name="arrow-back" size={23} color={conversationColors.text} /></TouchableOpacity><Avatar uri={selected.avatarUrl} name={selected.other.name} size={44} colors={{ ...colors, primarySoft: "#30264A", primary: conversationColors.accent }} /><View style={{ flex: 1 }}><Text style={[styles.name, { color: conversationColors.text }]}>{selected.other.name}</Text><Text numberOfLines={1} style={[styles.project, { color: conversationColors.accent }]}>{request.project.title} · {request.category}</Text></View></View>
    {request.closure && request.status === "aceita" && <View style={[styles.closure, { backgroundColor: "#241B3F" }]}><Text style={[styles.closureTitle, { color: conversationColors.text }]}>Encerramento solicitado</Text><Text style={[styles.closureText, { color: conversationColors.muted }]}>Confirme se a colaboração foi realizada. A confirmação dos dois participantes concede 20 XP.</Text><View style={styles.actions}>{!ownClosureConfirmation && <TouchableOpacity disabled={busy} onPress={() => void closure("confirm")} style={[styles.action, { backgroundColor: colors.success }]}><Text style={styles.white}>Confirmar conclusão</Text></TouchableOpacity>}<TouchableOpacity disabled={busy} onPress={() => void closure("decline")} style={[styles.outline, { borderColor: colors.danger }]}><Text style={{ color: colors.danger, fontWeight: "800" }}>Continuar colaboração</Text></TouchableOpacity></View></View>}
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messages} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>{!messages.length && <Text style={[styles.emptyChat, { color: conversationColors.muted }]}>Envie a primeira mensagem desta colaboração.</Text>}{messages.map((message) => { const mine = Number(message.sender.id) === currentId; return <View key={message.id} style={[styles.messageLine, mine && styles.messageLineMine]}>{!mine && <Avatar uri={message.sender.avatarUrl} name={message.sender.name} size={32} colors={{ ...colors, primarySoft: "#30264A", primary: conversationColors.accent }} />}<View style={[styles.bubble, mine ? styles.mine : styles.theirs, { backgroundColor: mine ? "#6C55D9" : conversationColors.card, borderColor: mine ? "#806DE4" : conversationColors.border }]}><Text style={{ color: conversationColors.text, lineHeight: 20 }}>{message.text}</Text>{mine && preferences.showReadReceipts && <View style={styles.receipt}><Ionicons name="checkmark-done" size={17} color={message.read ? "#70D8FF" : "#C5BEE0"} /><Text style={{ color: message.read ? "#70D8FF" : "#C5BEE0", fontSize: 9, fontWeight: "800" }}>{message.read ? "Lida" : "Enviada"}</Text></View>}</View>{mine && <Avatar uri={message.sender.avatarUrl || user?.avatarUrl} name={message.sender.name} size={32} colors={{ ...colors, primarySoft: "#30264A", primary: conversationColors.accent }} />}</View>; })}</ScrollView>
    {request.status === "aceita" && !request.closure && <TouchableOpacity disabled={busy} onPress={() => void closure("request")} style={styles.closeLink}><Text style={{ color: conversationColors.muted, fontWeight: "700" }}>Solicitar encerramento por acordo</Text></TouchableOpacity>}
    <View style={[styles.composer, { backgroundColor: conversationColors.header, borderTopColor: conversationColors.border }]}><TextInput editable={canSend && !busy} value={draft} onChangeText={setDraft} placeholder={canSend ? "Mensagem" : "Conversa encerrada ou pausada"} placeholderTextColor={conversationColors.muted} multiline maxLength={2000} style={[styles.input, { backgroundColor: conversationColors.card, borderColor: conversationColors.border, color: conversationColors.text }]} /><TouchableOpacity disabled={!canSend || !draft.trim() || busy} onPress={() => void submit()} style={[styles.send, { backgroundColor: "#6C55D9", opacity: canSend && draft.trim() ? 1 : .4 }]}><Ionicons name="send" size={19} color="#fff" /></TouchableOpacity></View>
  </View>;
}

function Avatar({ uri, name, size, colors }: any) {
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }]}>{uri ? <Image source={{ uri }} style={styles.avatarImage} /> : <Text style={[styles.avatarText, { color: colors.primary, fontSize: size * .36 }]}>{String(name || "L").charAt(0).toUpperCase()}</Text>}</View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, content: { padding: 20, paddingBottom: 44 }, eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 32, fontWeight: "900", marginTop: 4 }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  search: { borderWidth: 1, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, marginTop: 18 }, filters: { gap: 8, paddingVertical: 14 }, filter: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  empty: { borderWidth: 1, borderRadius: 24, padding: 34, alignItems: "center", marginTop: 24 }, emptyTitle: { fontSize: 18, fontWeight: "900", marginTop: 10 }, emptyText: { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 6 }, noResult: { textAlign: "center", marginTop: 30 }, groupTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginTop: 18, marginBottom: 2 },
  conversation: { borderWidth: 1, borderRadius: 22, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }, avatar: { alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: "100%", height: "100%" }, avatarText: { fontWeight: "900" }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, name: { flexShrink: 1, fontSize: 15, fontWeight: "900" }, project: { fontSize: 11, fontWeight: "800", marginTop: 3 }, preview: { fontSize: 12, marginTop: 5 }, unread: { minWidth: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }, unreadText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  header: { minHeight: 76, borderBottomWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 11 }, back: { width: 34, height: 44, alignItems: "center", justifyContent: "center" }, messages: { padding: 14, paddingBottom: 22 }, messageLine: { flexDirection: "row", alignItems: "flex-end", gap: 7, marginBottom: 10 }, messageLineMine: { justifyContent: "flex-end" }, bubble: { maxWidth: "77%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 }, mine: { borderBottomRightRadius: 5 }, theirs: { borderBottomLeftRadius: 5 }, receipt: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 3, marginTop: 5 }, emptyChat: { textAlign: "center", marginTop: 28 },
  composer: { borderTopWidth: 1, padding: 10, flexDirection: "row", alignItems: "flex-end", gap: 8 }, input: { flex: 1, minHeight: 48, maxHeight: 110, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12 }, send: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }, closeLink: { alignItems: "center", padding: 9 }, closure: { padding: 14 }, closureTitle: { fontSize: 14, fontWeight: "900" }, closureText: { fontSize: 12, lineHeight: 18, marginTop: 4 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }, action: { minHeight: 40, borderRadius: 12, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, outline: { minHeight: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, white: { color: "#fff", fontWeight: "800" },
});
