import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import DrawerMenu from "./src/navigation/DrawerMenu";
import LoginScreen from "./src/screens/LoginModernScreen";
import RegisterScreen from "./src/screens/RegisterModernScreen";
import { ThemeProvider } from "./src/theme/ThemeContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Cadastro" component={RegisterScreen} />
              <Stack.Screen name="Principal" component={DrawerMenu} />
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
