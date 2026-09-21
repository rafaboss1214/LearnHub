import React, { useContext, useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import HomeScreen from "../screens/HomeOverviewScreen";
import ProjectsScreen from "../screens/ProjectsHubScreen";
import ProjectDetailsScreen from "../screens/ProjectViewScreen";
import CreateProjectScreen from "../screens/ProjectFormScreen";
import DashboardScreen from "../screens/DashboardOverviewScreen";
import { ThemeContext } from "../theme/ThemeContext";

const Tab = createBottomTabNavigator();
const ProjectsStack = createNativeStackNavigator();

function ProjectsNavigator() {
  const { colors } = useContext(ThemeContext);

  return (
    <ProjectsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ProjectsStack.Screen
        name="ListaProjetos"
        component={ProjectsScreen}
        options={{ headerShown: false }}
      />
      <ProjectsStack.Screen
        name="DetalhesProjeto"
        component={ProjectDetailsScreen}
        options={{ title: "Projeto" }}
      />
      <ProjectsStack.Screen
        name="FormularioProjeto"
        component={CreateProjectScreen}
        options={({ route }: any) => ({
          title: route.params?.projectId ? "Editar projeto" : "Novo projeto",
        })}
      />
    </ProjectsStack.Navigator>
  );
}

export default function TabNavigator() {
  const { colors } = useContext(ThemeContext);
  const [userType, setUserType] = useState<string>("");

  useEffect(() => {
    async function obterUsuario() {
      try {
        const dados = await AsyncStorage.getItem("user");
        if (dados) {
          const usuario = JSON.parse(dados);
          setUserType(usuario?.tipo ? usuario.tipo.toLowerCase().trim() : "");
        }
      } catch (error) {
        console.error("Erro ao buscar tipo de usuário nas abas:", error);
      }
    }
    obterUsuario();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          // Ajusta a altura ideal dependendo se é iOS (que tem a barra de baixo) ou Android
          height: Platform.OS === "ios" ? 85 : 68,
          // Controla o espaçamento interno para os ícones e textos não colarem embaixo
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 25 : 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarLabel: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Projetos"
        component={ProjectsNavigator}
        options={{
          tabBarLabel: "Projetos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
        }}
      />

      {/* O Dashboard só é registrado se o utilizador for 'diretor' */}
      {userType === "diretor" && (
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}
