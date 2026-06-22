import React, {
  useEffect,
  useState,
  useContext
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemeContext } from "../theme/ThemeContext";

export default function ProjectDetailsScreen({ route, navigation }: any) {
  // CORRIGIDO: Captura 'projetoId' que vem do ProjectsScreen, usando 'id' como fallback seguro
  const { projetoId, id } = route.params || {};
  const idFinal = projetoId || id;

  const [projeto, setProjeto] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [comentario, setComentario] = useState("");

  const { colors } = useContext(ThemeContext);

  async function carregar() {
    try {
      const dados = await AsyncStorage.getItem("projetos");
      const lista = JSON.parse(dados || "[]");

      // CORRIGIDO: Agora busca na lista usando o ID correto recebido por parâmetro
      const item = lista.find((x: any) => x.id === idFinal);
      setProjeto(item);

      const user = await AsyncStorage.getItem("user");
      setUsuario(user ? JSON.parse(user) : null);
    } catch (error) {
      console.error("Erro ao carregar os detalhes do projeto:", error);
    }
  }

  useEffect(() => {
    carregar();
  }, [idFinal]);

  async function comentar() {
    if (!comentario.trim() || !idFinal) return;

    try {
      const dados = await AsyncStorage.getItem("projetos");
      let lista = JSON.parse(dados || "[]");

      lista = lista.map((p: any) => {
        if (p.id === idFinal) {
          if (!p.comentarios) p.comentarios = [];

          p.comentarios.push({
            id: Date.now(),
            usuario: usuario?.nome || "Usuário",
            texto: comentario
          });
        }
        return p;
      });

      await AsyncStorage.setItem("projetos", JSON.stringify(lista));
      setComentario("");
      carregar();
    } catch (error) {
      console.error("Erro ao comentar:", error);
    }
  }

  async function excluir() {
    Alert.alert(
      "Excluir projeto",
      "Deseja excluir este projeto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const dados = await AsyncStorage.getItem("projetos");
              let lista = JSON.parse(dados || "[]");

              lista = lista.filter((x: any) => x.id !== idFinal);

              await AsyncStorage.setItem("projetos", JSON.stringify(lista));
              navigation.goBack();
            } catch (error) {
              console.error("Erro ao excluir projeto:", error);
            }
          }
        }
      ]
    );
  }

  // Fallback visual caso o projeto ainda não tenha sido carregado do AsyncStorage
  if (!projeto) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Carregando detalhes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background }
      ]}
      contentContainerStyle={{
        paddingTop: 45,
        paddingBottom: 50
      }}
    >
      <View style={styles.header}>
        {projeto.imagem && (
          <Image
            source={{ uri: projeto.imagem }}
            style={styles.image}
          />
        )}

        <Text style={[styles.title, { color: colors.text }]}>
          {projeto.titulo}
        </Text>

        <Text style={[styles.description, { color: colors.text }]}>
          {projeto.descricao}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Comentários
        </Text>

        {projeto.comentarios?.map((c: any) => (
          <View key={c.id} style={styles.comment}>
            <Text style={styles.user}>{c.usuario}</Text>
            <Text style={{ color: "#000" }}>{c.texto}</Text>
          </View>
        ))}

        <TextInput
          placeholder="Escreva um comentário..."
          placeholderTextColor="#777"
          value={comentario}
          onChangeText={setComentario}
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={comentar}
        >
          <Text style={styles.white}>Enviar comentário</Text>
        </TouchableOpacity>

        {usuario?.tipo?.toLowerCase().trim() === "diretor" && (
          <TouchableOpacity style={styles.delete} onPress={excluir}>
            <Text style={styles.white}>🗑 Excluir projeto</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  header: {
    marginTop: 15,
    marginBottom: 35
  },
  image: {
    width: "100%",
    height: 230,
    borderRadius: 28,
    marginBottom: 25
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 18
  },
  description: {
    fontSize: 17,
    lineHeight: 26
  },
  section: {
    marginTop: 10,
    padding: 20,
    borderRadius: 25,
    backgroundColor: "rgba(150,150,150,0.15)"
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },
  comment: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 18,
    marginBottom: 15
  },
  user: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000"
  },
  input: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginTop: 15,
    color: "#000"
  },
  button: {
    padding: 17,
    borderRadius: 20,
    marginTop: 15,
    alignItems: "center"
  },
  delete: {
    backgroundColor: "#d62828",
    padding: 18,
    borderRadius: 20,
    marginTop: 20,
    alignItems: "center"
  },
  white: {
    color: "#fff",
    fontWeight: "bold"
  }
});