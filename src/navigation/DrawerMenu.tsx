import React, { useContext, useEffect, useState } from "react";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AuthUser, clearSession, getCurrentUser } from "../services/auth";
import Feedback, { FeedbackState } from "../components/Feedback";

import TabNavigator from "./TabNavigator";
import ProfileScreen from "../screens/ProfileOverviewScreen";
import ChatScreen from "../screens/ChatScreen";
import CollaborationsScreen from "../screens/CollaborationsScreen";
import ModerationScreen from "../screens/ModerationScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProgressScreen from "../screens/ProgressScreen";
import { ThemeContext } from "../theme/ThemeContext";

const Drawer = createDrawerNavigator();

function SettingsScreen() {
  const { colors, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={toggleTheme}>
        <Text style={styles.white}>Alterar tema 🌙☀️</Text>
      </TouchableOpacity>
    </View>
  );
}

// Componente customizado para renderizar o interior do Drawer com o botão Sair
function CustomDrawerContent(props: any) {
  const { colors } = useContext(ThemeContext);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  async function fazerLogout() {
    setFeedback({ title: "Sair da conta?", message: "Você poderá entrar novamente quando quiser.", confirm: () => { void (async () => {
          try {
            // Limpa os dados de login salvos
            await clearSession();
            
            // Como o DrawerMenu está aninhado no Stack principal (Index), 
            // podemos resetar para a tela de Login que está no topo do Stack
            props.navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.error("Erro ao deslogar:", error);
          }
        })(); } });
  }

  async function trocarConta() {
    try {
      await clearSession();
      props.navigation.getParent()?.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) { console.error("Erro ao trocar conta:", error); }
  }

  return (
    <View style={{ flex: 1 }}>
      <Feedback value={feedback} onClose={() => setFeedback(null)} />
      {/* Lista padrão das telas do Drawer */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Botão fixo no rodapé */}
      <View style={[styles.logoutContainer, { borderTopColor: colors.text + "22" }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => void trocarConta()}>
          <Ionicons name="people-outline" size={22} color={colors.primary} />
          <Text style={[styles.logoutText, { color: colors.primary }]}>Trocar conta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={fazerLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ff4d4d" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerMenu() {
  const { colors } = useContext(ThemeContext);
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => { void getCurrentUser().then(setUser); }, []);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        drawerStyle: { backgroundColor: colors.background },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
      }}
    >
      <Drawer.Screen
        name="Inicio"
        component={TabNavigator}
        options={{
          title: "LearnHub",
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Solicitações"
        component={CollaborationsScreen}
        options={{ drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="Mensagens"
        component={ChatScreen}
        options={{ drawerIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="Progressão"
        component={ProgressScreen}
        options={{ drawerIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} /> }}
      />
      <Drawer.Screen
        name="Notificações"
        component={NotificationsScreen}
        options={{ drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} /> }}
      />
      {user?.tipo === "admin" && <Drawer.Screen
        name="Moderação"
        component={ModerationScreen}
        options={{ drawerIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} /> }}
      />}
      <Drawer.Screen
        name="Configurações"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
  },
  button: {
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  white: {
    color: "#fff",
    fontWeight: "bold",
  },
  logoutContainer: {
    padding: 20,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  logoutText: {
    color: "#ff4d4d",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
});
