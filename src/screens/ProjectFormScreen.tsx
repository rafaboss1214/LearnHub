import { useFeedback } from "../components/Feedback";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createProject, getProject, ProjectStatus, updateProject } from "../services/projects";
import { SUPPORT_CATEGORIES } from "../services/community";
import { ThemeContext } from "../theme/ThemeContext";

const categories = [
  "Sustentabilidade",
  "Tecnologia e Ciência",
  "Arte e Cultura",
  "Saúde e Bem-Estar",
  "Inclusão e Cidadania",
];

export default function ProjectFormScreen({ navigation, route }: any) {
  const { colors } = useContext(ThemeContext);
  const { showAlert, feedback } = useFeedback();
  const projectId = route.params?.projectId ? Number(route.params.projectId) : null;
  const editing = Boolean(projectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageMime, setImageMime] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>("publicado");
  const [supportCategories, setSupportCategories] = useState<string[]>([...SUPPORT_CATEGORIES]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId)
      .then((project) => {
        setTitle(project.titulo);
        setDescription(project.descricao);
        setCategory(project.categoria);
        setImageUrl(project.imagemUrl);
        setImagePreview(project.imagemUrl);
        setStatus(project.status);
        setSupportCategories(project.supportCategories?.length ? project.supportCategories : [...SUPPORT_CATEGORIES]);
      })
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, [projectId, retry]);

  async function submit() {
    if (title.trim().length < 3 || description.trim().length < 10 || !category || !supportCategories.length) {
      showAlert("Revise os campos", "Informe título, categoria, descrição e ao menos uma categoria de apoio.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo: title.trim(),
        descricao: description.trim(),
        categoria: category,
        imagemUrl: imageUrl.trim(),
        status,
        supportCategories,
        imageBase64: imageBase64 || undefined,
        imageMime: imageMime || undefined,
        removeImage,
      };
      if (projectId) await updateProject(projectId, payload);
      else await createProject(payload);
      showAlert("Tudo certo", editing ? "Projeto atualizado com sucesso." : "Projeto publicado com sucesso.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (caught) {
      showAlert("Não foi possível salvar", caught instanceof Error ? caught.message : "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: .8, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if ((asset.fileSize || 0) > 3 * 1024 * 1024 || !asset.base64) {
      return showAlert("Imagem inválida", "Escolha uma imagem JPG, PNG ou WebP de até 3 MB.");
    }
    setImagePreview(asset.uri); setImageBase64(asset.base64); setImageMime(asset.mimeType || "image/jpeg"); setImageUrl(""); setRemoveImage(false);
  }

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (loadError) return <View style={[styles.center, { backgroundColor: colors.background, padding: 24 }]}><Text style={{ color: colors.danger, textAlign: "center", marginBottom: 20 }}>{loadError}</Text><TouchableOpacity style={[styles.submit, { backgroundColor: colors.primary, paddingHorizontal: 24 }]} onPress={() => { setLoading(true); setLoadError(""); setRetry(value => value + 1); }}><Text style={styles.submitText}>Tentar novamente</Text></TouchableOpacity></View>;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {feedback}
        <View style={[styles.intro, { backgroundColor: colors.primarySoft }]}>
          <View style={[styles.introIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name={editing ? "create-outline" : "sparkles-outline"} size={23} color="#FFFFFF" />
          </View>
          <View style={styles.introCopy}>
            <Text style={[styles.title, { color: colors.text }]}>{editing ? "Atualize sua ideia" : "Tire a ideia do papel"}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Os dados serão salvos no banco hospedado e ficarão disponíveis para toda a comunidade.</Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Título</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ex.: Laboratório maker comunitário"
          placeholderTextColor={colors.muted}
          maxLength={180}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        />

        <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Explique o objetivo, público e impacto esperado."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={5000}
          style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        />

        <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
        <View style={styles.options}>
          {categories.map((item) => {
            const selected = category === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.option, { backgroundColor: selected ? colors.primarySoft : colors.card, borderColor: selected ? colors.primary : colors.border }]}
              >
                <Text style={[styles.optionText, { color: selected ? colors.primary : colors.text }]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Imagem de capa (opcional)</Text>
        {!!imagePreview && !removeImage && <Image source={{ uri: imagePreview }} style={styles.coverPreview} />}
        <View style={styles.imageActions}><TouchableOpacity onPress={() => void pickCover()} style={[styles.imageButton, { borderColor: colors.primary }]}><Ionicons name="images-outline" size={18} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: "800" }}>Escolher imagem</Text></TouchableOpacity>{!!imagePreview && <TouchableOpacity onPress={() => { setImagePreview(""); setImageBase64(""); setImageMime(""); setImageUrl(""); setRemoveImage(true); }} style={styles.removeImage}><Text style={{ color: colors.danger, fontWeight: "700" }}>Remover</Text></TouchableOpacity>}</View>
        <Text style={[styles.or, { color: colors.muted }]}>ou use uma URL pública</Text>
        <TextInput
          value={imageUrl}
          onChangeText={(value) => { setImageUrl(value); if (value) { setImagePreview(value); setImageBase64(""); setImageMime(""); setRemoveImage(false); } }}
          placeholder="https://exemplo.com/imagem.jpg"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="url"
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        />
        <Text style={[styles.hint, { color: colors.muted }]}>Use uma URL pública para a imagem aparecer em todos os aparelhos.</Text>

        <Text style={[styles.label, { color: colors.text }]}>Apoios necessários</Text>
        <Text style={[styles.hintAbove, { color: colors.muted }]}>Escolha as categorias pelas quais colaboradores poderão oferecer ajuda.</Text>
        <View style={styles.options}>
          {SUPPORT_CATEGORIES.map((item) => {
            const selected = supportCategories.includes(item);
            return <TouchableOpacity key={item} onPress={() => setSupportCategories((current) => selected ? current.filter((value) => value !== item) : [...current, item])} style={[styles.option, { backgroundColor: selected ? colors.primarySoft : colors.card, borderColor: selected ? colors.primary : colors.border }]}><Ionicons name={selected ? "checkbox" : "square-outline"} size={17} color={selected ? colors.primary : colors.muted} /><Text style={[styles.optionText, { color: selected ? colors.primary : colors.text }]}>{item}</Text></TouchableOpacity>;
          })}
        </View>

        {editing && (
          <>
            <Text style={[styles.label, styles.statusLabel, { color: colors.text }]}>Status</Text>
            <View style={styles.statusRow}>
              {(["publicado", "concluido"] as ProjectStatus[]).map((item) => {
                const selected = status === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setStatus(item)}
                    style={[styles.statusOption, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                  >
                    <Ionicons name={item === "concluido" ? "checkmark-circle-outline" : "time-outline"} size={18} color={selected ? "#FFFFFF" : colors.muted} />
                    <Text style={[styles.statusOptionText, { color: selected ? "#FFFFFF" : colors.text }]}>{item === "concluido" ? "Concluído" : "Em andamento"}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity disabled={saving} onPress={() => void submit()} style={[styles.submit, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <>
            <Text style={styles.submitText}>{editing ? "Salvar alterações" : "Publicar projeto"}</Text>
            <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
          </>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 24, paddingBottom: 48, width: "100%", maxWidth: 900, alignSelf: "center" },
  intro: { borderRadius: 24, padding: 18, flexDirection: "row", alignItems: "flex-start", marginBottom: 26 },
  introIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  introCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 21, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  label: { fontSize: 14, fontWeight: "800", marginBottom: 9 },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, fontSize: 15, marginBottom: 20 },
  textArea: { minHeight: 142, paddingTop: 15, textAlignVertical: "top" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 22 },
  option: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  optionText: { fontSize: 12, fontWeight: "700" },
  hint: { fontSize: 12, lineHeight: 17, marginTop: -12, marginBottom: 20 },
  coverPreview: { width: "100%", aspectRatio: 16 / 9, borderRadius: 18, marginBottom: 10 },
  imageActions: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  imageButton: { minHeight: 44, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", gap: 7, alignItems: "center" },
  removeImage: { padding: 10 },
  or: { fontSize: 11, marginBottom: 7 },
  hintAbove: { fontSize: 12, lineHeight: 17, marginTop: -4, marginBottom: 10 },
  statusLabel: { marginTop: 4 },
  statusRow: { flexDirection: "row", gap: 10, marginBottom: 26 },
  statusOption: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 15, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center" },
  statusOptionText: { fontSize: 13, fontWeight: "700" },
  submit: { minHeight: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9, marginTop: 5, elevation: 3 },
  submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
