import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [totalProjetos, setTotalProjetos] = useState(0);
  const [totalFavoritos, setTotalFavoritos] = useState(0);
  const [carregando, setCarregando] = useState(true);

  const { colors } = useContext(ThemeContext);

  async function loadProfileData() {
    try {
      setCarregando(true);
      
      // Carrega dados do usuário
      const u = await AsyncStorage.getItem("user");
      const userData = u ? JSON.parse(u) : null;
      setUser(userData);

      // Carrega projetos para calcular as estatísticas reais do perfil
      const p = await AsyncStorage.getItem("projetos");
      const listaProjetos = p ? JSON.parse(p) : [];

      if (userData) {
        // Se for diretor, conta quantos projetos ele criou (assumindo validação por email ou mock)
        // Se não tiver essa propriedade mapeada, mostraremos um valor fixo ou calculado
        const criados = listaProjetos.length; // Ajuste conforme a sua regra de criador
        
        // Conta quantos projetos este usuário favoritou
        const favs = listaProjetos.filter((proj: any) => 
          proj.favoritos && proj.favoritos.includes(userData.email)
        ).length;

        setTotalProjetos(criados);
        setTotalFavoritos(favs);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do perfil:", error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { void loadProfileData(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (carregando) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Captura a primeira letra do nome para o Avatar
  const primeiraLetra = user?.nome ? user.nome.charAt(0).toUpperCase() : "?";
  const ehDiretor = user?.tipo === "diretor";

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Bloco do Avatar e Nome */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{primeiraLetra}</Text>
        </View>
        
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.nome || "Usuário LearnHub"}
        </Text>

        {/* Badge do Tipo de Conta */}
        <View style={[
          styles.badge, 
          { backgroundColor: ehDiretor ? colors.yellow + "25" : colors.primary + "25" }
        ]}>
          <Ionicons 
            name={ehDiretor ? "school" : "code-working"} 
            size={14} 
            color={ehDiretor ? colors.yellow : colors.primary} 
            style={{ marginRight: 6 }}
          />
          <Text style={[
            styles.badgeText, 
            { color: ehDiretor ? colors.yellow : colors.primary }
          ]}>
            {ehDiretor ? "Diretor Geral" : "Colaborador"}
          </Text>
        </View>
      </View>

      {/* Grid de Estatísticas Rápidas */}
      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsNumber, { color: colors.primary }]}>
            {ehDiretor ? totalProjetos : "—"}
          </Text>
          <Text style={[styles.statsLabel, { color: colors.text }]}>
            {ehDiretor ? "Projetos Criados" : "Acessos Rápidos"}
          </Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsNumber, { color: colors.yellow }]}>{totalFavoritos}</Text>
          <Text style={[styles.statsLabel, { color: colors.text }]}>Favoritos</Text>
        </View>
      </View>

      {/* Seção de Detalhes da Conta */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Informações Pessoais</Text>
      
      <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
        {/* Campo de Email */}
        <View style={[styles.infoRow, { borderBottomColor: colors.background + "40" }]}>
          <View style={styles.infoLeft}>
            <Ionicons name="mail-outline" size={20} color="#888888" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.infoLabel}>E-mail de Acesso</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email || "Não informado"}</Text>
            </View>
          </View>
        </View>

        {/* Campo de Identificador / ID */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="finger-print-outline" size={20} color="#888888" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.infoLabel}>ID da Conta</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>#{user?.id || "0000"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Botão de Atualizar Manualmente */}
      <TouchableOpacity 
        style={[styles.refreshButton, { borderColor: colors.primary + "40" }]}
        onPress={loadProfileData}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.refreshButtonText, { color: colors.primary }]}>Atualizar Perfil</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 24,
    alignItems: "center"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 44,
    fontWeight: "bold"
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center"
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 10
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 35
  },
  statsCard: {
    flex: 0.48,
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4
  },
  statsLabel: {
    fontSize: 13,
    opacity: 0.6,
    fontWeight: "600",
    textAlign: "center"
  },
  sectionTitle: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    opacity: 0.8,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  infoBox: {
    width: "100%",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 25,
    elevation: 2
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  infoLabel: {
    fontSize: 12,
    color: "#888888",
    fontWeight: "500",
    marginBottom: 2
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600"
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 10
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: "700"
  }
});
