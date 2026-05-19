import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// 1. IMPORTANTE: Adicionamos o criador do menu lateral
import { createDrawerNavigator } from '@react-navigation/drawer'; 

import HomeScreen from '../src/screens/HomeScreen';
import AboutScreen from '../src/screens/AboutScreen';
import ProjectsScreen from '../src/screens/ProjectsScreen';
import ProjectDetailsScreen from '../src/screens/ProjectDetailsScreen';
import DataScreen from '../src/screens/DataScreen';

const Tab = createBottomTabNavigator();
// 2. Criamos a constante do Drawer
const Drawer = createDrawerNavigator(); 

// SEU MENU INFERIOR CONTINUA EXATAMENTE AQUI (Apenas removemos o 'export default')
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopWidth: 0,
          height: 65,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#CBD5E1',
      }}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Sobre" component={AboutScreen} />
      <Tab.Screen name="Projetos" component={ProjectsScreen} />
      <Tab.Screen name="Detalhes" component={ProjectDetailsScreen} />
      <Tab.Screen name="Dados" component={DataScreen} />
    </Tab.Navigator>
  );
}

// 3. ADICIONAMOS O MENU LATERAL COMO PRINCIPAL
// Ele vai carregar o seu menu de abas e criar o botão de três risquinhos no topo
export default function AppNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' }, // Cor da barra superior
        headerTintColor: '#38BDF8',                  // Cor do ícone "hambúrguer"
        drawerStyle: { backgroundColor: '#0F172A' }, // Cor de fundo do menu lateral
        drawerActiveTintColor: '#38BDF8',            // Cor do texto selecionado no menu
        drawerInactiveTintColor: '#CBD5E1',          // Cor do texto inativo no menu
      }}
    >
      {/* O menu lateral vai apontar para o seu TabNavigator antigo */}
      <Drawer.Screen 
        name="Principal" 
        component={TabNavigator} 
        options={{ title: 'Minhas Abas' }} 
      />

      {/* Se no futuro você quiser colocar outra tela avulsa no menu lateral, basta adicionar aqui embaixo: */}
      {/* <Drawer.Screen name="Configurações" component={ConfigScreen} /> */}
    </Drawer.Navigator>
  );
}