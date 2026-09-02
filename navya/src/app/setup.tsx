import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "../components/auth/BackButton";
import PrimaryButton from "../components/buttons/PrimaryButton";
import Colors from "../constants/colors";
import CalendarPicker from "../features/setup/components/CalendarPicker";
import SetupProgress from "../features/setup/components/SetupProgress";
import StressLevelSelector from "../features/setup/components/StressLevelSelector";
import { useProfile } from "../features/profile/ProfileContext";
import { useAuth } from "../features/auth/AuthContext";
import { api } from "../services/api";
import { localCalendarDate, localDateString } from "../utils/localDate";
import { KeyboardAwareScrollView, KeyboardAwareTextInput as TextInput } from "../components/layout/KeyboardAwareScrollView";

const cycleInfo = [
  "This is the length of your most recent period cycle.",
  "Length of your cycle before the recent one.",
  "Length of your cycle prior to the second one.",
];

const exerciseOptions = [
  { label: "Rarely / Never", value: 0 },
  { label: "Sometimes", value: 1 },
  { label: "Frequently", value: 2 },
];

type InfoDialog = { title: string; message: string } | null;

export default function SetupScreen() {
  const router = useRouter();
  const { updateProfile } = useProfile();
  const { updateSetupState } = useAuth();
  const [step, setStep] = useState(1);
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [cycleLengths, setCycleLengths] = useState(["28", "28", "28"]);
  const [periodLengths, setPeriodLengths] = useState(["5", "5", "5"]);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [menarcheAge, setMenarcheAge] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sleepHours, setSleepHours] = useState("6");
  const [stressLevel, setStressLevel] = useState(3);
  const [exerciseFrequency, setExerciseFrequency] = useState<number | null>(null);
  const [medicationContraceptive, setMedicationContraceptive] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoDialog, setInfoDialog] = useState<InfoDialog>(null);

  const bmi = useMemo(() => calculateBmi(heightFeet, heightInches, weightKg), [heightFeet, heightInches, weightKg]);

  const updateHistory = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter((current) => current.map((item, itemIndex) => itemIndex === index ? value.replace(/[^0-9]/g, "") : item));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!lastPeriodDate) return "Please select your last period start date.";
      if (!isEveryValueInRange(cycleLengths, 15, 60)) return "Enter each cycle length between 15 and 60 days.";
    }

    if (step === 2 && !isEveryValueInRange(periodLengths, 1, 14)) {
      return "Enter each period length between 1 and 14 days.";
    }

    if (step === 3) {
      const currentAge = calculateAge(dateOfBirth);
      const firstPeriodAge = Number(menarcheAge);
      const feet = Number(heightFeet);
      const inches = Number(heightInches);
      const weight = Number(weightKg);
      if (currentAge === null || currentAge < 8 || currentAge > 100) return "Please select a valid date of birth.";
      if (!menarcheAge || firstPeriodAge < 8 || firstPeriodAge > currentAge) return "Please enter an age at menarche between 8 and your current age.";
      const heightCm = (feet * 12 + inches) * 2.54;
      if (!heightFeet || feet <= 0 || heightInches === "" || inches < 0 || inches > 11 || heightCm < 50 || heightCm > 250) return "Enter a valid height between 50 and 250 cm.";
      if (!weightKg || weight < 20 || weight > 300) return "Please enter a valid weight between 20 and 300 kg.";
      if (bmi === null) return "We could not calculate your BMI. Please check your height and weight.";
    }

    if (step === 4) {
      const sleep = Number(sleepHours);
      if (!sleepHours || sleep < 1 || sleep > 24) return "Please enter your usual sleep hours between 1 and 24.";
      if (exerciseFrequency === null) return "Please select your exercise frequency.";
      if (medicationContraceptive === null) return "Please select an answer for medication or contraception.";
    }

    return null;
  };

  const handleContinue = async () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }

    setError(null);
    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    if (bmi === null) return;

    try {
      await api.put("/profile/setup", { last_period_start_date: localDateString(lastPeriodDate!), date_of_birth: localDateString(dateOfBirth!), menarche_age: Number(menarcheAge), height_cm: (Number(heightFeet) * 12 + Number(heightInches)) * 2.54, weight_kg: Number(weightKg), sleep_hours: Number(sleepHours), stress_level: stressLevel, exercise_frequency: exerciseFrequency, uses_medication_or_contraceptive: medicationContraceptive === 1, cycle_lengths: cycleLengths.map(Number), period_lengths: periodLengths.map(Number) });
      await updateSetupState(true);
      updateProfile({ lastPeriodDate, cycleLengths, periodLengths, dateOfBirth, menarcheAge, heightFeet, heightInches, weightKg, sleepHours, stressLevel, exerciseFrequency, medicationContraceptive });
      router.replace("/setup-complete");
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Unable to save setup. Please try again."); }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setError(null);
    setStep((current) => current - 1);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
          <BackButton onPress={handleBack} />
          <SetupProgress currentStep={step} totalSteps={4} />
          {step === 1 ? <CycleHistoryStep lastPeriodDate={lastPeriodDate} cycleLengths={cycleLengths} onDateChange={setLastPeriodDate} onCycleChange={(index, value) => updateHistory(setCycleLengths, index, value)} onCycleInfoPress={(index) => setInfoDialog({ title: `Previous Cycle ${index + 1}`, message: cycleInfo[index] })} /> : null}
          {step === 2 ? <PeriodHistoryStep values={periodLengths} onChange={(index, value) => updateHistory(setPeriodLengths, index, value)} /> : null}
          {step === 3 ? <PersonalInfoStep dateOfBirth={dateOfBirth} menarcheAge={menarcheAge} heightFeet={heightFeet} heightInches={heightInches} weightKg={weightKg} bmi={bmi} onDateOfBirthChange={setDateOfBirth} onMenarcheChange={setMenarcheAge} onFeetChange={setHeightFeet} onInchesChange={setHeightInches} onWeightChange={setWeightKg} onMenarcheInfoPress={() => setInfoDialog({ title: "Age at Menarche", message: "This is the age when your first period started." })} /> : null}
          {step === 4 ? <LifestyleStep sleepHours={sleepHours} stressLevel={stressLevel} exerciseFrequency={exerciseFrequency} medicationContraceptive={medicationContraceptive} onSleepChange={setSleepHours} onStressChange={setStressLevel} onExerciseChange={setExerciseFrequency} onMedicationChange={setMedicationContraceptive} /> : null}
          {error ? <Text selectable accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          <PrimaryButton title={step === 4 ? "Complete Setup" : "Continue"} onPress={() => void handleContinue()} style={styles.button} />
      </KeyboardAwareScrollView>
      <InfoModal dialog={infoDialog} onClose={() => setInfoDialog(null)} />
    </SafeAreaView>
  );
}

