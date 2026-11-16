import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";
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
  const mapRef = React.useRef<MapView>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const [mapFailed, setMapFailed] = React.useState(false);
  const [mapAttempt, setMapAttempt] = React.useState(0);
  const readyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mappedProjects = projects.map((project) => ({ project, coordinate: projectCoordinate(project) })).filter((item) => item.coordinate);

  const fitMapToMarkers = () => {
    if (latitude == null || longitude == null) return;
    const coordinates = [
      { latitude, longitude },
      ...mappedProjects.map(({ coordinate }) => coordinate!),
    ];
    if (coordinates.length === 1) {
      coordinates.push(
        { latitude: latitude + 0.006, longitude: longitude + 0.006 },
        { latitude: latitude - 0.006, longitude: longitude - 0.006 },
      );
    }
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 55, right: 55, bottom: 55, left: 55 },
      animated: false,
    });
  };

  React.useEffect(() => {
    if (readyTimer.current) clearTimeout(readyTimer.current);
    if (latitude == null || longitude == null || Platform.OS === "web") return;
    readyTimer.current = setTimeout(() => setMapFailed(true), 12000);
    return () => {
      if (readyTimer.current) clearTimeout(readyTimer.current);
    };
  }, [latitude, longitude, mapAttempt]);

  const handleMapReady = () => {
    if (readyTimer.current) clearTimeout(readyTimer.current);
    setMapReady(true);
    setMapFailed(false);
    setTimeout(fitMapToMarkers, 180);
  };

  const retryMap = () => {
    setMapReady(false);
    setMapFailed(false);
    setMapAttempt((attempt) => attempt + 1);
  };

  const openGoogleMaps = () => {
    if (latitude == null || longitude == null) return;
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
  };

  if (latitude == null || longitude == null) {
    return <View style={[styles.unavailable, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="location-outline" size={30} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.unavailableTitle, { color: colors.text }]}>Informe seu CEP para usar o mapa</Text><Text style={[styles.unavailableText, { color: colors.muted }]}>Abra o Perfil, edite o endereço e consulte o CEP. O CEP e o número continuarão privados.</Text></View></View>;
  }

  return <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.header}><View><Text style={[styles.title, { color: colors.text }]}>Projetos perto de você</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Posições aproximadas para proteger os endereços.</Text></View><Ionicons name="map-outline" size={25} color={colors.primary} /></View>
    {Platform.OS === "web" ? <View style={[styles.webFallback, { backgroundColor: colors.primarySoft }]}><Ionicons name="phone-portrait-outline" size={25} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: "700" }}>Abra no Expo Go para visualizar o mapa interativo.</Text><TouchableOpacity onPress={openGoogleMaps} style={[styles.googleMapsButton, { borderColor: colors.primary }]}><Ionicons name="open-outline" size={16} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: "800" }}>Abrir no Google Maps</Text></TouchableOpacity></View> : <View style={styles.mapFrame}>
      <MapView
        ref={mapRef}
        key={`nearby-map-${latitude}-${longitude}-${mapAttempt}`}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        mapType="standard"
        initialRegion={{ latitude, longitude, latitudeDelta: 0.035, longitudeDelta: 0.035 }}
        loadingEnabled
        loadingIndicatorColor={colors.primary}
        loadingBackgroundColor={colors.card}
        showsCompass
        showsMyLocationButton={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        onMapReady={handleMapReady}
      >
        <Marker coordinate={{ latitude, longitude }} title="Sua região" description="Localização aproximada" pinColor={colors.success} />
        {mappedProjects.map(({ project, coordinate }) => <Marker key={project.id} coordinate={coordinate!} pinColor={colors.primary}><Callout onPress={() => onOpenProject(project.id)}><View style={styles.callout}><Text style={styles.calloutTitle}>{project.titulo}</Text><Text style={styles.calloutText}>{[project.location?.neighborhood, project.location?.city].filter(Boolean).join(" · ")}</Text><Text style={styles.calloutLink}>Abrir projeto</Text></View></Callout></Marker>)}
      </MapView>
      {!mapReady && !mapFailed ? <View pointerEvents="none" style={[styles.mapStatus, { backgroundColor: colors.card }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.mapStatusTitle, { color: colors.text }]}>Carregando Google Maps...</Text><Text style={[styles.mapStatusText, { color: colors.muted }]}>Localizando os projetos da sua região.</Text></View> : null}
      {mapFailed ? <View style={[styles.mapStatus, { backgroundColor: colors.card }]}><Ionicons name="map-outline" size={34} color={colors.primary} /><Text style={[styles.mapStatusTitle, { color: colors.text }]}>O mapa demorou para responder</Text><Text style={[styles.mapStatusText, { color: colors.muted }]}>Confira a internet e tente carregar novamente.</Text><TouchableOpacity onPress={retryMap} style={[styles.retryButton, { backgroundColor: colors.primary }]}><Ionicons name="refresh-outline" size={17} color="#fff" /><Text style={styles.retryButtonText}>Tentar novamente</Text></TouchableOpacity><TouchableOpacity onPress={openGoogleMaps} style={styles.externalLink}><Text style={{ color: colors.primary, fontWeight: "800" }}>Abrir no Google Maps</Text></TouchableOpacity></View> : null}
    </View>}
    <View style={styles.radiusRow}><Text style={[styles.radiusLabel, { color: colors.muted }]}>Mostrar em até:</Text>{[2, 5, 10].map((value) => <TouchableOpacity key={value} onPress={() => onRadiusChange(value)} style={[styles.radius, { backgroundColor: value === radius ? colors.primary : colors.background, borderColor: value === radius ? colors.primary : colors.border }]}><Text style={{ color: value === radius ? "#fff" : colors.text, fontWeight: "800", fontSize: 11 }}>{value} km</Text></TouchableOpacity>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 22, padding: 13, marginBottom: 18, overflow: "hidden" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 3, paddingBottom: 11 },
  title: { fontSize: 16, fontWeight: "900" }, subtitle: { fontSize: 11, marginTop: 3 }, mapFrame: { width: "100%", height: 280, borderRadius: 17, overflow: "hidden" }, map: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  unavailable: { borderWidth: 1, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  unavailableTitle: { fontSize: 14, fontWeight: "900" }, unavailableText: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  webFallback: { minHeight: 150, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 8, padding: 18 },
  googleMapsButton: { minHeight: 40, borderWidth: 1, borderRadius: 999, paddingHorizontal: 15, marginTop: 4, flexDirection: "row", alignItems: "center", gap: 7 },
  mapStatus: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", padding: 22 },
  mapStatusTitle: { fontSize: 15, fontWeight: "900", marginTop: 10, textAlign: "center" },
  mapStatusText: { fontSize: 11, lineHeight: 17, marginTop: 4, textAlign: "center" },
  retryButton: { minHeight: 42, borderRadius: 999, paddingHorizontal: 17, marginTop: 14, flexDirection: "row", alignItems: "center", gap: 7 },
  retryButtonText: { color: "#fff", fontWeight: "900", fontSize: 12 }, externalLink: { minHeight: 36, justifyContent: "center", paddingHorizontal: 12, marginTop: 3 },
  radiusRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingTop: 12 }, radiusLabel: { fontSize: 11, flex: 1 },
  radius: { minWidth: 48, minHeight: 35, borderWidth: 1, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  callout: { width: 180, padding: 4 }, calloutTitle: { fontSize: 14, fontWeight: "800", color: "#21172d" }, calloutText: { fontSize: 11, color: "#6d6176", marginTop: 4 }, calloutLink: { fontSize: 11, fontWeight: "800", color: "#7620c8", marginTop: 7 },
});
