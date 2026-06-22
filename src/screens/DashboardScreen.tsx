import {
View,
Text,
StyleSheet,
ScrollView
} from "react-native";


import {
useEffect,
useState,
useContext
} from "react";


import AsyncStorage from
"@react-native-async-storage/async-storage";


import {
ThemeContext
} from "../theme/ThemeContext";







export default function DashboardScreen(){



const [projetos,setProjetos]=useState<any[]>([]);

const [usuario,setUsuario]=useState<any>();



const {
colors
}=useContext(ThemeContext);








async function carregar(){



const dados =
await AsyncStorage.getItem(
"projetos"
);



if(dados)

setProjetos(
JSON.parse(dados)
);






const user =
await AsyncStorage.getItem(
"user"
);



if(user)

setUsuario(
JSON.parse(user)
);



}







useEffect(()=>{


carregar();


},[]);








const totalApoios =

projetos.reduce(

(total,item)=>

total+(item.apoios||0),

0

);








const favoritos =

projetos.filter(

(p)=>

p.favoritos?.includes(
usuario?.email
)

).length;









return(



<ScrollView


style={[

styles.container,

{
backgroundColor:colors.background
}

]}



showsVerticalScrollIndicator={false}



contentContainerStyle={{

paddingBottom:80

}}



>







<Text


style={[

styles.title,

{
color:colors.primary
}

]}



>

Dashboard

</Text>









<Text


style={[

styles.subtitle,

{
color:colors.text
}

]}


>

Visão geral da LearnHub

</Text>









<View

style={styles.grid}

>








<View


style={[

styles.card,

{
backgroundColor:colors.card
}

]}



>



<Text style={styles.icon}>

📚

</Text>



<Text

style={[

styles.label,

{
color:colors.text
}

]}

>

Projetos

</Text>



<Text

style={[

styles.number,

{
color:colors.primary
}

]}


>

{projetos.length}

</Text>



</View>










<View


style={[

styles.card,

{
backgroundColor:colors.card
}

]}


>



<Text style={styles.icon}>

🤝

</Text>



<Text

style={[

styles.label,

{
color:colors.text
}

]}


>

Apoios

</Text>



<Text

style={[

styles.number,

{
color:colors.yellow
}

]}

>

{totalApoios}

</Text>



</View>









<View


style={[

styles.card,

{
backgroundColor:colors.card
}

]}



>



<Text style={styles.icon}>

⭐

</Text>



<Text

style={[

styles.label,

{
color:colors.text
}

]}


>

Favoritos

</Text>



<Text

style={[

styles.number,

{
color:colors.yellow
}

]}


>

{favoritos}

</Text>



</View>







</View>









<View


style={[

styles.bigCard,

{
backgroundColor:colors.card
}

]}



>



<Text


style={[

styles.bigTitle,

{
color:colors.text
}

]}



>


Impacto da comunidade


</Text>







<Text


style={[

styles.description,

{
color:colors.text
}

]}



>


A LearnHub aproxima escolas,
comunidade e parceiros para que
projetos educacionais saiam do papel
e gerem impacto real.


</Text>







</View>








</ScrollView>




)

}









const styles =
StyleSheet.create({





container:{

flex:1,

padding:20

},





title:{

fontSize:40,

fontWeight:"bold",

marginBottom:10

},





subtitle:{

fontSize:18,

marginBottom:25

},






grid:{

gap:20

},







card:{

padding:25,

borderRadius:25,

elevation:5

},







icon:{

fontSize:35

},




label:{

fontSize:18,

marginTop:10

},





number:{

fontSize:45,

fontWeight:"bold",

marginTop:10

},







bigCard:{

marginTop:30,

padding:25,

borderRadius:25

},







bigTitle:{

fontSize:25,

fontWeight:"bold",

marginBottom:15

},






description:{

fontSize:17,

lineHeight:25

}



});