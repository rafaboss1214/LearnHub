import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { getCurrentUser, login } from "../services/auth";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [verSenha, setVerSenha] = useState(false);
  const [inputFocado, setInputFocado] = useState<"email" | "senha" | null>(null);

  const { colors } = useContext(ThemeContext);

  useEffect(() => {
    async function iniciar() {
      try {
        // Mantém os projetos demonstrativos já existentes sem regravar dados do usuário.
        const projetosExistentes = await AsyncStorage.getItem("projetos");
        if (!projetosExistentes) {
        // Lista de 10 projetos iniciais que já vêm embutidos no app.
        const projetosIniciais = [
          {
            id: "p1",
            titulo: "EcoCultivo: Automação e Nutrição Escolar",
            descricao: "Construção de uma horta vertical hidropônica controlada por sensores simples de umidade. O projeto alimenta a cantina com verduras sem agrotóxicos e ensina biologia na prática.\n\nEscola: Instituto de Educação Florescer",
            categoria: "🌱 Sustentabilidade",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p2",
            titulo: "CicloVerde: Transformando Resíduos em Arte",
            descricao: "Pontos de coleta seletiva instalados nas salas. O plástico recolhido é higienizado e transformado em blocos organizadores e vasos em oficinas de artes.\n\nEscola: Escola Estadual Professor Almeida",
            categoria: "🌱 Sustentabilidade",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p3",
            titulo: "LearnSave: Controle de Desperdício na Cantina",
            descricao: "Um aplicativo móvel desenvolvido pelos próprios alunos de informática para pesar, registrar e gerar gráficos sobre o descarte de alimentos, ajudando a readequar o cardápio.\n\nEscola: Colégio Técnico de Inovação (CTI)",
            categoria: "🚀 Tecnologia e Ciência",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p4",
            titulo: "Sucata Tech: Robôs para Todos",
            descricao: "Oficinas práticas de eletrônica utilizando componentes retirados de computadores e eletrodomésticos velhos descartados, criando pequenos carrinhos autônomos.\n\nEscola: Escola Municipal Caminho do Futuro",
            categoria: "🚀 Tecnologia e Ciência",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p5",
            titulo: "Memórias Próprias: O Passado do Nosso Bairro",
            descricao: "Entrevistas em vídeo e áudio gravadas com moradores antigos da comunidade para resgatar a história local, organizadas em uma página web interativa pública.\n\nEscola: Centro Educacional Historiador Pedroso",
            categoria: "🎭 Arte e Cultura",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p6",
            titulo: "Ciência no Palco: Desvendando Grandes Mentes",
            descricao: "Apresentações de peças teatrais que recontam a vida e as descobertas de cientistas históricos (como Marie Curie e Einstein), misturando dramaturgia e experimentos reais.\n\nEscola: Colégio de Artes e Ciências Sol Nascente",
            categoria: "🎭 Arte e Cultura",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p7",
            titulo: "Cantinho da Calma: Saúde Mental na Escola",
            descricao: "Adaptação de uma sala subutilizada com pufes, iluminação sutil e fones de ouvido para descompressão de alunos que enfrentam estresse ou ansiedade pré-exames.\n\nEscola: Instituto Educacional Viver Bem",
            categoria: "🧠 Saúde e Bem-Estar",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p8",
            titulo: "Mexa-se Hub: Desafios Esportivos Gamificados",
            descricao: "Campeonato focado em gincanas e jogos cooperativos que pontuam pelo trabalho em grupo, estimulando a movimentação física de quem não gosta de esportes tradicionais.\n\nEscola: Escola de Ensino Fundamental Alvorada",
            categoria: "🧠 Saúde e Bem-Estar",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p9",
            titulo: "Escola Sem Barreiras: Acessibilidade e Inclusão",
            descricao: "Instalação de sinalizações táteis em Braille moldadas em impressoras 3D e aplicação de QR Codes nas paredes que abrem vídeos explicativos em Libras.\n\nEscola: Centro de Educação Inclusiva Integração",
            categoria: "🤝 Inclusão e Cidadania",
            imagem: "",
            favoritos: [],
            comentarios: []
          },
          {
            id: "p10",
            titulo: "Mão na Massa: Empreendedorismo Social",
            descricao: "Produção voluntária de pães artesanais aos sábados na cozinha da escola. Metade da produção alimenta abrigos locais e a outra arrecada fundos para material didático.\n\nEscola: Colégio Técnico Profissionalizante Esperança",
            categoria: "🤝 Inclusão e Cidadania",
            imagem: "",
            favoritos: [],
            comentarios: []
          }
        ];

          await AsyncStorage.setItem("projetos", JSON.stringify(projetosIniciais));
        }

        const usuario = await getCurrentUser();
        if (usuario) navigation.replace("Principal");
      } catch (error) {
        console.error("Erro ao inicializar banco de dados do app:", error);
      } finally {
        setCarregando(false);
      }
    }
    iniciar();
  }, [navigation]);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos.");
      return;
    }

    try {
      await login(email.trim(), senha);
      navigation.replace("Principal");
    } catch (error) {
      Alert.alert("Erro de Autenticação", error instanceof Error ? error.message : "Ocorreu uma falha ao tentar realizar o login.");
    }
  }

  if (carregando) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={[styles.logoIconBg, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="school" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.primary }]}>LearnHub</Text>
          <Text style={[styles.brandSubtitle, { color: colors.text }]}>
            Conectando ideias, transformando a educação.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Acesse sua conta</Text>

          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.background,
                borderColor: inputFocado === "email" ? colors.primary : "rgba(120, 120, 120, 0.2)"
              }
            ]}
          >
            <Ionicons name="mail-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput
              placeholder="E-mail profissional"
              placeholderTextColor="#888888"
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { color: colors.text }]}
              onChangeText={setEmail}
              value={email}
              onFocus={() => setInputFocado("email")}
              onBlur={() => setInputFocado(null)}
            />
          </View>

          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.background,
                borderColor: inputFocado === "senha" ? colors.primary : "rgba(120, 120, 120, 0.2)"
              }
            ]}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput
              placeholder="Senha de acesso"
              placeholderTextColor="#888888"
              secureTextEntry={!verSenha}
              style={[styles.input, { color: colors.text }]}
              onChangeText={setSenha}
              value={senha}
              onFocus={() => setInputFocado("senha")}
              onBlur={() => setInputFocado(null)}
            />
            <TouchableOpacity onPress={() => setVerSenha(!verSenha)} style={styles.eyeIcon}>
              <Ionicons
                name={verSenha ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#888888"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={entrar}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Acessar Plataforma</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate("Cadastro")}
          activeOpacity={0.7}
        >
          <Text style={[styles.linkText, { color: colors.text }]}>
            Não possui uma conta?{" "}
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: { alignItems: "center", marginBottom: 35 },
  logoIconBg: { padding: 16, borderRadius: 22, marginBottom: 16 },
  brandTitle: { fontSize: 42, fontWeight: "900", letterSpacing: -1 },
  brandSubtitle: { fontSize: 15, textAlign: "center", marginTop: 8, opacity: 0.65, paddingHorizontal: 25, lineHeight: 22 },
  card: { padding: 24, borderRadius: 32, elevation: 6, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 22, opacity: 0.9 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 18, marginBottom: 16, borderWidth: 1.5, paddingHorizontal: 16, height: 58 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, height: "100%" },
  eyeIcon: { padding: 6 },
  button: { flexDirection: "row", padding: 18, borderRadius: 18, alignItems: "center", marginTop: 10, elevation: 2, justifyContent: "center" }, // Corrigido!
  buttonText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
  linkContainer: { marginTop: 35, alignItems: "center", paddingVertical: 10 },
  linkText: { fontSize: 15, opacity: 0.8 }
});
