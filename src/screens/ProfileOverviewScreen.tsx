import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFeedback } from "../components/Feedback";
import { AuthUser, deleteAccount, getCurrentUser, requestInstitutionReview, updateProfile, UserAddress } from "../services/auth";
import { listProjects, Project } from "../services/projects";
import { ThemeContext } from "../theme/ThemeContext";

const emptyAddress: UserAddress = { cep: "", rua: "", bairro: "", cidade: "", estado: "", numero: "", complemento: "" };
const communityLabels = { aluno: "Aluno", responsavel: "Pai, mãe ou responsável", comunidade: "Outro membro da comunidade" };
const institutionLabels = { nao_verificada: "Não verificada", pendente: "Em análise", aprovada: "Verificada", recusada: "Verificação recusada" };

export default function ProfileOverviewScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const { showAlert, feedback } = useFeedback();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [address, setAddress] = useState<UserAddress>(emptyAddress);
  const [institutionEvidence, setInstitutionEvidence] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarBase64, setAvatarBase64] = useState("");
  const [avatarMime, setAvatarMime] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [cepStatus, setCepStatus] = useState("");

  const fill = useCallback((current: AuthUser | null) => {
    setUser(current); setName(current?.nome || ""); setEmail(current?.email || "");
    setDescription(current?.descricao || ""); setSkills(current?.habilidades || "");
    setAddress({ ...emptyAddress, ...(current?.endereco || {}) });
    setInstitutionEvidence(current?.institutionEvidence || "");
    setAvatarPreview(current?.avatarUrl || ""); setAvatarBase64(""); setAvatarMime(""); setRemoveAvatar(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [currentUser, items] = await Promise.all([getCurrentUser(), listProjects()]);
      fill(currentUser); setProjects(items); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar o perfil."); }
    finally { setLoading(false); }
  }, [fill]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function changeAddress(key: keyof UserAddress, value: string) {
    setAddress((current) => ({ ...current, [key]: key === "estado" ? value.toUpperCase().slice(0, 2) : value }));
  }

  async function lookupCep() {
    const digits = address.cep.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) return setCepStatus("Informe um CEP com 8 dígitos.");
    setCepStatus("Consultando endereço…");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`); const data = await response.json();
      if (!response.ok || data.erro) throw new Error();
      setAddress((current) => ({ ...current, cep: digits, rua: data.logradouro || current.rua, bairro: data.bairro || current.bairro, cidade: data.localidade || current.cidade, estado: data.uf || current.estado }));
      setCepStatus("Endereço encontrado. Confira os campos.");
    } catch { setCepStatus("Consulta indisponível. Preencha manualmente."); }
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: .8, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if ((asset.fileSize || 0) > 3 * 1024 * 1024 || !asset.base64) return showAlert("Imagem inválida", "Escolha uma imagem JPG, PNG ou WebP de até 3 MB.");
    setAvatarPreview(asset.uri); setAvatarBase64(asset.base64); setAvatarMime(asset.mimeType || "image/jpeg"); setRemoveAvatar(false);
  }

  async function saveProfile() {
    if (!name.trim() || !email.trim()) return showAlert("Campos obrigatórios", "Informe nome e e-mail.");
    setSaving(true);
    try {
      const updated = await updateProfile({ nome: name.trim(), email: email.trim(), descricao: description.trim(), habilidades: skills.trim(), endereco: address, avatarBase64: avatarBase64 || undefined, avatarMime: avatarMime || undefined, removeAvatar });
      fill(updated); setEditing(false); showAlert("Perfil atualizado", "Suas informações já estão disponíveis no LearnHub.");
    } catch (caught) { showAlert("Não foi possível atualizar", caught instanceof Error ? caught.message : "Tente novamente."); }
    finally { setSaving(false); }
  }

  async function submitInstitution() {
    if (institutionEvidence.trim().length < 10) return showAlert("Dados insuficientes", "Informe o vínculo, código INEP/CNPJ, site ou contato oficial.");
    setSaving(true);
    try { fill(await requestInstitutionReview(institutionEvidence.trim())); showAlert("Solicitação enviada", "O selo é opcional e não bloqueia a publicação de projetos."); }
    catch (caught) { showAlert("Não foi possível solicitar", caught instanceof Error ? caught.message : "Tente novamente."); }
    finally { setSaving(false); }
  }

  function confirmAccountDeletion() {
    showAlert("Excluir conta", "Sua conta será removida. Projetos publicados continuarão disponíveis. Deseja continuar?", [{ text: "Cancelar", style: "cancel" }, { text: "Excluir conta", style: "destructive", onPress: async () => { try { await deleteAccount(); navigation.getParent()?.reset({ index: 0, routes: [{ name: "Login" }] }); } catch (caught) { showAlert("Não foi possível excluir", caught instanceof Error ? caught.message : "Tente novamente."); } } }]);
  }

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  const ownProjects = projects.filter((item) => item.criador?.id === user?.id).length;
  const favorites = projects.filter((item) => item.favorito).length;
  const avatar = avatarPreview && !removeAvatar;

  return <ScrollView style={[styles.page, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    {feedback}
    <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
      <View style={styles.avatar}>{avatar ? <Image source={{ uri: avatarPreview }} style={styles.avatarImage} /> : <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.nome?.charAt(0).toUpperCase() || "L"}</Text>}</View>
      <Text style={styles.name}>{user?.nome || "Usuário LearnHub"}</Text><Text style={styles.role}>{user?.tipo === "admin" ? "Administrador" : user?.tipo === "diretor" ? "Diretor" : "Colaborador"}</Text>
    </View>
    <View style={styles.stats}><Stat value={ownProjects} label="Projetos criados" colors={colors} /><Stat value={favorites} label="Favoritos" colors={colors} /></View>

    {!editing ? <>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Sobre</Text>
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Info icon="mail-outline" label="E-mail" value={user?.email || ""} colors={colors} />
        <Info icon="location-outline" label="Localização" value={[user?.endereco?.cidade, user?.endereco?.estado].filter(Boolean).join(" · ") || "Ainda não informada"} colors={colors} />
        {user?.tipo === "colaborador" && <Info icon="people-outline" label="Participação" value={user.communityType ? communityLabels[user.communityType] : "Não informada"} colors={colors} />}
        <Info icon="sparkles-outline" label="Habilidades" value={user?.habilidades || "Ainda não informadas"} colors={colors} last />
      </View>
      {!!user?.descricao && <Text style={[styles.bio, { color: colors.muted }]}>{user.descricao}</Text>}
      <TouchableOpacity style={[styles.editProfile, { backgroundColor: colors.primarySoft }]} onPress={() => setEditing(true)}><Ionicons name="create-outline" size={19} color={colors.primary} /><Text style={[styles.buttonLabel, { color: colors.primary }]}>Editar perfil</Text></TouchableOpacity>
    </> : <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>Editar perfil</Text>
      <View style={styles.photoActions}><View style={[styles.smallAvatar, { backgroundColor: colors.primarySoft }]}>{avatar ? <Image source={{ uri: avatarPreview }} style={styles.avatarImage} /> : <Ionicons name="person" size={28} color={colors.primary} />}</View><View style={{ flex: 1, gap: 7 }}><TouchableOpacity onPress={() => void pickAvatar()} style={[styles.smallButton, { borderColor: colors.primary }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>Escolher foto</Text></TouchableOpacity><TouchableOpacity onPress={() => { setAvatarPreview(""); setAvatarBase64(""); setRemoveAvatar(true); }}><Text style={{ color: colors.danger, fontSize: 12, fontWeight: "700" }}>Remover foto</Text></TouchableOpacity></View></View>
      <Field label="Nome" value={name} onChangeText={setName} colors={colors} />
      <Field label="E-mail" value={email} onChangeText={setEmail} colors={colors} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Sobre você" value={description} onChangeText={setDescription} colors={colors} multiline maxLength={280} />
      <Field label="Habilidades e áreas de atuação" value={skills} onChangeText={setSkills} colors={colors} maxLength={200} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Endereço {user?.tipo === "colaborador" ? "privado" : "da escola"}</Text>
      <View style={styles.cepLine}><View style={{ flex: 1 }}><Field label="CEP" value={address.cep} onChangeText={(value: string) => changeAddress("cep", value.replace(/\D/g, "").slice(0, 8))} colors={colors} keyboardType="number-pad" /></View><TouchableOpacity onPress={() => void lookupCep()} style={[styles.lookup, { backgroundColor: colors.primary }]}><Ionicons name="search" size={19} color="#fff" /></TouchableOpacity></View>
      {!!cepStatus && <Text style={{ color: colors.muted, fontSize: 11, marginTop: -8, marginBottom: 10 }}>{cepStatus}</Text>}
      <Field label="Rua" value={address.rua} onChangeText={(v: string) => changeAddress("rua", v)} colors={colors} /><Field label="Bairro" value={address.bairro} onChangeText={(v: string) => changeAddress("bairro", v)} colors={colors} />
      <View style={styles.two}><View style={{ flex: 2 }}><Field label="Cidade" value={address.cidade} onChangeText={(v: string) => changeAddress("cidade", v)} colors={colors} /></View><View style={{ flex: 1 }}><Field label="UF" value={address.estado} onChangeText={(v: string) => changeAddress("estado", v)} colors={colors} /></View></View>
      <View style={styles.two}><View style={{ flex: 1 }}><Field label="Número" value={address.numero} onChangeText={(v: string) => changeAddress("numero", v)} colors={colors} /></View><View style={{ flex: 2 }}><Field label="Complemento" value={address.complemento} onChangeText={(v: string) => changeAddress("complemento", v)} colors={colors} /></View></View>
      <View style={styles.editActions}><TouchableOpacity disabled={saving} onPress={() => { fill(user); setEditing(false); }} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={{ color: colors.muted, fontWeight: "800" }}>Cancelar</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={() => void saveProfile()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.white}>Salvar</Text>}</TouchableOpacity></View>
    </View>}

    {user?.tipo === "diretor" && <View style={[styles.institution, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.institutionHeader}><Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} /><View><Text style={[styles.institutionTitle, { color: colors.text }]}>Selo institucional opcional</Text><Text style={{ color: colors.primary, fontSize: 11, fontWeight: "900" }}>{institutionLabels[user.institutionStatus || "nao_verificada"]}</Text></View></View><Text style={[styles.institutionText, { color: colors.muted }]}>A análise não bloqueia projetos ou colaborações.</Text>{!!user.institutionReason && <Text style={{ color: colors.muted }}>Parecer: {user.institutionReason}</Text>}<TextInput value={institutionEvidence} onChangeText={setInstitutionEvidence} multiline maxLength={1000} placeholder="INEP/CNPJ, site e contato oficial" placeholderTextColor={colors.muted} style={[styles.institutionInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} /><TouchableOpacity disabled={saving} onPress={() => void submitInstitution()} style={[styles.smallButton, { borderColor: colors.primary }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>Solicitar análise</Text></TouchableOpacity></View>}
    {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    <TouchableOpacity style={[styles.refresh, { borderColor: colors.primary }]} onPress={() => void load()}><Ionicons name="refresh-outline" size={19} color={colors.primary} /><Text style={[styles.buttonLabel, { color: colors.primary }]}>Atualizar dados</Text></TouchableOpacity>
    <TouchableOpacity style={styles.deleteAccount} onPress={confirmAccountDeletion}><Text style={{ color: colors.danger, fontWeight: "700", fontSize: 12 }}>Excluir minha conta</Text></TouchableOpacity>
  </ScrollView>;
}

function Stat({ value, label, colors }: any) { return <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.statNumber, { color: colors.text }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text></View>; }
function Info({ icon, label, value, colors, last = false }: any) { return <View style={[styles.infoRow, { borderBottomColor: colors.border, borderBottomWidth: last ? 0 : 1 }]}><Ionicons name={icon} size={21} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text></View></View>; }
function Field({ label, colors, multiline, ...props }: any) { return <><Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text><TextInput placeholderTextColor={colors.muted} multiline={multiline} style={[styles.input, multiline && styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} {...props} /></>; }

const styles = StyleSheet.create({ page: { flex: 1 }, content: { padding: 24, paddingBottom: 48, width: "100%", maxWidth: 900, alignSelf: "center" }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, profileCard: { borderRadius: 28, alignItems: "center", padding: 28 }, avatar: { width: 88, height: 88, borderRadius: 27, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: "100%", height: "100%" }, avatarText: { fontSize: 34, fontWeight: "900" }, name: { color: "#fff", fontSize: 23, fontWeight: "900", marginTop: 14 }, role: { color: "#FFFFFFBB", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginTop: 5 }, stats: { flexDirection: "row", gap: 12, marginTop: 18 }, stat: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 18, alignItems: "center" }, statNumber: { fontSize: 26, fontWeight: "900" }, statLabel: { fontSize: 12, fontWeight: "600", marginTop: 3 }, sectionTitle: { fontSize: 17, fontWeight: "900", marginTop: 28, marginBottom: 12 }, infoCard: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 18 }, infoRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 12 }, infoLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6 }, infoValue: { fontSize: 14, fontWeight: "700", marginTop: 2 }, bio: { fontSize: 13, lineHeight: 20, marginTop: 12 }, editProfile: { alignSelf: "center", borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 18, paddingVertical: 12, marginTop: 20 }, buttonLabel: { fontSize: 13, fontWeight: "800" }, editCard: { borderWidth: 1, borderRadius: 22, padding: 18, marginTop: 18 }, photoActions: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 18 }, smallAvatar: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" }, smallButton: { minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14, marginBottom: 14 }, textArea: { minHeight: 95, paddingTop: 12, textAlignVertical: "top" }, two: { flexDirection: "row", gap: 9 }, cepLine: { flexDirection: "row", alignItems: "flex-start", gap: 8 }, lookup: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 17 }, editActions: { flexDirection: "row", gap: 10, marginTop: 5 }, secondaryButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" }, primaryButton: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" }, white: { color: "#fff", fontWeight: "800" }, institution: { borderWidth: 1, borderRadius: 22, padding: 18, marginTop: 24 }, institutionHeader: { flexDirection: "row", alignItems: "center", gap: 10 }, institutionTitle: { fontSize: 16, fontWeight: "900" }, institutionText: { fontSize: 12, lineHeight: 18, marginVertical: 10 }, institutionInput: { minHeight: 90, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: "top", marginBottom: 10 }, refresh: { alignSelf: "center", borderWidth: 1, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 11, marginTop: 24 }, deleteAccount: { alignSelf: "center", padding: 13, marginTop: 7 }, error: { fontSize: 13, textAlign: "center", marginTop: 16 } });
