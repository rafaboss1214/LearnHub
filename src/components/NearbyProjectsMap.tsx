import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { AuthUser } from "../services/auth";
import { Project } from "../services/projects";

type Props = {
  projects: Project[];
  user: AuthUser | null;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onOpenProject: (id: number) => void;
  colors: any;
};

function projectCoordinate(project: Project) {
  if (project.location?.latitude == null || project.location?.longitude == null) return null;
  const angle = (project.id * 137.5 * Math.PI) / 180;
  const offset = 0.00045 + (project.id % 4) * 0.00015;
  return {
    latitude: project.location.latitude + Math.sin(angle) * offset,
    longitude: project.location.longitude + Math.cos(angle) * offset,
  };
}

export default function NearbyProjectsMap({ projects, user, radius, onRadiusChange, onOpenProject, colors }: Props) {
  const latitude = user?.endereco?.latitudeAprox;
  const longitude = user?.endereco?.longitudeAprox;
  if (latitude == null || longitude == null) {
    return <View style={[styles.unavailable, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="location-outline" size={30} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.unavailableTitle, { color: colors.text }]}>Informe seu CEP para usar o mapa</Text><Text style={[styles.unavailableText, { color: colors.muted }]}>Abra o Perfil, edite o endereço e consulte o CEP. O CEP e o número continuarão privados.</Text></View></View>;
  }

  const mappedProjects = projects.map((project) => ({ project, coordinate: projectCoordinate(project) })).filter((item) => item.coordinate);
  return <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.header}><View><Text style={[styles.title, { color: colors.text }]}>Projetos perto de você</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Posições aproximadas para proteger os endereços.</Text></View><Ionicons name="map-outline" size={25} color={colors.primary} /></View>
    {Platform.OS === "web" ? <View style={[styles.webFallback, { backgroundColor: colors.primarySoft }]}><Ionicons name="phone-portrait-outline" size={25} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: "700" }}>Abra no Expo Go para visualizar o mapa interativo.</Text></View> : <MapView style={styles.map} initialRegion={{ latitude, longitude, latitudeDelta: 0.035, longitudeDelta: 0.035 }}>
      <Marker coordinate={{ latitude, longitude }} title="Sua região" description="Localização aproximada" pinColor={colors.success} />
      {mappedProjects.map(({ project, coordinate }) => <Marker key={project.id} coordinate={coordinate!} pinColor={colors.primary}><Callout onPress={() => onOpenProject(project.id)}><View style={styles.callout}><Text style={styles.calloutTitle}>{project.titulo}</Text><Text style={styles.calloutText}>{[project.location?.neighborhood, project.location?.city].filter(Boolean).join(" · ")}</Text><Text style={styles.calloutLink}>Abrir projeto</Text></View></Callout></Marker>)}
    </MapView>}
    <View style={styles.radiusRow}><Text style={[styles.radiusLabel, { color: colors.muted }]}>Mostrar em até:</Text>{[2, 5, 10].map((value) => <TouchableOpacity key={value} onPress={() => onRadiusChange(value)} style={[styles.radius, { backgroundColor: value === radius ? colors.primary : colors.background, borderColor: value === radius ? colors.primary : colors.border }]}><Text style={{ color: value === radius ? "#fff" : colors.text, fontWeight: "800", fontSize: 11 }}>{value} km</Text></TouchableOpacity>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 22, padding: 13, marginBottom: 18, overflow: "hidden" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 3, paddingBottom: 11 },
  title: { fontSize: 16, fontWeight: "900" }, subtitle: { fontSize: 11, marginTop: 3 }, map: { width: "100%", height: 280, borderRadius: 17 },
  unavailable: { borderWidth: 1, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  unavailableTitle: { fontSize: 14, fontWeight: "900" }, unavailableText: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  webFallback: { minHeight: 120, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 8, padding: 18 },
  radiusRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingTop: 12 }, radiusLabel: { fontSize: 11, flex: 1 },
  radius: { minWidth: 48, minHeight: 35, borderWidth: 1, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  callout: { width: 180, padding: 4 }, calloutTitle: { fontSize: 14, fontWeight: "800", color: "#21172d" }, calloutText: { fontSize: 11, color: "#6d6176", marginTop: 4 }, calloutLink: { fontSize: 11, fontWeight: "800", color: "#7620c8", marginTop: 7 },
});
