import "react-native-gesture-handler";

import React from "react";
import { View, Text } from "react-native";

import { createDrawerNavigator } from "@react-navigation/drawer";

import HomeScreen from "../screens/HomeScreen";

const Drawer = createDrawerNavigator();

function ProjetosScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#020817",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 24,
        }}
      >
        Projetos
      </Text>
    </View>
  );
}

function ConfigScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#020817",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 24,
        }}
      >
        Configurações
      </Text>
    </View>
  );
}

export default function DrawerMenu() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#071426",
        },

        headerTintColor: "#fff",

        drawerStyle: {
          backgroundColor: "#08152B",
          width: 260,
        },

        drawerActiveBackgroundColor: "#123A63",

        drawerActiveTintColor: "#4DB8FF",

        drawerInactiveTintColor: "#FFFFFF",

        drawerLabelStyle: {
          fontSize: 16,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
      />

      <Drawer.Screen
        name="Projetos"
        component={ProjetosScreen}
      />

      <Drawer.Screen
        name="Configurações"
        component={ConfigScreen}
      />
    </Drawer.Navigator>
  );
}