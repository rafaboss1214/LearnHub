import {
View,
Text,
TouchableOpacity,
StyleSheet
}
from "react-native";


import {
useContext
}
from "react";


import {
ThemeContext
}
from "../theme/ThemeContext";




export default function SettingsScreen(){



const {
dark,
toggleTheme,
colors
}
=
useContext(ThemeContext);




return(


<View


style={[

styles.page,

{
backgroundColor:
colors.background
}

]}



>



<Text

style={[
styles.title,
{
color:colors.text
}
]}

>

Configurações

</Text>





<TouchableOpacity

style={[
styles.button,
{
backgroundColor:colors.primary
}
]}

onPress={toggleTheme}

>



<Text style={styles.white}>


{
dark
?

"☀️ Tema Claro"

:

"🌙 Tema Escuro"

}


</Text>


</TouchableOpacity>





<TouchableOpacity

style={[
styles.button,
{
backgroundColor:colors.yellow
}
]}


>


<Text>

🔠 Aumentar fonte

</Text>


</TouchableOpacity>





</View>


)

}





const styles=StyleSheet.create({


page:{

flex:1,

padding:25

},


title:{

fontSize:30,

fontWeight:"bold"

},


button:{

padding:18,

borderRadius:18,

marginTop:20,

alignItems:"center"

},


white:{

color:"#fff",

fontWeight:"bold"

}


})