function CycleHistoryStep({ lastPeriodDate, cycleLengths, onDateChange, onCycleChange, onCycleInfoPress }: { lastPeriodDate: Date | null; cycleLengths: string[]; onDateChange: (date: Date) => void; onCycleChange: (index: number, value: string) => void; onCycleInfoPress: (index: number) => void }) {
  return <View style={styles.step}><View><Text style={styles.heading}>When did your last period start?</Text><Text style={styles.subtitle}>We’ll use this to calculate your upcoming cycle.</Text></View><Field label="Last Period Start Date"><CalendarPicker value={lastPeriodDate} onChange={onDateChange} /></Field><View style={styles.sectionDivider} /><View><Text style={styles.sectionTitle}>Your previous cycle lengths</Text><Text style={styles.smallSubtitle}>Don’t remember exact lengths? Approximate values are okay.</Text></View><View style={styles.historyFields}>{cycleLengths.map((value, index) => <HistoryDaysField key={index} label={`Previous Cycle ${index + 1}`} value={value} onChange={(text) => onCycleChange(index, text)} onInfoPress={() => onCycleInfoPress(index)} />)}</View></View>;
}

function PeriodHistoryStep({ values, onChange }: { values: string[]; onChange: (index: number, value: string) => void }) {
  return <View style={styles.step}><View><Text style={styles.heading}>What were the lengths of your last three periods?</Text><Text style={styles.subtitle}>Enter the number of days your period usually lasted. Approximate values are okay.</Text></View><View style={styles.historyFields}>{values.map((value, index) => <HistoryDaysField key={index} label={`Previous Period ${index + 1}`} value={value} onChange={(text) => onChange(index, text)} />)}</View></View>;
}

