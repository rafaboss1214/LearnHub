import {
View,
Text,
StyleSheet
} from "react-native";


export default function NotificationsScreen(){


return(

<View style={styles.container}>


<Text style={styles.title}>
Notificações
</Text>


<Text style={styles.card}>
❤️ Seu projeto recebeu apoio
</Text>


<Text style={styles.card}>
💬 Novo comentário
</Text>


<Text style={styles.card}>
🤝 Nova parceria interessada
</Text>


</View>


)

}



const styles=StyleSheet.create({

container:{
padding:20
},

title:{
fontSize:28,
fontWeight:"bold"
},

card:{
backgroundColor:"#fff",
padding:20,
marginTop:15,
borderRadius:15
}


})