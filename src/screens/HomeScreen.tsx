import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Learn Hub</Text>

      <Text style={styles.subtitle}>
        Conectando escolas, empresas e comunidades
        para transformar a educação.
      </Text>

      <Text style={styles.text}>
        O Learn Hub é uma plataforma que ajuda escolas
        a encontrarem apoio para projetos educacionais,
        promovendo colaboração, doações e impacto social.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  title: {
    color: '#38BDF8',
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    color: '#E2E8F0',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    color: '#CBD5E1',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 25,
  },
});