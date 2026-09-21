import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { register } from "../services/auth";
import { ThemeContext } from "../theme/ThemeContext";

export default function RegisterModernScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [type, setType] = useState<"colaborador" | "diretor">("colaborador");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim() || !password || !confirmation) return Alert.alert("Campos obrigatórios", "Preencha todos os campos.");
    if (password !== confirmation) return Alert.alert("Senhas diferentes", "A confirmação precisa ser igual à senha.");
    if (password.length < 8) return Alert.alert("Senha muito curta", "Use pelo menos 8 caracteres.");
    setSubmitting(true);
    try {
      await register({ nome: name.trim(), email: email.trim(), senha: password, tipo: type });
      Alert.alert("Conta criada", "Agora você já pode entrar no LearnHub.", [{ text: "Entrar", onPress: () => navigation.replace("Login") }]);
    } catch (caught) {
      Alert.alert("Não foi possível cadastrar", caught instanceof Error ? caught.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={[styles.flex, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.card }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Crie sua conta</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Faça parte da rede que transforma boas ideias em impacto.</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field icon="person-outline" placeholder="Nome completo" value={name} onChangeText={setName} colors={colors} />
          <Field icon="mail-outline" placeholder="E-mail" value={email} onChangeText={setEmail} colors={colors} keyboardType="email-address" autoCapitalize="none" />
          <Field icon="lock-closed-outline" placeholder="Senha (mínimo de 8 caracteres)" value={password} onChangeText={setPassword} colors={colors} secureTextEntry={!showPassword} trailing={<TouchableOpacity onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} /></TouchableOpacity>} />
          <Field icon="shield-checkmark-outline" placeholder="Confirmar senha" value={confirmation} onChangeText={setConfirmation} colors={colors} secureTextEntry={!showPassword} />

          <Text style={[styles.label, { color: colors.text }]}>Como você vai usar o LearnHub?</Text>
          <View style={styles.types}>
            {(["colaborador", "diretor"] as const).map((item) => {
              const selected = type === item;
              return <TouchableOpacity key={item} onPress={() => setType(item)} style={[styles.type, { backgroundColor: selected ? colors.primarySoft : colors.background, borderColor: selected ? colors.primary : colors.border }]}><Ionicons name={item === "diretor" ? "school-outline" : "people-outline"} size={20} color={selected ? colors.primary : colors.muted} /><Text style={[styles.typeText, { color: selected ? colors.primary : colors.text }]}>{item === "diretor" ? "Diretor" : "Colaborador"}</Text></TouchableOpacity>;
            })}
          </View>

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
  content: { flexGrow: 1, padding: 22, paddingVertical: 36 },
  back: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 31, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 24 },
  card: { borderWidth: 1, borderRadius: 26, padding: 20 },
  inputBox: { minHeight: 55, borderWidth: 1, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, marginBottom: 14 },
  input: { flex: 1, height: "100%", fontSize: 14 },
  label: { fontSize: 13, fontWeight: "800", marginTop: 4, marginBottom: 10 },
  types: { flexDirection: "row", gap: 9, marginBottom: 22 },
  type: { flex: 1, minHeight: 56, borderWidth: 1, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  typeText: { fontSize: 12, fontWeight: "800" },
  button: { minHeight: 57, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
