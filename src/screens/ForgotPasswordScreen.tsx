import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeedback } from "../components/Feedback";
import { requestPasswordReset, resetPassword } from "../services/auth";
import { ThemeContext } from "../theme/ThemeContext";

export default function ForgotPasswordScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const { showAlert, feedback } = useFeedback();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    if (!email.trim()) return showAlert("Informe seu e-mail", "Digite o e-mail usado no cadastro.");
    setBusy(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setStep("reset");
      showAlert("Confira seu e-mail", result.message);
    } catch (caught) {
      showAlert("Recuperação indisponível", caught instanceof Error ? caught.message : "Tente novamente.");
    } finally { setBusy(false); }
  }

  async function submitReset() {
    if (!/^\d{6}$/.test(code.trim())) return showAlert("Código inválido", "Informe os 6 dígitos recebidos por e-mail.");
    if (password.length < 10) return showAlert("Senha muito curta", "Use pelo menos 10 caracteres.");
    if (password !== confirmation) return showAlert("Senhas diferentes", "A confirmação precisa ser igual à nova senha.");
    setBusy(true);
    try {
      const result = await resetPassword(email.trim(), code.trim(), password);
      showAlert("Senha atualizada", result.message, [{ text: "Entrar", onPress: () => navigation.replace("Login") }]);
    } catch (caught) {
      showAlert("Não foi possível redefinir", caught instanceof Error ? caught.message : "Tente novamente.");
    } finally { setBusy(false); }
  }

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView style={[styles.flex, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 24, 48), paddingBottom: Math.max(insets.bottom + 24, 48) }]} keyboardShouldPersistTaps="handled">
      {feedback}
      <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.card }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></TouchableOpacity>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Ionicons name="key-outline" size={32} color={colors.primary} /></View>
      <Text style={[styles.title, { color: colors.text }]}>Recuperar senha</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{step === "request" ? "Enviaremos um código de uso único para o seu e-mail." : "Digite o código recebido e escolha uma nova senha."}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
        <TextInput editable={step === "request"} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="voce@exemplo.com" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
        {step === "reset" && <>
          <Text style={[styles.label, { color: colors.text }]}>Código de 6 dígitos</Text>
          <TextInput value={code} onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="000000" placeholderTextColor={colors.muted} style={[styles.input, styles.code, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
          <Text style={[styles.label, { color: colors.text }]}>Nova senha</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo de 10 caracteres" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
          <Text style={[styles.label, { color: colors.text }]}>Confirmar nova senha</Text>
          <TextInput value={confirmation} onChangeText={setConfirmation} secureTextEntry placeholder="Repita a senha" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
        </>}
        <TouchableOpacity disabled={busy} onPress={() => void (step === "request" ? requestCode() : submitReset())} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? .65 : 1 }]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{step === "request" ? "Enviar código" : "Redefinir senha"}</Text>}</TouchableOpacity>
        {step === "reset" && <TouchableOpacity disabled={busy} onPress={() => void requestCode()} style={styles.resend}><Text style={{ color: colors.primary, fontWeight: "800" }}>Reenviar código</Text></TouchableOpacity>}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, content: { flexGrow: 1, padding: 24, width: "100%", maxWidth: 540, alignSelf: "center", justifyContent: "center" }, back: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 20 }, icon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" }, title: { fontSize: 30, fontWeight: "900", marginTop: 16 }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 22 }, card: { borderWidth: 1, borderRadius: 25, padding: 20 }, label: { fontSize: 13, fontWeight: "800", marginBottom: 7 }, input: { minHeight: 54, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, marginBottom: 16, fontSize: 15 }, code: { fontSize: 24, textAlign: "center", letterSpacing: 8, fontWeight: "900" }, button: { minHeight: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 4 }, buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" }, resend: { alignItems: "center", padding: 14, marginTop: 4 } });
