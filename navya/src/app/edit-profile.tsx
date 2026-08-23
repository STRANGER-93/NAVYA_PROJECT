import React, { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/auth/BackButton";
import PrimaryButton from "../components/buttons/PrimaryButton";
import CalendarPicker from "../features/setup/components/CalendarPicker";
import Colors from "../constants/colors";
import { ProfileData, useProfile } from "../features/profile/ProfileContext";
import { KeyboardAwareScrollView, KeyboardAwareTextInput as TextInput } from "../components/layout/KeyboardAwareScrollView";

export default function EditProfileScreen() {
  const router = useRouter(); const { profile, updateProfile } = useProfile(); const [draft, setDraft] = useState(profile); const [saving, setSaving] = useState(false);
  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Photo permission needed", "Allow photo-library access to choose a profile photo."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.45, base64: true });
    if (result.canceled || !result.assets[0]?.base64) return;
    const avatarData = `data:image/jpeg;base64,${result.assets[0].base64}`;
    if (avatarData.length > 2_800_000) { Alert.alert("Photo is too large", "Please choose a smaller image."); return; }
    update("avatarData", avatarData);
  };
  const save = async () => { setSaving(true); try { await updateProfile(draft); router.back(); } catch (error) { Alert.alert("Could not save profile", error instanceof Error ? error.message : "Please try again."); } finally { setSaving(false); } };
  const initial = draft.name.trim().charAt(0).toUpperCase() || "A";
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}><KeyboardAwareScrollView contentContainerStyle={styles.content}><BackButton onPress={() => router.back()} /><Text style={styles.title}>Edit Profile</Text><Text style={styles.subtitle}>Update your personal details anytime.</Text><Pressable onPress={() => void choosePhoto()} style={styles.photoArea}><View style={styles.avatar}>{draft.avatarData ? <Image source={{ uri: draft.avatarData }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initial}</Text>}</View><Text style={styles.photoLink}>Change profile photo</Text></Pressable><Field label="Full Name"><TextInput value={draft.name} onChangeText={(value) => update("name", value)} style={styles.input} returnKeyType="next" /></Field><Field label="Email Address"><TextInput value={draft.email} editable={false} style={[styles.input, styles.disabled]} /></Field><Field label="Date of Birth"><CalendarPicker value={draft.dateOfBirth} onChange={(date) => update("dateOfBirth", date)} title="Select date of birth" /></Field><Field label="Age at Menarche"><Numeric value={draft.menarcheAge} onChange={(value) => update("menarcheAge", value)} /></Field><View style={styles.row}><View style={styles.half}><Field label="Height (ft)"><Numeric value={draft.heightFeet} onChange={(value) => update("heightFeet", value)} /></Field></View><View style={styles.half}><Field label="Height (in)"><Numeric value={draft.heightInches} onChange={(value) => update("heightInches", value)} /></Field></View></View><Field label="Weight (kg)"><Numeric value={draft.weightKg} onChange={(value) => update("weightKg", value)} /></Field><Field label="Sleep Hours"><Numeric value={draft.sleepHours} onChange={(value) => update("sleepHours", value)} /></Field><PrimaryButton title={saving ? "Saving…" : "Save Changes"} disabled={saving} onPress={() => void save()} style={styles.button} /></KeyboardAwareScrollView></SafeAreaView>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>; }
function Numeric({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <TextInput value={value} onChangeText={(text) => onChange(text.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" style={styles.input} />; }
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.background }, flex: { flex: 1 }, content: { paddingHorizontal: 17, paddingTop: 45, paddingBottom: 40, gap: 17 }, title: { marginTop: 28, color: Colors.darkPurple, fontSize: 29, fontWeight: "700" }, subtitle: { marginTop: -9, color: "#A277C5", fontSize: 16 }, photoArea: { alignItems: "center", gap: 9, marginVertical: 4 }, avatar: { width: 96, height: 96, overflow: "hidden", alignItems: "center", justifyContent: "center", borderRadius: 48, backgroundColor: "#C978F1" }, avatarImage: { width: "100%", height: "100%" }, avatarText: { color: Colors.white, fontSize: 36, fontWeight: "700" }, photoLink: { color: "#B86EF8", fontSize: 16, fontWeight: "700" }, field: { gap: 8 }, label: { color: "#4D2C70", fontSize: 16, fontWeight: "600" }, input: { height: 56, paddingHorizontal: 18, borderWidth: 1, borderColor: "#E6CFFF", borderRadius: 18, backgroundColor: Colors.white, color: Colors.darkPurple, fontSize: 16 }, disabled: { opacity: 0.65, backgroundColor: "#F3EDF8" }, row: { flexDirection: "row", gap: 12 }, half: { flex: 1 }, button: { marginTop: 14 } });
