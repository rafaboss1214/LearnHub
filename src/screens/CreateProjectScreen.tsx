import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from "../theme/ThemeContext";

const categoriasDisponiveis = [
  { id: "sustentabilidade", nome: "🌱 Sustentabilidade" },
  { id: "tecnologia", nome: "🚀 Tecnologia e Ciência" },
  { id: "cultura", nome: "🎭 Arte e Cultura" },
  { id: "saude", nome: "🧠 Saúde e Bem-Estar" },
  { id: "inclusao", nome: "🤝 Inclusão e Cidadania" },
];

export default function CreateProjectScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagem, setImagem] = useState("");

  const { colors } = useContext(ThemeContext);

  async function escolherImagem() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });

    if (!resultado.canceled) {
      setImagem(resultado.assets[0].uri);
    }
  }

  async function publicar() {
    if (!titulo.trim() || !descricao.trim() || !categoria) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos e selecione uma categoria.");
      return;
    }

    try {
      const dados = await AsyncStorage.getItem("projetos");
      const lista = dados ? JSON.parse(dados) : [];

      const novo = {
        id: Date.now().toString(),
        titulo,
        descricao,
        categoria,
        imagem,
        favoritos: [],
        comentarios: []
      };

      lista.push(novo);
      await AsyncStorage.setItem("projetos", JSON.stringify(lista));

      Alert.alert("Sucesso", "Projeto publicado com sucesso!", [
        { 
          text: "OK", 
          onPress: () => {
            // Limpa o formulário antes de voltar
            setTitulo("");
            setDescricao("");
            setCategoria("");
            setImagem("");
            // Rota corrigida para alinhar com o DrawerMenu
            navigation.navigate("Inicio"); 
          }
        }
      ]);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível publicar o projeto.");
    }
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
        <Text style={[styles.title, { color: colors.primary }]}>Novo Projeto</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Compartilhe a sua ideia transformadora com a comunidade.
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Título do Projeto</Text>
        <TextInput
          placeholder="Ex: Horta Comunitária Escolar"
          placeholderTextColor="#888888"
          value={titulo}
          onChangeText={setTitulo}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        />

        <Text style={[styles.label, { color: colors.text }]}>Descrição Detalhada</Text>
        <TextInput
          placeholder="Descreva os objetivos, público-alvo e recursos necessários..."
          placeholderTextColor="#888888"
          multiline
          numberOfLines={4}
          value={descricao}
          onChangeText={setDescricao}
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: colors.card, color: colors.text }
          ]}
        />

        <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
        <View style={styles.categoriasContainer}>
          {categoriasDisponiveis.map((item) => {
            const selecionada = categoria === item.nome;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoriaTag,
                  {
                    backgroundColor: selecionada ? colors.primary : colors.card,
                    borderColor: selecionada ? colors.primary : "rgba(120, 120, 120, 0.15)"
                  }
                ]}
                onPress={() => setCategoria(item.nome)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoriaTagText,
                    { color: selecionada ? "#ffffff" : colors.text }
                  ]}
                >
                  {item.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {imagem ? (
          <Image source={{ uri: imagem }} style={styles.image} />
        ) : null}

        <TouchableOpacity
          style={[styles.imageButton, { borderColor: colors.primary + "40" }]}
          onPress={escolherImagem}
          activeOpacity={0.7}
        >
          <Text style={[styles.imageButtonText, { color: colors.primary }]}>
            {imagem ? "📷 Alterar imagem de capa" : "📷 Adicionar imagem de capa"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={publicar}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>Publicar Projeto</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 24
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 10
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 25,
    opacity: 0.6,
    lineHeight: 22
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 5
  },
  input: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(120, 120, 120, 0.1)",
    fontSize: 16
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 16
  },
  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 25
  },
  categoriaTag: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center"
  },
  categoriaTagText: {
    fontSize: 14,
    fontWeight: "600"
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 22,
    marginBottom: 15,
    resizeMode: "cover"
  },
  imageButton: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30
  },
  imageButtonText: {
    fontSize: 15,
    fontWeight: "700"
  },
  submitButton: {
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20
  },
  submitButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16
  }
});