function PersonalInfoStep({ dateOfBirth, menarcheAge, heightFeet, heightInches, weightKg, bmi, onDateOfBirthChange, onMenarcheChange, onFeetChange, onInchesChange, onWeightChange, onMenarcheInfoPress }: { dateOfBirth: Date | null; menarcheAge: string; heightFeet: string; heightInches: string; weightKg: string; bmi: number | null; onDateOfBirthChange: (value: Date) => void; onMenarcheChange: (value: string) => void; onFeetChange: (value: string) => void; onInchesChange: (value: string) => void; onWeightChange: (value: string) => void; onMenarcheInfoPress: () => void }) {
  const numericValue = (setter: (value: string) => void) => (value: string) => setter(value.replace(/[^0-9.]/g, ""));
  return <View style={styles.step}><View><Text style={styles.heading}>A little more about you</Text><Text style={styles.subtitle}>These details help NAVYA personalize your cycle predictions.</Text></View><Field label="Date of Birth"><CalendarPicker value={dateOfBirth} onChange={onDateOfBirthChange} initialViewDate={birthDateDefault()} title="Select date of birth" /></Field>{dateOfBirth ? <Text style={styles.ageText}>Current age: {calculateAge(dateOfBirth)} years</Text> : null}<Field label="Age at Menarche" infoPress={onMenarcheInfoPress}><TextInput value={menarcheAge} onChangeText={numericValue(onMenarcheChange)} placeholder="e.g. 13" placeholderTextColor="#9B8BA9" keyboardType="number-pad" maxLength={2} style={styles.textInput} /></Field><Field label="Height"><View style={styles.heightRow}><InlineMeasureInput value={heightFeet} onChangeText={numericValue(onFeetChange)} suffix="ft" accessibilityLabel="Height in feet" /><InlineMeasureInput value={heightInches} onChangeText={numericValue(onInchesChange)} suffix="in" accessibilityLabel="Height in inches" /></View></Field><Field label="Weight"><InlineMeasureInput value={weightKg} onChangeText={numericValue(onWeightChange)} suffix="kg" accessibilityLabel="Weight in kilograms" decimal /></Field>{bmi !== null ? <View style={styles.bmiCard}><Text style={styles.bmiLabel}>Your BMI</Text><Text selectable style={styles.bmiValue}>{bmi.toFixed(1)}</Text><Text style={styles.bmiCaption}>Calculated from your height and weight</Text></View> : null}</View>;
}

function LifestyleStep({ sleepHours, stressLevel, exerciseFrequency, medicationContraceptive, onSleepChange, onStressChange, onExerciseChange, onMedicationChange }: { sleepHours: string; stressLevel: number; exerciseFrequency: number | null; medicationContraceptive: number | null; onSleepChange: (value: string) => void; onStressChange: (value: number) => void; onExerciseChange: (value: number) => void; onMedicationChange: (value: number) => void }) {
  return <View style={styles.step}><View><Text style={styles.heading}>Your lifestyle and health</Text><Text style={styles.subtitle}>These details help improve your prediction results.</Text></View><Field label="How many hours do you usually sleep?"><CounterControl value={Number(sleepHours)} min={1} max={24} unit="hours" onChange={(value) => onSleepChange(String(value))} /></Field><View style={styles.stressGroup}><Text style={styles.label}>How would you rate your usual stress level?</Text><Text style={styles.smallSubtitle}>This helps NAVYA understand your cycle pattern better.</Text><StressLevelSelector value={stressLevel} onChange={onStressChange} /></View><OptionGroup label="Exercise Frequency" options={exerciseOptions} selectedValue={exerciseFrequency} onChange={onExerciseChange} /><OptionGroup label="Are you currently taking any medication or using hormonal contraception that may affect your menstrual cycle?" options={[{ label: "Yes", value: 1 }, { label: "No", value: 0 }]} selectedValue={medicationContraceptive} onChange={onMedicationChange} /></View>;
}

function Field({ label, children, infoPress }: { label: string; children: React.ReactNode; infoPress?: () => void }) {
  return <View style={styles.fieldGroup}><View style={styles.labelRow}><Text style={styles.label}>{label}</Text>{infoPress ? <Pressable accessibilityRole="button" accessibilityLabel={`Information about ${label}`} onPress={infoPress} hitSlop={8}><Ionicons name="information-circle-outline" size={20} color="#9469B6" /></Pressable> : null}</View>{children}</View>;
}

