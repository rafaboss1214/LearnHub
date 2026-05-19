import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProjectDetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Feira de Ciências Sustentável
      </Text>

      <Text style={styles.text}>
        Este projeto busca conscientizar os alunos
        sobre sustentabilidade através de experiências,
        reciclagem e inovação ambiental.
      </Text>

      <Text style={styles.subtitle}>
        Necessidades do Projeto
      </Text>

      <Text style={styles.text}>
        • Materiais recicláveis{"\n"}
        • Kits de energia solar{"\n"}
        • Apoio financeiro{"\n"}
        • Divulgação comunitária
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 25,
  },
  title: {
    color: '#38BDF8',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    color: '#F8FAFC',
    fontSize: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 28,
  },
});