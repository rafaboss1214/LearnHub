import {
ScrollView,
Text,
View,
StyleSheet
} from "react-native";


import {
useContext
} from "react";


import {
ThemeContext
} from "../theme/ThemeContext";





export default function AboutScreen(){


const {
colors
}=useContext(ThemeContext);





return(


<ScrollView


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

Sobre a LearnHub

</Text>





<Text style={[styles.text,{color:colors.text}]}>



A LearnHub é uma plataforma colaborativa criada para conectar escolas,
comunidade e parceiros.

{"\n\n"}

O objetivo é transformar ideias educacionais em projetos reais,
dando visibilidade para iniciativas que muitas vezes não possuem recursos
ou apoio suficiente.

{"\n\n"}

Escolas podem divulgar seus projetos, buscar colaboradores e acompanhar
o impacto das ações.

{"\n\n"}


Missão:

{"\n"}

Conectar pessoas e instituições para fortalecer a educação através da colaboração.

{"\n\n"}



Visão:

{"\n"}

Ser uma ponte entre escolas e sociedade, criando oportunidades para inovação.

{"\n\n"}



Valores:

{"\n"}

• Educação acessível

{"\n"}

• Colaboração

{"\n"}

• Transparência

{"\n"}

• Inovação

{"\n"}

• Impacto social



</Text>





</ScrollView>



)

}







const styles=StyleSheet.create({

container:{

flex:1,

padding:25

},



title:{

fontSize:35,

fontWeight:"bold",

marginBottom:25

},



text:{

fontSize:17,

lineHeight:26

}



});