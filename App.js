import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Ionicons from "react-native-vector-icons/Ionicons";

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA09i9SVMrCsLx2g4khzfSdesxp2BbWAqc",
  authDomain: "api-firebase-335d4.firebaseapp.com",
  projectId: "api-firebase-335d4",
  storageBucket: "api-firebase-335d4.firebasestorage.app",
  messagingSenderId: "723516020975",
  appId: "1:723516020975:web:8ffb4bf7ca88428ec2a31a",
  measurementId: "G-Z3CKX5XPZN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

/* ----------------- SCREENS ----------------- */

function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const login = () => {
    signInWithEmailAndPassword(auth, email, pass).catch(() => alert("Correo o contraseña incorrectos"));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput placeholder="Correo" placeholderTextColor="#888" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Contraseña" placeholderTextColor="#888" value={pass} onChangeText={setPass} secureTextEntry style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={login}>
        <Text style={styles.btnText}>Ingresar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 12 }} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Crear Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

function Register({ navigation }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const register = () => {
    createUserWithEmailAndPassword(auth, email, pass)
      .then(() => navigation.navigate("Login"))
      .catch(() => alert("No se pudo crear la cuenta"));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput placeholder="Correo" placeholderTextColor="#888" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Contraseña (min. 6)" placeholderTextColor="#888" value={pass} onChangeText={setPass} secureTextEntry style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={register}>
        <Text style={styles.btnText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
}

/* Helper para navegar al Home dentro del Drawer.
   Uso: goHome(navigation)
*/
const goHome = (navigation) => {
  // Navega al Drawer y selecciona la pantalla Home
  navigation.navigate("Drawer", { screen: "Home" });
};

function Home({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://api.escuelajs.co/api/v1/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(err => console.log(err));
  }, []);

  return (
    <View style={styles.container}>
      {/* Botón para abrir Drawer */}
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Text style={{ color: "#5AB0FF", fontSize: 22, marginBottom: 12 }}>☰ Menú</Text>
      </TouchableOpacity>

      <TextInput placeholder="Buscar..." placeholderTextColor="#888" style={styles.input} onChangeText={setSearch} />

      <FlatList
        data={products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("Detail", { product: item })}>
            <View style={styles.card}>
              <Image source={{ uri: item.images?.[0] }} style={styles.img} />
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>{item.title}</Text>
                <Text style={{ color: "#8fbcef", marginTop: 6 }}>${item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function Detail({ route, navigation }) {
  const { product } = route.params;

  const addFav = async () => {
    await setDoc(doc(collection(db, "favoritos"), String(product.id)), product);
    alert("Agregado a favoritos ✅");
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: product.images?.[0] }} style={styles.imgLarge} />
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.text}>{product.description}</Text>
      <TouchableOpacity style={styles.btn} onPress={addFav}>
        <Text style={styles.btnText}>❤️ Agregar a Favoritos</Text>
      </TouchableOpacity>

      {/* Volver al Home correctamente */}
      <TouchableOpacity style={[styles.btn, { backgroundColor: "#333", marginTop: 10 }]} onPress={() => goHome(navigation)}>
        <Text style={styles.btnText}>Volver al Home</Text>
      </TouchableOpacity>
    </View>
  );
}

function Favorites({ navigation }) {
  const [favs, setFavs] = useState([]);

  const loadFavs = async () => {
    const data = await getDocs(collection(db, "favoritos"));
    setFavs(data.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const removeFav = async (id) => {
    await deleteDoc(doc(db, "favoritos", String(id)));
    loadFavs();
  };

  useEffect(() => {
    loadFavs();
    const unsub = navigation.addListener("focus", loadFavs);
    return unsub;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <FlatList
        data={favs}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.images?.[0] }} style={styles.img} />
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>{item.title}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFav(item.id)}>
              <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No tienes favoritos aún.</Text>}
      />
    </View>
  );
}

function Profile({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>
      <Text style={styles.text}>Usuario: {auth.currentUser?.email}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => { signOut(auth); /* una vez cerrado, vuelve al login por el onAuthStateChanged */ }}>
        <Text style={styles.btnText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Botón para volver al Home desde Perfil */}
      <TouchableOpacity style={[styles.btn, { backgroundColor: "#333", marginTop: 10 }]} onPress={() => goHome(navigation)}>
        <Text style={styles.btnText}>Volver al Home</Text>
      </TouchableOpacity>
    </View>
  );
}

function Info({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Información de la App</Text>
      <Text style={styles.bold}>Juan Sebastián Herrera Piratoba</Text>
      <Text style={styles.text}>Tecnología en Desarrollo de Software</Text>
      <Text style={styles.text}>Esta app permite visualizar productos, ver detalles y guardar favoritos usando Firebase.</Text>

      <TouchableOpacity style={styles.btn} onPress={() => goHome(navigation)}>
        <Text style={styles.btnText}>Volver al Home</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ----------------- DRAWER (principal) ----------------- */
function MenuDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0F1F" },
        headerTintColor: "#5AB0FF",
        drawerStyle: { backgroundColor: "#071029" },
        drawerActiveTintColor: "#5AB0FF",
        drawerInactiveTintColor: "#E8EAED",
      }}
    >
      <Drawer.Screen
        name="Home"
        component={Home}
        options={{
          title: "Inicio",
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="Favoritos"
        component={Favorites}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="Info"
        component={Info}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="information-circle-outline" size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={Profile}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
}

/* ----------------- APP (root) ----------------- */
export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {/* Drawer es la pantalla principal cuando hay sesión */}
            <Stack.Screen name="Drawer" component={MenuDrawer} />
            {/* Detail queda en el Stack para poder navegar desde cualquier screen */}
            <Stack.Screen name="Detail" component={Detail} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* ----------------- STYLES ----------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#0A0F1F",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 18,
    color: "#5AB0FF",
    textAlign: "center",
  },
  text: {
    color: "#E8EAED",
    fontSize: 16,
  },
  bold: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#5AB0FF",
    backgroundColor: "#111727",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#10182F",
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#5AB0FF44",
  },
  img: {
    width: 75,
    height: 75,
    borderRadius: 12,
    marginRight: 12,
  },
  imgLarge: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#5AB0FF99",
  },
  btn: {
    backgroundColor: "#5AB0FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  btnText: {
    color: "#001824",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    color: "#5AB0FF",
    textAlign: "center",
    marginTop: 8,
  },
  empty: {
    color: "#9fbbe8",
    textAlign: "center",
    marginTop: 20,
  }
});
