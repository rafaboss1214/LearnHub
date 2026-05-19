import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DataScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Impacto do Learn Hub</Text>

      <View style={styles.card}>
        <Text style={styles.number}>25+</Text>
        <Text style={styles.label}>Escolas Participando</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.number}>120+</Text>
        <Text style={styles.label}>Projetos Publicados</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.number}>R$ 80 mil</Text>
        <Text style={styles.label}>Em Doações</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#38BDF8',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  number: {
    color: '#38BDF8',
    fontSize: 32,
    fontWeight: 'bold',
  },
  label: {
    color: '#E2E8F0',
    fontSize: 18,
    marginTop: 10,
  },
});