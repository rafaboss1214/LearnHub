import {
createNativeStackNavigator
} from "@react-navigation/native-stack";


import LoginScreen from "../src/screens/LoginScreen";
import RegisterScreen from "../src/screens/RegisterScreen";

import DrawerMenu from "../src/navigation/DrawerMenu";


import ProjectDetailsScreen
from "../src/screens/ProjectDetailsScreen";


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





<Stack.Screen

name="Detalhes"

component={ProjectDetailsScreen}

/>




</Stack.Navigator>


</ThemeProvider>


)


}