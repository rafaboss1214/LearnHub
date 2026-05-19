import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sobre Nós</Text>

      <Text style={styles.text}>
        O Learn Hub nasceu com o objetivo de reduzir
        a desigualdade de recursos em projetos escolares.
      </Text>

      <Text style={styles.subtitle}>Metodologias</Text>

      <Text style={styles.text}>
        • Conexão entre comunidade e escolas{"\n"}
        • Incentivo à participação social{"\n"}
        • Transparência nos projetos{"\n"}
        • Divulgação de necessidades educacionais{"\n"}
        • Apoio empresarial e comunitário
      </Text>

      <Text style={styles.subtitle}>Conceitos</Text>

      <Text style={styles.text}>
        O projeto utiliza princípios de inovação social,
        educação colaborativa e impacto comunitário,
        promovendo oportunidades para estudantes
        desenvolverem projetos com mais estrutura.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 20,
  },
  title: {
    color: '#38BDF8',
    fontSize: 32,
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
    lineHeight: 26,
  },
});