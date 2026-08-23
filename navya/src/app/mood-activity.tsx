import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "../components/auth/BackButton";
import BottomNavigation from "../components/navigation/BottomNavigation";
import PrimaryButton from "../components/buttons/PrimaryButton";
import Colors from "../constants/colors";
import { ActivityType, getMoodConfiguration } from "../features/mood/moodRepository";
import { MoodId } from "../features/mood/moodRepository";
import { useMoodHistory } from "../features/mood/MoodHistoryContext";

type FeedbackProps = { onHome: (mood?: MoodId) => void };
const feedbackChoices = [{ emoji: "😟", label: "Stressed" }, { emoji: "😔", label: "Sad" }, { emoji: "😐", label: "Neutral" }, { emoji: "😊", label: "Happy" }];

export default function MoodActivityScreen() {
  const router = useRouter();
  const { mood, activity } = useLocalSearchParams<{ mood?: string; activity?: ActivityType }>();
  const config = getMoodConfiguration(mood);
  const { logMood } = useMoodHistory();
  const type = activity ?? config.activity;
  const home = (finalMood?: MoodId) => { logMood(finalMood ?? config.id); router.replace("/dashboard"); };
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}><View style={styles.content}><BackButton onPress={() => router.back()} />{type === "breathing" ? <BreathingActivity onHome={home} /> : null}{type === "grounding" ? <GroundingActivity onHome={home} /> : null}{type === "relaxation" ? <RelaxationActivity onHome={home} /> : null}</View><BottomNavigation activeTab="Mood" /></SafeAreaView>;
}

function BreathingActivity({ onHome }: FeedbackProps) {
  const scale = useRef(new Animated.Value(0.78)).current;
  const [phase, setPhase] = useState<"Inhale" | "Hold your breath" | "Exhale">("Inhale");
  const [complete, setComplete] = useState(false);
  const [run, setRun] = useState(0);
  const startCycle = () => { setComplete(false); setPhase("Inhale"); scale.setValue(0.78); setRun((value) => value + 1); };
  useEffect(() => { const inhale = Animated.timing(scale, { toValue: 1.22, duration: 4000, useNativeDriver: true }); inhale.start(); const hold = setTimeout(() => setPhase("Hold your breath"), 4000); const exhale = setTimeout(() => { setPhase("Exhale"); Animated.timing(scale, { toValue: 0.78, duration: 4000, useNativeDriver: true }).start(); }, 8000); const finish = setTimeout(() => setComplete(true), 12000); return () => { inhale.stop(); clearTimeout(hold); clearTimeout(exhale); clearTimeout(finish); }; }, [run, scale]);
  return <View style={styles.activityCenter}><Text style={styles.activityTitle}>Take a slow breath</Text><Text style={styles.activitySubtitle}>Follow the circle at your own pace.</Text><Animated.View style={[styles.breathCircle, { transform: [{ scale }] }]}><Text style={styles.breathText}>{phase}</Text></Animated.View>{complete ? <View style={styles.completedArea}><Pressable accessibilityRole="button" onPress={startCycle}><Text style={styles.tryAgain}>Try once more</Text></Pressable><FeelNow onHome={onHome} /></View> : <Text style={styles.phaseHint}>{phase === "Inhale" ? "Breathe in slowly for 4 seconds" : phase === "Hold your breath" ? "Pause gently for 4 seconds" : "Breathe out slowly for 4 seconds"}</Text>}</View>;
}

function GroundingActivity({ onHome }: FeedbackProps) {
  const [step, setStep] = useState(0);
  const screens = [{ emoji: "👀", text: "Look around. Notice 3 things you can see.", button: "I see them" }, { emoji: "👂", text: "Listen closely. Notice 3 sounds you can hear right now.", button: "I hear them" }, { emoji: "🦶", text: "Move your body. Wiggle your toes, roll your wrists, or shrug your shoulders.", button: "Done" }];
  if (step === 3) return <View style={styles.activityCenter}><Text style={styles.activityTitle}>Great job</Text><Text style={styles.guidance}>Take one more deep breath.</Text><FeelNow onHome={onHome} /></View>;
  const current = screens[step];
  const advance = async () => { if (step === 2) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setStep((value) => value + 1); };
  return <View style={styles.activityCenter}><Text style={styles.activityTitle}>A gentle grounding pause</Text><Text style={styles.groundingEmoji}>{current.emoji}</Text><Text style={styles.guidance}>{current.text}</Text><PrimaryButton title={current.button} onPress={advance} style={styles.actionButton} /></View>;
}

