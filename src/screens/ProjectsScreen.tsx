import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function ProjectsScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Projetos Escolares</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Detalhes')}
      >
        <Text style={styles.projectTitle}>
          Feira de Ciências Sustentável
        </Text>

        <Text style={styles.text}>
          Projeto focado em reciclagem e energia limpa.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Detalhes')}
      >
        <Text style={styles.projectTitle}>
          Laboratório de Robótica
        </Text>

        <Text style={styles.text}>
          Desenvolvimento tecnológico para alunos.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  title: {
    color: '#38BDF8',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  projectTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    color: '#CBD5E1',
    fontSize: 16,
  },
});