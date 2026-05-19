import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import AboutScreen from './src/screens/AboutScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import ProjectDetailsScreen from './src/screens/ProjectDetailsScreen';
import DataScreen from './src/screens/DataScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
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