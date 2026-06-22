import React, {
createContext,
useEffect,
useState
} from "react";


import AsyncStorage from
"@react-native-async-storage/async-storage";



type ThemeContextType = {

dark:boolean;

toggleTheme:()=>void;

colors:any;

};



export const ThemeContext =
createContext({} as ThemeContextType);




export function ThemeProvider(
{children}:any
){


const [dark,setDark]=useState(false);



useEffect(()=>{


async function carregar(){


const tema =
await AsyncStorage.getItem(
"tema"
);



if(tema==="dark"){

setDark(true);

}


}



carregar();


},[]);





async function toggleTheme(){


setDark(!dark);



await AsyncStorage.setItem(

"tema",

!dark ? "dark":"light"

);



}





const colors = dark ?

{

background:"#050505",

card:"#111111",

text:"#ffffff",

primary:"#7c3aed",

yellow:"#facc15"

}

:

{

background:"#f5f5f5",

card:"#ffffff",

text:"#111111",

primary:"#7c3aed",

yellow:"#facc15"

};





return(

<ThemeContext.Provider

value={{

dark,

toggleTheme,

colors

}}

>


{children}


</ThemeContext.Provider>


)

}