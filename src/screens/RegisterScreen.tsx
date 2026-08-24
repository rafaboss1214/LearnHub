import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { ThemeContext } from "../theme/ThemeContext";
import { register } from "../services/auth";

export default function RegisterScreen({ navigation }: any) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [tipo, setTipo] = useState<"colaborador" | "diretor">("colaborador");

  const { colors } = useContext(ThemeContext);

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert("Erro", "Informe um e-mail válido.");
      return;
    }

    if (senha.length < 8) {
      Alert.alert("Erro", "A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    try {
      await register({ nome: nome.trim(), email: email.trim(), senha, tipo });
      Alert.alert("Sucesso", "Conta criada com sucesso! Faça login para continuar.", [
        { text: "OK", onPress: () => navigation.navigate("Login") }
      ]);
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Não foi possível realizar o cadastro no momento.");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.center}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>Criar Conta</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>Junte-se à comunidade LearnHub</Text>

        <View style={[styles.box, { backgroundColor: colors.card }]}>
          <TextInput
            placeholder="Nome Completo"
            placeholderTextColor="#888888"
            value={nome}
            onChangeText={setNome}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          />

          <TextInput
            placeholder="E-mail"
            placeholderTextColor="#888888"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor="#888888"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          />

          <TextInput
            placeholder="Confirmar Senha"
            placeholderTextColor="#888888"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          />

          {/* Seleção do Tipo de Usuário (Estilizada de acordo com o Tema) */}
          <Text style={[styles.label, { color: colors.text }]}>Selecione seu Perfil:</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { backgroundColor: tipo === "colaborador" ? colors.primary : colors.background }
              ]}
              onPress={() => setTipo("colaborador")}
            >
              <Text style={tipo === "colaborador" ? styles.whiteText : { color: colors.text }}>
                🧑‍💻 Colaborador
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                { backgroundColor: tipo === "diretor" ? colors.primary : colors.background }
              ]}
              onPress={() => setTipo("diretor")}
            >
              <Text style={tipo === "diretor" ? styles.whiteText : { color: colors.text }}>
                🎓 Diretor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botão Cadastrar */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.yellow }]}
            onPress={cadastrar}
          >
            <Text style={styles.blackText}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

        {/* Link para voltar ao Login */}
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Login")}>
          <Text style={{ color: colors.text, fontSize: 15 }}>
            Já tem uma conta? <Text style={{ color: colors.primary, fontWeight: "bold" }}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  center: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 25
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    opacity: 0.7
  },
  box: {
    padding: 20,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  input: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(120, 120, 120, 0.2)",
    fontSize: 16
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
    marginBottom: 12
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25
  },
  typeButton: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(120, 120, 120, 0.2)"
  },
  button: {
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    elevation: 2
  },
  whiteText: {
    color: "#ffffff",
    fontWeight: "bold"
  },
  blackText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16
  },
  link: {
    marginTop: 30,
    alignItems: "center"
  }
});
