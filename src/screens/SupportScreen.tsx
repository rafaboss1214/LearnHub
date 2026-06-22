import {
View,
Text,
StyleSheet
} from "react-native";


export default function SupportScreen(){


return(

<View style={styles.container}>


<Text style={styles.title}>
Apoios Recebidos
</Text>


<View style={styles.card}>

<Text>
🌱 João - Doação de sementes
</Text>

</View>


<View style={styles.card}>

<Text>
👥 Maria - Voluntária
</Text>

</View>


<View style={styles.card}>

<Text>
🏢 Empresa X - Materiais
</Text>

</View>



</View>

)

}


const styles=StyleSheet.create({

container:{
padding:20
},

title:{
fontSize:28,
fontWeight:"bold",
marginBottom:20
},

card:{
backgroundColor:"#fff",
padding:20,
marginBottom:15,
borderRadius:15,
elevation:3
}

})