function HistoryDaysField({ label, value, onChange, onInfoPress }: { label: string; value: string; onChange: (value: string) => void; onInfoPress?: () => void }) {
  return <Field label={label} infoPress={onInfoPress}><CounterControl value={Number(value)} min={label.includes("Cycle") ? 15 : 1} max={label.includes("Cycle") ? 60 : 14} unit="days" onChange={(next) => onChange(String(next))} /></Field>;
}

function CounterControl({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) { return <View style={styles.counter}><Pressable accessibilityRole="button" disabled={value <= min} onPress={() => onChange(Math.max(min, value - 1))} style={styles.counterButton}><Text style={styles.counterSymbol}>−</Text></Pressable><View style={styles.counterValue}><Text style={styles.counterNumber}>{value}</Text><Text style={styles.counterUnit}>{unit}</Text></View><Pressable accessibilityRole="button" disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))} style={[styles.counterButton, styles.counterPlus]}><Text style={styles.counterSymbol}>+</Text></Pressable></View>; }

function InlineMeasureInput({ value, onChangeText, suffix, accessibilityLabel, decimal = false }: { value: string; onChangeText: (value: string) => void; suffix: string; accessibilityLabel: string; decimal?: boolean }) {
  return <View style={styles.measureInput}><TextInput value={value} onChangeText={onChangeText} placeholder="0" placeholderTextColor="#9B8BA9" keyboardType={decimal ? "decimal-pad" : "number-pad"} style={styles.measureTextInput} accessibilityLabel={accessibilityLabel} /><Text style={styles.measureSuffix}>{suffix}</Text></View>;
}

function OptionGroup({ label, options, selectedValue, onChange }: { label: string; options: { label: string; value: number }[]; selectedValue: number | null; onChange: (value: number) => void }) {
  return <View style={styles.optionGroup}><Text style={styles.label}>{label}</Text><View style={styles.optionsRow}>{options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: selectedValue === option.value }} onPress={() => onChange(option.value)} style={[styles.option, selectedValue === option.value ? styles.selectedOption : null]}><Text style={[styles.optionText, selectedValue === option.value ? styles.selectedOptionText : null]}>{option.label}</Text></Pressable>)}</View></View>;
}

function InfoModal({ dialog, onClose }: { dialog: InfoDialog; onClose: () => void }) {
  return <Modal visible={Boolean(dialog)} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose}><Pressable style={styles.infoCard} onPress={(event) => event.stopPropagation()}><Text style={styles.infoTitle}>{dialog?.title}</Text><Text style={styles.infoText}>{dialog?.message}</Text><Pressable accessibilityRole="button" onPress={onClose} style={styles.infoButton}><Text style={styles.infoButtonText}>Got it</Text></Pressable></Pressable></Pressable></Modal>;
}

function calculateBmi(feetText: string, inchesText: string, weightText: string): number | null {
  const feet = Number(feetText);
  const inches = Number(inchesText);
  const weightKg = Number(weightText);
  if (!feetText || inchesText === "" || !weightText || feet <= 0 || inches < 0 || inches > 11 || weightKg <= 0) return null;
  const heightMeters = (feet * 12 + inches) * 0.0254;
  if (!Number.isFinite(heightMeters) || heightMeters <= 0) return null;
  const bmi = weightKg / (heightMeters * heightMeters);
  return Number.isFinite(bmi) ? Math.round(bmi * 10) / 10 : null;
}

function calculateAge(dateOfBirth: Date | null): number | null { if (!dateOfBirth) return null; const now = new Date(); let age = now.getFullYear() - dateOfBirth.getFullYear(); const hasNotHadBirthday = now.getMonth() < dateOfBirth.getMonth() || (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate()); if (hasNotHadBirthday) age -= 1; return age; }
function birthDateDefault() { const today = new Date(); return localCalendarDate(today.getFullYear() - 25, today.getMonth(), today.getDate()); }

