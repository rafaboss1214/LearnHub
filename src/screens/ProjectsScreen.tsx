import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";

export default function ProjectsScreen({ navigation }: any) {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  const { colors } = useContext(ThemeContext);

  const ordenarProjetos = (listaDeProjetos: any[], emailUsuario: string) => {
    if (!emailUsuario) return listaDeProjetos;

    const favoritados = listaDeProjetos.filter(
      (p) => p.favoritos && p.favoritos.includes(emailUsuario)
    );
    const naoFavoritados = listaDeProjetos.filter(
      (p) => !p.favoritos || !p.favoritos.includes(emailUsuario)
    );

    favoritados.sort((a, b) => a.id.localeCompare(b.id));

    return [...favoritados, ...naoFavoritados];
  };

  useFocusEffect(
    useCallback(() => {
      async function carregarDados() {
        try {
          // CORRIGIDO: Removido o 'setProregando' que causava erro no seu print
          setCarregando(true);
          
          const usuarioData = await AsyncStorage.getItem("user");
          const usuarioLogado = usuarioData ? JSON.parse(usuarioData) : null;
          setUser(usuarioLogado);

          const projetosData = await AsyncStorage.getItem("projetos");
          const listaProjetos = projetosData ? JSON.parse(projetosData) : [];

          if (usuarioLogado) {
            const listaOrdenada = ordenarProjetos(listaProjetos, usuarioLogado.email);
            setProjetos(listaOrdenada);
          } else {
            setProjetos(listaProjetos);
          }
        } catch (error) {
          console.error("Erro ao carregar projetos:", error);
        } finally {
          setCarregando(false);
        }
      }

      carregarDados();
    }, [])
  );

  async function alternarFavorito(projetoId: string) {
    if (!user) return;

    try {
      const dadosAtuais = await AsyncStorage.getItem("projetos");
      const listaOriginal = dadosAtuais ? JSON.parse(dadosAtuais) : [];

      const listaAtualizada = listaOriginal.map((p: any) => {
        if (p.id === projetoId) {
          const jaFavoritou = p.favoritos ? p.favoritos.includes(user.email) : false;
          const novosFavoritos = jaFavoritou
            ? p.favoritos.filter((e: string) => e !== user.email)
            : [...(p.favoritos || []), user.email];

          return { ...p, favoritos: novosFavoritos };
        }
        return p;
      });

      await AsyncStorage.setItem("projetos", JSON.stringify(listaAtualizada));

      const listaReordenada = ordenarProjetos(listaAtualizada, user.email);
      setProjetos(listaReordenada);
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
    }
  }

  function apoiarProjeto(tituloProjeto: string) {
    Alert.alert(
      "Apoio Registrado! 🤝",
      `Obrigado! Você indicou interesse em colaborar com o projeto:\n"${tituloProjeto}". O diretor responsável será notificado.`
    );
  }

  function abrirDetalhes(projetoId: string) {
    if (navigation) {
      navigation.navigate("Detalhes", { projetoId: projetoId });
    }
  }

  if (carregando) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const tipoUsuario = user?.tipo ? user.tipo.toLowerCase().trim() : "";
  const ehDiretor = tipoUsuario === "diretor";
  const ehColaborador = tipoUsuario === "colaborador";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {ehDiretor ? "Dashboard de Projetos" : "Projetos Disponíveis"}
        </Text>
        
        {ehDiretor && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              try {
                navigation.getParent()?.navigate("CriarProjeto");
              } catch (e) {
                navigation.navigate("CriarProjeto");
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.createButtonText}>Criar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={projetos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={50} color="#888888" />
            <Text style={styles.emptyText}>Nenhum projeto encontrado.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const foiFavoritado = item.favoritos ? item.favoritos.includes(user?.email) : false;

          return (
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
              
              <TouchableOpacity activeOpacity={0.9} onPress={() => abrirDetalhes(item.id)}>
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.background }]}>
                    <Ionicons name="image-outline" size={32} color="#888888" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.cardBody}>
                
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardCategory, { color: colors.primary }]}>
                    {item.categoria ? item.categoria.toUpperCase() : "GERAL"}
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={() => alternarFavorito(item.id)}
                    style={styles.favButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={foiFavoritado ? "heart" : "heart-outline"}
                      size={24}
                      color={foiFavoritado ? "#ff3b30" : "#888888"}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity activeOpacity={0.9} onPress={() => abrirDetalhes(item.id)}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {item.descricao}
                  </Text>
                </TouchableOpacity>

                {ehColaborador && (
                  <TouchableOpacity
                    style={[styles.supportButton, { backgroundColor: colors.primary + "15" }]}
                    onPress={() => apoiarProjeto(item.titulo)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="hand-left-outline" size={18} color={colors.primary} />
                    <Text style={[styles.supportButtonText, { color: colors.primary }]}>
                      Apoiar este Projeto
                    </Text>
                  </TouchableOpacity>
                )}
                
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginTop: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 24, fontWeight: "800" },
  createButton: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, elevation: 2 },
  createButtonText: { color: "#ffffff", fontWeight: "bold", marginLeft: 4, fontSize: 14 },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  card: { borderRadius: 24, marginBottom: 20, overflow: "hidden", elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardImage: { width: "100%", height: 160, resizeMode: "cover" },
  cardImagePlaceholder: { width: "100%", height: 160, justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 20 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardCategory: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  favButton: { padding: 4, zIndex: 10 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  cardDescription: { fontSize: 14, color: "#888888", lineHeight: 20, marginBottom: 12 },
  supportButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 14, marginTop: 12, gap: 6 },
  supportButtonText: { fontSize: 14, fontWeight: "700" },
  emptyContainer: { alignItems: "center", justifyContent: "center", marginTop: 60, opacity: 0.5 },
  emptyText: { marginTop: 10, fontSize: 16, fontWeight: "600" }
});