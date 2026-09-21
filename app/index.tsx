import {
createNativeStackNavigator
} from "@react-navigation/native-stack";


import LoginScreen from "../src/screens/LoginModernScreen";
import RegisterScreen from "../src/screens/RegisterModernScreen";

import DrawerMenu from "../src/navigation/DrawerMenu";


import {
ThemeProvider
}
from "../src/theme/ThemeContext";



const Stack =
createNativeStackNavigator();



export default function Index(){


return(


<ThemeProvider>


<Stack.Navigator

screenOptions={{
headerShown:false
}}

>



<Stack.Screen

name="Login"

component={LoginScreen}

/>



<Stack.Screen

name="Cadastro"

component={RegisterScreen}

/>




<Stack.Screen

name="Principal"

component={DrawerMenu}

/>


</Stack.Navigator>


</ThemeProvider>


)


}
