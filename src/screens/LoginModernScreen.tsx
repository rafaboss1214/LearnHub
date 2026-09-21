import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getCurrentUser, login } from "../services/auth";
import { warmUpApi } from "../services/api";
import { ThemeContext } from "../theme/ThemeContext";

export default function LoginModernScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    void warmUpApi();
    getCurrentUser()
      .then((user) => { if (user) navigation.replace("Principal"); })
      .finally(() => setCheckingSession(false));
  }, [navigation]);

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert("Campos obrigatórios", "Informe seu e-mail e sua senha.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigation.replace("Principal");
    } catch (caught) {
      Alert.alert("Não foi possível entrar", caught instanceof Error ? caught.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={[styles.flex, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}><Ionicons name="school" size={38} color={colors.primary} /></View>
        <Text style={[styles.brand, { color: colors.text }]}>Learn<Text style={{ color: colors.primary }}>Hub</Text></Text>
        <Text style={[styles.tagline, { color: colors.muted }]}>Projetos educacionais conectados a pessoas que fazem acontecer.</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Bem-vindo de volta</Text>
          <Text style={[styles.cardSubtitle, { color: colors.muted }]}>Entre para acompanhar a comunidade.</Text>

          <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
          <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="mail-outline" size={20} color={colors.muted} />
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="voce@exemplo.com" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text }]} />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Senha</Text>
          <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
            <TextInput value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="password" placeholder="Sua senha" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text }]} onSubmitEditing={() => void submit()} />
            <TouchableOpacity onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color={colors.muted} /></TouchableOpacity>
          </View>

          <TouchableOpacity disabled={submitting} onPress={() => void submit()} style={[styles.button, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.buttonText}>Entrar</Text><Ionicons name="arrow-forward" size={19} color="#FFFFFF" /></>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")} style={styles.registerLink}>
          <Text style={[styles.registerText, { color: colors.muted }]}>Ainda não tem uma conta? <Text style={{ color: colors.primary, fontWeight: "800" }}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flexGrow: 1, justifyContent: "center", padding: 22, paddingVertical: 42 },
  logo: { alignSelf: "center", width: 72, height: 72, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  brand: { textAlign: "center", fontSize: 38, fontWeight: "900", letterSpacing: -1.2, marginTop: 13 },
  tagline: { textAlign: "center", fontSize: 14, lineHeight: 20, maxWidth: 330, alignSelf: "center", marginTop: 7, marginBottom: 28 },
  card: { borderWidth: 1, borderRadius: 27, padding: 21 },
  cardTitle: { fontSize: 21, fontWeight: "900" },
  cardSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 23 },
  label: { fontSize: 13, fontWeight: "800", marginBottom: 8 },
  inputBox: { minHeight: 55, borderWidth: 1, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, marginBottom: 17 },
  input: { flex: 1, height: "100%", fontSize: 15 },
  button: { minHeight: 57, borderRadius: 17, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 7 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  registerLink: { padding: 18, alignItems: "center" },
  registerText: { fontSize: 13 },
});
