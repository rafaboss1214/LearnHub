import {
View,
Text,
StyleSheet,
TouchableOpacity
} from "react-native";


import {
useContext,
useEffect,
useState
} from "react";


import AsyncStorage from
"@react-native-async-storage/async-storage";


import {
ThemeContext
}
from "../theme/ThemeContext";




export default function HomeScreen(
{navigation}:any
){



const [user,setUser]=useState<any>();

const [total,setTotal]=useState(0);



const {
colors
}=useContext(ThemeContext);





useEffect(()=>{


async function load(){


const u =
await AsyncStorage.getItem("user");


if(u)
setUser(JSON.parse(u));



const p =
await AsyncStorage.getItem("projetos");


if(p)
setTotal(JSON.parse(p).length);


}



load();


},[]);






return(


<View

style={[
styles.container,
{
backgroundColor:colors.background
}
]}

>



<Text

style={[
styles.title,
{
color:colors.primary
}
]}

>

Olá {user?.nome}

</Text>





<View

style={[
styles.card,
{
backgroundColor:colors.card
}
]}

>

<Text style={{
color:colors.text,
fontSize:20
}}>

Projetos publicados

</Text>


<Text

style={{
color:colors.yellow,
fontSize:50
}}

>

{total}

</Text>


</View>






<TouchableOpacity

style={[
styles.button,
{
backgroundColor:colors.primary
}
]}

onPress={()=>
navigation.navigate("Projetos")
}

>


<Text style={styles.white}>

Ver projetos

</Text>


</TouchableOpacity>




</View>


)

}




const styles=StyleSheet.create({

container:{

flex:1,

padding:25

},


title:{

fontSize:30,

fontWeight:"bold",

marginBottom:30

},


card:{

padding:25,

borderRadius:25,

marginBottom:30

},


button:{

padding:18,

borderRadius:18,

alignItems:"center"

},


white:{

color:"#fff",

fontWeight:"bold"

}

});