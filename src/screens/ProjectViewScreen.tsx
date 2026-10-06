import { useFeedback } from "../components/Feedback";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthUser, getCurrentUser } from "../services/auth";
import {
  addComment,
  deleteComment,
  deleteProject,
  getProject,
  Project,
  toggleFavorite,
  toggleSupport,
  updateProject,
} from "../services/projects";
import { ThemeContext } from "../theme/ThemeContext";

export default function ProjectViewScreen({ navigation, route }: any) {
  const { colors } = useContext(ThemeContext);
  const { showAlert, feedback } = useFeedback();
  const projectId = Number(route.params?.projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [item, currentUser] = await Promise.all([getProject(projectId), getCurrentUser()]);
      setProject(item);
      setUser(currentUser);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível abrir o projeto.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    try {
      await action();
      await load();
    } catch (caught) {
      showAlert("Não foi possível concluir", caught instanceof Error ? caught.message : "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function sendComment() {
    const text = comment.trim();
    if (!text) return;
    await run(async () => {
      await addComment(projectId, text);
      setComment("");
    });
  }

  function confirmDelete() {
    showAlert("Excluir projeto", "Essa ação remove o projeto, comentários, favoritos e apoios. Deseja continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => { void (async () => {
          setSaving(true);
          try { await deleteProject(projectId); navigation.goBack(); }
          catch (caught) { showAlert("Falha ao excluir", caught instanceof Error ? caught.message : "Tente novamente."); }
          finally { setSaving(false); }
        })(); },
      },
    ]);
  }

  function confirmCommentDelete(commentId: number) {
    showAlert("Excluir comentário", "Deseja remover este comentário?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => void run(() => deleteComment(commentId)) },
    ]);
  }

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!project || error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24 }]}>
        <Ionicons name="cloud-offline-outline" size={42} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{error || "Projeto não encontrado."}</Text>
        <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={[styles.retry, { backgroundColor: colors.primary }]}>
          <Text style={styles.whiteText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const director = user?.tipo === "diretor" || user?.tipo === "admin";
  const canManage = user?.tipo === "admin" || (user?.tipo === "diretor" && Number(project.criador?.id) === Number(user.id));

  return (
    <ScrollView style={[styles.page, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {feedback}
      {project.imagemUrl ? (
        <Image source={{ uri: project.imagemUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="bulb-outline" size={54} color={colors.primary} />
        </View>
      )}

      <View style={styles.categoryRow}>
        <Text style={[styles.category, { color: colors.primary }]}>{project.categoria}</Text>
        <View style={[styles.status, { backgroundColor: project.status === "concluido" ? colors.success + "20" : colors.primarySoft }]}>
          <Text style={[styles.statusText, { color: project.status === "concluido" ? colors.success : colors.primary }]}>
            {project.status === "concluido" ? "Concluído" : "Em andamento"}
          </Text>
        </View>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{project.titulo}</Text>
      <View style={styles.authorRow}>
        <Ionicons name="person-circle-outline" size={21} color={colors.muted} />
        <Text style={[styles.author, { color: colors.muted }]}>{project.criador?.nome || "Equipe LearnHub"}</Text>
        <Text style={[styles.dot, { color: colors.muted }]}>•</Text>
        <Text style={[styles.author, { color: colors.muted }]}>{new Date(project.createdAt).toLocaleDateString("pt-BR")}</Text>
      </View>

      <View style={[styles.actionBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity disabled={saving} onPress={() => void run(() => toggleFavorite(project.id))} style={styles.actionItem}>
          <Ionicons name={project.favorito ? "heart" : "heart-outline"} size={23} color={project.favorito ? colors.danger : colors.muted} />
          <Text style={[styles.actionText, { color: colors.text }]}>{project.totalFavoritos} favoritos</Text>
        </TouchableOpacity>
        {!director && (
          <TouchableOpacity disabled={saving} onPress={() => void run(() => toggleSupport(project.id))} style={styles.actionItem}>
            <Ionicons name={project.apoiado ? "hand-left" : "hand-left-outline"} size={23} color={project.apoiado ? colors.success : colors.muted} />
            <Text style={[styles.actionText, { color: colors.text }]}>{project.totalApoios} apoios</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Sobre o projeto</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{project.descricao}</Text>

      {canManage && (
        <View style={styles.manageRow}>
          <TouchableOpacity onPress={() => navigation.navigate("FormularioProjeto", { projectId: project.id })} style={[styles.manageButton, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="create-outline" size={19} color={colors.primary} />
            <Text style={[styles.manageText, { color: colors.primary }]}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={saving}
            onPress={() => void run(() => updateProject(project.id, { status: project.status === "concluido" ? "publicado" : "concluido" }))}
            style={[styles.manageButton, { backgroundColor: colors.success + "18" }]}
          >
            <Ionicons name="checkmark-circle-outline" size={19} color={colors.success} />
            <Text style={[styles.manageText, { color: colors.success }]}>{project.status === "concluido" ? "Reabrir" : "Concluir"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={[styles.deleteButton, { borderColor: colors.danger }]}>
            <Ionicons name="trash-outline" size={19} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.commentsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Comentários</Text>
        {!project.comentarios?.length && <Text style={[styles.noComments, { color: colors.muted }]}>Seja a primeira pessoa a comentar.</Text>}
        {project.comentarios?.map((item) => {
          const canDelete = director || item.usuario?.id === user?.id;
          return (
            <View key={item.id} style={[styles.comment, { borderBottomColor: colors.border }]}>
              <View style={styles.commentHeading}>
                <Text style={[styles.commentAuthor, { color: colors.text }]}>{item.usuario?.nome || "Usuário removido"}</Text>
                {canDelete && (
                  <TouchableOpacity onPress={() => confirmCommentDelete(item.id)}><Ionicons name="close-circle-outline" size={19} color={colors.muted} /></TouchableOpacity>
                )}
              </View>
              <Text style={[styles.commentText, { color: colors.muted }]}>{item.texto}</Text>
            </View>
          );
        })}

        <View style={[styles.commentInputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Escreva um comentário"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            style={[styles.commentInput, { color: colors.text }]}
          />
          <TouchableOpacity disabled={saving || !comment.trim()} onPress={() => void sendComment()} style={[styles.sendButton, { backgroundColor: colors.primary, opacity: comment.trim() ? 1 : 0.45 }]}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 24, paddingBottom: 48, width: "100%", maxWidth: 900, alignSelf: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  cover: { width: "100%", height: 220, borderRadius: 25 },
  coverPlaceholder: { width: "100%", height: 150, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginTop: 22 },
  category: { flex: 1, fontSize: 12, fontWeight: "800", letterSpacing: 0.7 },
  status: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "800" },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "900", letterSpacing: -0.5, marginTop: 12 },
  authorRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 12 },
  author: { fontSize: 12, fontWeight: "600" },
  dot: { fontSize: 12 },
  actionBar: { flexWrap: "wrap", borderWidth: 1, borderRadius: 19, padding: 13, marginTop: 22, flexDirection: "row", gap: 18 },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 3 },
  actionText: { fontSize: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 19, fontWeight: "800", marginTop: 28, marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 24 },
  manageRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 24 },
  manageButton: { flex: 1, minHeight: 48, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  manageText: { fontSize: 13, fontWeight: "800" },
  deleteButton: { width: 48, height: 48, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  commentsCard: { borderWidth: 1, borderRadius: 24, padding: 18, marginTop: 28 },
  comment: { paddingVertical: 14, borderBottomWidth: 1 },
  commentHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  commentAuthor: { fontSize: 13, fontWeight: "800" },
  commentText: { fontSize: 14, lineHeight: 21, marginTop: 5 },
  noComments: { fontSize: 13, marginBottom: 14 },
  commentInputRow: { minHeight: 54, borderWidth: 1, borderRadius: 17, flexDirection: "row", alignItems: "center", marginTop: 18, paddingLeft: 14, paddingRight: 6 },
  commentInput: { flex: 1, maxHeight: 100, fontSize: 14, paddingVertical: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  errorTitle: { fontSize: 17, fontWeight: "800", textAlign: "center", marginTop: 12 },
  retry: { borderRadius: 15, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 },
  whiteText: { color: "#FFFFFF", fontWeight: "800" },
});
