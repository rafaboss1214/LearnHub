import {
TouchableOpacity,
Text,
StyleSheet
} from "react-native";


import {
useContext
} from "react";


import {
ThemeContext
}
from "../theme/ThemeContext";




export default function ThemeButton(){



const {
dark,
toggleTheme
}
=
useContext(ThemeContext);





return(


<TouchableOpacity

style={styles.button}

onPress={toggleTheme}


>


<Text style={styles.text}>


{
dark ?

"☀️ Tema Claro"

:

"🌙 Tema Escuro"

}



</Text>


</TouchableOpacity>


)


}




const styles =
StyleSheet.create({


button:{

backgroundColor:"#7c3aed",

padding:16,

borderRadius:15,

marginTop:20

},


text:{

color:"#fff",

fontWeight:"bold",

textAlign:"center"

}


});