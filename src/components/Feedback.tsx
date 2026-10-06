import React, { useCallback, useContext, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../theme/ThemeContext";

export type FeedbackState = { title: string; message: string; confirm?: () => void; destructive?: boolean } | null;
export function useFeedback() {
  const [value, setValue] = useState<FeedbackState>(null);
  const showAlert = useCallback((title: string, message: string, buttons?: { text?: string; style?: string; onPress?: () => void }[]) => {
    const action = buttons?.find(button => button.style !== "cancel");
    setValue({ title, message, confirm: action?.onPress, destructive: action?.style === "destructive" });
  }, []);
  return { showAlert, feedback: <Feedback value={value} onClose={() => setValue(null)} /> };
}
export default function Feedback({ value, onClose }: { value: FeedbackState; onClose: () => void }) {
  const { colors } = useContext(ThemeContext);
  return <Modal visible={Boolean(value)} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{value?.title}</Text>
        <Text style={[styles.message, { color: colors.muted }]}>{value?.message}</Text>
        <View style={styles.actions}>
          {value?.confirm && <Pressable onPress={onClose} style={[styles.button, { backgroundColor: colors.surface }]}><Text style={{ color: colors.text }}>Cancelar</Text></Pressable>}
          <Pressable onPress={() => { const confirm = value?.confirm; onClose(); confirm?.(); }} style={[styles.button, { backgroundColor: value?.destructive ? colors.danger : colors.primary }]}>
            <Text style={styles.buttonText}>{value?.destructive ? "Excluir" : value?.confirm ? "Confirmar" : "Entendi"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#00000088", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 420, padding: 26, borderRadius: 24 },
  title: { fontSize: 21, fontWeight: "800" },
  message: { fontSize: 15, lineHeight: 23, marginVertical: 18 },
  actions: { flexDirection: "row", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" },
  button: { minHeight: 48, paddingHorizontal: 20, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "white", fontWeight: "800" },
});
