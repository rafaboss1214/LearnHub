import React, { useContext } from "react";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import TabNavigator from "./TabNavigator";
import ProfileScreen from "../screens/ProfileScreen";
import CreateProjectScreen from "../screens/CreateProjectScreen";
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

  async function fazerLogout() {
    Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            // Limpa os dados de login salvos
            await AsyncStorage.removeItem("user");
            
            // Como o DrawerMenu está aninhado no Stack principal (Index), 
            // podemos resetar para a tela de Login que está no topo do Stack
            props.navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.error("Erro ao deslogar:", error);
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Lista padrão das telas do Drawer */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Botão fixo no rodapé */}
      <View style={[styles.logoutContainer, { borderTopColor: colors.text + "22" }]}>
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
        name="Configurações"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="CriarProjeto"
        component={CreateProjectScreen}
        options={{
          drawerItemStyle: { display: "none" },
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