function isEveryValueInRange(values: string[], min: number, max: number) {
  return values.every((value) => Boolean(value) && Number(value) >= min && Number(value) <= max);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 52, paddingBottom: 36 },
  step: { gap: 25, marginTop: 44 },
  heading: { color: Colors.darkPurple, fontSize: 31, lineHeight: 39, fontWeight: "700", letterSpacing: -0.7 },
  subtitle: { marginTop: 8, color: "#A277C5", fontSize: 18, lineHeight: 27 },
  smallSubtitle: { color: "#9469B6", fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: Colors.darkPurple, fontSize: 21, fontWeight: "700" },
  sectionDivider: { height: 1, backgroundColor: "#E7D7F5" },
  fieldGroup: { gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  label: { color: "#4D2C70", fontSize: 17, fontWeight: "500" },
  ageText: { marginTop: -13, color: "#9A71B5", fontSize: 15, fontWeight: "600" },
  historyFields: { gap: 16 },
  daysInput: { height: 62, paddingHorizontal: 20, borderWidth: 1, borderColor: "#E6CFFF", borderRadius: 19, backgroundColor: Colors.white, flexDirection: "row", alignItems: "center" },
  daysTextInput: { flex: 1, color: Colors.darkPurple, fontSize: 18, fontWeight: "600" },
  daysLabel: { color: "#9B79B8", fontSize: 16 },
  counter: { height: 62, paddingHorizontal: 9, alignItems: "center", justifyContent: "space-between", flexDirection: "row", borderWidth: 1, borderColor: "#E6CFFF", borderRadius: 19, backgroundColor: Colors.white },
  counterButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#ECDDFF" },
  counterPlus: { backgroundColor: "#D889F7" },
  counterSymbol: { color: Colors.darkPurple, fontSize: 27, fontWeight: "400" },
  counterValue: { alignItems: "center", flexDirection: "row", gap: 7 },
  counterNumber: { color: Colors.darkPurple, fontSize: 21, fontWeight: "700", fontVariant: ["tabular-nums"] },
  counterUnit: { color: "#9B79B8", fontSize: 16 },
  textInput: { height: 56, paddingHorizontal: 18, borderWidth: 1, borderColor: "#E6CFFF", borderRadius: 19, backgroundColor: Colors.white, color: Colors.darkPurple, fontSize: 17 },
  heightRow: { flexDirection: "row", gap: 12 },
  measureInput: { height: 56, flex: 1, paddingHorizontal: 18, borderWidth: 1, borderColor: "#E6CFFF", borderRadius: 19, backgroundColor: Colors.white, flexDirection: "row", alignItems: "center" },
  measureTextInput: { flex: 1, color: Colors.darkPurple, fontSize: 17 },
  measureSuffix: { color: "#9B79B8", fontSize: 16, fontWeight: "500" },
  bmiCard: { alignItems: "center", paddingVertical: 22, borderRadius: 22, backgroundColor: "#F0E2FF" },
  bmiLabel: { color: "#8350A6", fontSize: 16, fontWeight: "600" },
  bmiValue: { marginTop: 4, color: Colors.darkPurple, fontSize: 42, fontWeight: "700", fontVariant: ["tabular-nums"] },
  bmiCaption: { marginTop: 3, color: "#956FB0", fontSize: 13 },
  stressGroup: { gap: 9 },
  optionGroup: { gap: 10 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: { paddingHorizontal: 17, paddingVertical: 10, borderRadius: 24, backgroundColor: "#ECDDFF" },
  selectedOption: { backgroundColor: "#D889F7" },
  optionText: { color: "#8250A5", fontSize: 15, fontWeight: "500" },
  selectedOptionText: { color: Colors.darkPurple, fontWeight: "600" },
  button: { marginTop: 40 },
  error: { marginTop: 22, color: "#C34164", fontSize: 14, textAlign: "center" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(36, 21, 61, 0.3)" },
  infoCard: { width: "100%", padding: 24, borderRadius: 24, backgroundColor: Colors.white },
  infoTitle: { color: Colors.darkPurple, fontSize: 22, fontWeight: "700" },
  infoText: { marginTop: 12, color: "#795C94", fontSize: 16, lineHeight: 24 },
  infoButton: { alignSelf: "flex-end", marginTop: 22, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18, backgroundColor: "#ECDDFF" },
  infoButtonText: { color: Colors.darkPurple, fontSize: 16, fontWeight: "600" },
});