function RelaxationActivity({ onHome }: FeedbackProps) {
  const [started, setStarted] = useState(false);
  const player = useAudioPlayer(require("../../assets/audio/relaxation.mp3"));
  const status = useAudioPlayerStatus(player);
  const [showFeedback, setShowFeedback] = useState(false);
  useEffect(() => { if (started && status.didJustFinish) setShowFeedback(true); }, [started, status.didJustFinish]);
  if (!started) return <View style={styles.activityCenter}><Text style={styles.activityTitle}>A moment to relax</Text><Text style={styles.guidance}>Relax your shoulders, take slow breaths, and make yourself comfortable.</Text><PrimaryButton title="Continue" onPress={() => setStarted(true)} style={styles.actionButton} /></View>;
  const minutes = Math.floor(status.currentTime / 60); const seconds = Math.floor(status.currentTime % 60).toString().padStart(2, "0");
  if (showFeedback) return <View style={styles.activityCenter}><Text style={styles.activityTitle}>Take your time</Text><Text style={styles.guidance}>Notice how your body feels after that quiet pause.</Text><FeelNow onHome={onHome} /></View>;
  return <View style={styles.activityCenter}><Text style={styles.activityTitle}>Close your eyes if comfortable</Text><Text style={styles.guidance}>Listen for a few quiet minutes and let your body settle.</Text><View style={styles.audioCircle}><Text style={styles.audioIcon}>🎧</Text><Text style={styles.audioTime}>{minutes}:{seconds}</Text></View><PrimaryButton title={status.playing ? "Pause Audio" : "Play Relaxation Audio"} onPress={() => status.playing ? player.pause() : player.play()} style={styles.actionButton} /><Pressable accessibilityRole="button" onPress={async () => { player.pause(); await player.seekTo(0); setShowFeedback(true); }}><Text style={styles.stopAudio}>Stop and continue</Text></Pressable></View>;
}

function FeelNow({ onHome }: FeedbackProps) { const [selected, setSelected] = useState<{ label: string; mood: MoodId } | null>(null); const choices = [{ ...feedbackChoices[0], mood: "stressed" as MoodId }, { ...feedbackChoices[1], mood: "sad" as MoodId }, { ...feedbackChoices[2], mood: "anxious" as MoodId }, { ...feedbackChoices[3], mood: "happy" as MoodId }]; return <View style={styles.feelNow}><Text style={styles.feedbackTitle}>How do you feel now?</Text><View style={styles.feedbackRow}>{choices.map((choice) => <Pressable key={choice.label} accessibilityRole="radio" accessibilityState={{ selected: selected?.label === choice.label }} onPress={() => setSelected(choice)} style={[styles.feedbackButton, selected?.label === choice.label ? styles.feedbackSelected : null]}><Text style={styles.feedbackEmoji}>{choice.emoji}</Text><Text style={styles.feedbackLabel}>{choice.label}</Text></Pressable>)}</View><PrimaryButton title="Return to Home" onPress={() => onHome(selected?.mood)} style={styles.returnButton} /></View>; }

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.background }, content: { flex: 1, paddingHorizontal: 18, paddingTop: 45 }, activityCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, paddingBottom: 100 }, activityTitle: { color: Colors.darkPurple, fontSize: 28, fontWeight: "700", textAlign: "center" }, activitySubtitle: { marginTop: 9, color: "#A277C5", fontSize: 17, textAlign: "center" }, breathCircle: { width: 205, height: 205, alignItems: "center", justifyContent: "center", marginTop: 55, borderRadius: 103, backgroundColor: "#D989F7" }, breathText: { color: Colors.darkPurple, fontSize: 23, fontWeight: "700" }, phaseHint: { marginTop: 65, color: "#805A98", fontSize: 18, textAlign: "center" }, completedArea: { alignSelf: "stretch", alignItems: "center", marginTop: 60 }, tryAgain: { color: "#A15CC9", fontSize: 17, fontWeight: "700" }, feelNow: { alignSelf: "stretch", alignItems: "center", marginTop: 27 }, feedbackTitle: { color: Colors.darkPurple, fontSize: 20, fontWeight: "700" }, feedbackRow: { flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch", marginTop: 17 }, feedbackButton: { width: 68, alignItems: "center", paddingVertical: 8, borderRadius: 18 }, feedbackSelected: { backgroundColor: "#ECDDFF" }, feedbackEmoji: { fontSize: 26 }, feedbackLabel: { marginTop: 5, color: "#76557E", fontSize: 11 }, returnButton: { alignSelf: "stretch", marginTop: 31 }, groundingEmoji: { marginTop: 45, fontSize: 57 }, guidance: { marginTop: 25, color: "#805A98", fontSize: 23, lineHeight: 35, textAlign: "center" }, actionButton: { alignSelf: "stretch", marginTop: 55 }, audioCircle: { width: 150, height: 150, alignItems: "center", justifyContent: "center", marginTop: 40, borderRadius: 75, backgroundColor: "#ECDDFF" }, audioIcon: { fontSize: 45 }, audioTime: { marginTop: 6, color: Colors.darkPurple, fontSize: 17, fontVariant: ["tabular-nums"] }, stopAudio: { marginTop: 24, color: "#A15CC9", fontSize: 17, fontWeight: "700" }, });
