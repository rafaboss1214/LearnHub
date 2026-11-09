import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeedback } from "../components/Feedback";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CommunityType, register } from "../services/auth";
import { ThemeContext } from "../theme/ThemeContext";

export default function RegisterModernScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const { showAlert, feedback } = useFeedback();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [type, setType] = useState<"colaborador" | "diretor">("colaborador");
  const [communityType, setCommunityType] = useState<CommunityType | "">("");
  const [institutionEvidence, setInstitutionEvidence] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cepStatus, setCepStatus] = useState("");
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim() || !password || !confirmation) return showAlert("Campos obrigatórios", "Preencha todos os campos.");
    if (password !== confirmation) return showAlert("Senhas diferentes", "A confirmação precisa ser igual à senha.");
    if (password.length < 10) return showAlert("Senha muito curta", "Use pelo menos 10 caracteres.");
    if (type === "colaborador" && !communityType) return showAlert("Identificação necessária", "Selecione como você participa da comunidade.");
    setSubmitting(true);
    try {
      await register({ nome: name.trim(), email: email.trim(), senha: password, tipo: type, communityType: communityType || undefined, institutionEvidence: institutionEvidence.trim(), cep, rua, bairro, cidade, estado, numero, complemento });
      showAlert("Conta criada", "Agora você já pode entrar no LearnHub.", [{ text: "Entrar", onPress: () => navigation.replace("Login") }]);
    } catch (caught) {
      showAlert("Não foi possível cadastrar", caught instanceof Error ? caught.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function lookupCep() {
    const digits = cep.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) return setCepStatus("Informe um CEP com 8 dígitos.");
    setLookingUpCep(true); setCepStatus("Consultando endereço…");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      if (!response.ok || data.erro) throw new Error();
      setRua(data.logradouro || ""); setBairro(data.bairro || ""); setCidade(data.localidade || ""); setEstado(data.uf || "");
      setCepStatus("Endereço encontrado. Confira e informe o número.");
    } catch { setCepStatus("Não foi possível consultar. Preencha o endereço manualmente."); }
    finally { setLookingUpCep(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={[styles.flex, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 24, 48), paddingBottom: Math.max(insets.bottom + 24, 48) }]} keyboardShouldPersistTaps="handled">
        {feedback}
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.card }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Crie sua conta</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Faça parte da rede que transforma boas ideias em impacto.</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field icon="person-outline" placeholder="Nome completo" value={name} onChangeText={setName} colors={colors} />
          <Field icon="mail-outline" placeholder="E-mail" value={email} onChangeText={setEmail} colors={colors} keyboardType="email-address" autoCapitalize="none" />
          <Field icon="lock-closed-outline" placeholder="Senha (mínimo de 10 caracteres)" value={password} onChangeText={setPassword} colors={colors} secureTextEntry={!showPassword} trailing={<TouchableOpacity onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} /></TouchableOpacity>} />
          <Field icon="shield-checkmark-outline" placeholder="Confirmar senha" value={confirmation} onChangeText={setConfirmation} colors={colors} secureTextEntry={!showPassword} />

          <Text style={[styles.label, { color: colors.text }]}>Como você vai usar o LearnHub?</Text>
          <View style={styles.types}>
            {(["colaborador", "diretor"] as const).map((item) => {
              const selected = type === item;
              return <TouchableOpacity key={item} onPress={() => setType(item)} style={[styles.type, { backgroundColor: selected ? colors.primarySoft : colors.background, borderColor: selected ? colors.primary : colors.border }]}><Ionicons name={item === "diretor" ? "school-outline" : "people-outline"} size={20} color={selected ? colors.primary : colors.muted} /><Text style={[styles.typeText, { color: selected ? colors.primary : colors.text }]}>{item === "diretor" ? "Diretor" : "Colaborador"}</Text></TouchableOpacity>;
            })}
          </View>

          {type === "colaborador" ? <><Text style={[styles.label, { color: colors.text }]}>Como você participa da comunidade?</Text><View style={styles.choiceList}>{([{ key: "aluno", label: "Aluno" }, { key: "responsavel", label: "Pai, mãe ou responsável" }, { key: "comunidade", label: "Outro membro da comunidade" }] as const).map((item) => { const selected = communityType === item.key; return <TouchableOpacity key={item.key} onPress={() => setCommunityType(item.key)} style={[styles.choice, { backgroundColor: selected ? colors.primarySoft : colors.background, borderColor: selected ? colors.primary : colors.border }]}><Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={18} color={selected ? colors.primary : colors.muted} /><Text style={{ color: selected ? colors.primary : colors.text, fontWeight: "700", fontSize: 12 }}>{item.label}</Text></TouchableOpacity>; })}</View></> : <><Text style={[styles.label, { color: colors.text }]}>Identificação institucional (opcional)</Text><TextInput value={institutionEvidence} onChangeText={setInstitutionEvidence} multiline maxLength={1000} placeholder="Código INEP ou CNPJ, site e contato oficial" placeholderTextColor={colors.muted} style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} /><Text style={[styles.hint, { color: colors.muted }]}>A escola pode publicar imediatamente. Esses dados servem para solicitar um selo opcional.</Text></>}

          <Text style={[styles.section, { color: colors.text }]}>Endereço</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>{type === "colaborador" ? "O endereço é privado e não aparece para outros usuários." : "Ajuda a comunidade a identificar a localização da escola."}</Text>
          <View style={styles.cepRow}><View style={{ flex: 1 }}><Field icon="location-outline" placeholder="CEP" value={cep} onChangeText={(value: string) => setCep(value.replace(/\D/g, "").slice(0, 8))} colors={colors} keyboardType="number-pad" /></View><TouchableOpacity disabled={lookingUpCep} onPress={() => void lookupCep()} style={[styles.cepButton, { backgroundColor: colors.primary }]}>{lookingUpCep ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={19} color="#fff" />}</TouchableOpacity></View>
          {!!cepStatus && <Text style={[styles.cepStatus, { color: colors.muted }]}>{cepStatus}</Text>}
          <Field icon="map-outline" placeholder="Rua" value={rua} onChangeText={setRua} colors={colors} />
          <Field icon="navigate-outline" placeholder="Bairro" value={bairro} onChangeText={setBairro} colors={colors} />
          <View style={styles.two}><View style={{ flex: 2 }}><Field icon="business-outline" placeholder="Cidade" value={cidade} onChangeText={setCidade} colors={colors} /></View><View style={{ flex: 1 }}><Field icon="flag-outline" placeholder="UF" value={estado} onChangeText={(value: string) => setEstado(value.toUpperCase().slice(0, 2))} colors={colors} autoCapitalize="characters" /></View></View>
          <View style={styles.two}><View style={{ flex: 1 }}><Field icon="home-outline" placeholder="Número" value={numero} onChangeText={setNumero} colors={colors} /></View><View style={{ flex: 2 }}><Field icon="ellipsis-horizontal" placeholder="Complemento" value={complemento} onChangeText={setComplemento} colors={colors} /></View></View>

          <TouchableOpacity disabled={submitting} onPress={() => void submit()} style={[styles.button, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Criar conta</Text>}</TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, colors, trailing, ...props }: any) {
  return <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}><Ionicons name={icon} size={20} color={colors.muted} /><TextInput placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text }]} {...props} />{trailing}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 24, paddingVertical: 48, width: "100%", maxWidth: 600, alignSelf: "center" },
  back: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 31, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 24 },
  card: { borderWidth: 1, borderRadius: 26, padding: 20 },
  inputBox: { minHeight: 55, borderWidth: 1, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, marginBottom: 14 },
  input: { flex: 1, minHeight: 54, paddingVertical: 14, fontSize: 14 },
  label: { fontSize: 13, fontWeight: "800", marginTop: 4, marginBottom: 10 },
  types: { flexDirection: "row", gap: 9, marginBottom: 22 },
  type: { flex: 1, minHeight: 56, borderWidth: 1, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  typeText: { fontSize: 12, fontWeight: "800" },
  button: { minHeight: 57, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  choiceList: { gap: 8, marginBottom: 18 },
  choice: { minHeight: 46, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13 },
  textArea: { minHeight: 100, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: "top", marginBottom: 7 },
  hint: { fontSize: 11, lineHeight: 16, marginBottom: 12 },
  section: { fontSize: 16, fontWeight: "900", marginTop: 6, marginBottom: 5 },
  cepRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  cepButton: { width: 54, height: 55, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cepStatus: { fontSize: 11, lineHeight: 16, marginTop: -8, marginBottom: 12 },
  two: { flexDirection: "row", gap: 8 },
});
