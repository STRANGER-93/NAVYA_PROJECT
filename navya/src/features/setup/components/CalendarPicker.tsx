import React, { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Colors from "../../../constants/colors";

type CalendarPickerProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  initialViewDate?: Date;
  title?: string;
  visible?: boolean;
  hideTrigger?: boolean;
  onDismiss?: () => void;
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toDateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPicker({ value, onChange, initialViewDate, title = "Select date", visible: controlledVisible, hideTrigger = false, onDismiss }: CalendarPickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [viewDate, setViewDate] = useState(value ?? initialViewDate ?? new Date());
  const [showMonthYearSelector, setShowMonthYearSelector] = useState(false);
  const selectedKey = value ? toDateKey(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visible = controlledVisible ?? isVisible;
  const closeCalendar = () => { setIsVisible(false); onDismiss?.(); };

  useEffect(() => {
    if (controlledVisible) {
      setViewDate(value ?? initialViewDate ?? new Date());
      setShowMonthYearSelector(false);
    }
  }, [controlledVisible, initialViewDate, value]);

  const days = useMemo(() => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const numberOfDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstDay + 1;
      return day > 0 && day <= numberOfDays ? new Date(viewDate.getFullYear(), viewDate.getMonth(), day) : null;
    });
  }, [viewDate]);

  const openCalendar = () => {
    setViewDate(value ?? initialViewDate ?? new Date());
    setShowMonthYearSelector(false);
    setIsVisible(true);
  };

  return (
    <>
      {!hideTrigger ? <Pressable accessibilityRole="button" accessibilityLabel="Choose date" onPress={openCalendar} style={styles.trigger}>
        <Text style={[styles.triggerText, !value ? styles.placeholder : null]}>
          {value ? formatDate(value) : "Select a date"}
        </Text>
        <Ionicons name="calendar-outline" size={23} color="#8F65B1" />
      </Pressable> : null}

      <Modal animationType="slide" transparent visible={visible} onRequestClose={closeCalendar}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close calendar" onPress={closeCalendar} hitSlop={10}>
                <Ionicons name="close" size={26} color={Colors.darkPurple} />
              </Pressable>
            </View>
            {showMonthYearSelector ? <MonthYearSelector viewDate={viewDate} onChange={setViewDate} onDone={() => setShowMonthYearSelector(false)} /> : <><View style={styles.monthHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} style={styles.monthButton}>
                <Ionicons name="chevron-back" size={22} color={Colors.darkPurple} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Choose month and year" onPress={() => setShowMonthYearSelector(true)}><Text style={styles.monthTitle}>{viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth()} onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} style={styles.monthButton}>
                <Ionicons name="chevron-forward" size={22} color={Colors.darkPurple} />
              </Pressable>
            </View>
            <View style={styles.weekRow}>
              {weekDays.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}
            </View>
            <View style={styles.daysGrid}>
              {days.map((day, index) => {
                if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const disabled = day > today;
                const isSelected = selectedKey === toDateKey(day);
                return (
                  <Pressable key={toDateKey(day)} disabled={disabled} onPress={() => { onChange(day); closeCalendar(); }} style={[styles.dayCell, isSelected ? styles.selectedDay : null]}>
                    <Text style={[styles.dayText, disabled ? styles.disabledDayText : null, isSelected ? styles.selectedDayText : null]}>{day.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View></>}
          </View>
        </View>
      </Modal>
    </>
  );
}

function MonthYearSelector({ viewDate, onChange, onDone }: { viewDate: Date; onChange: (date: Date) => void; onDone: () => void }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1940 + 1 }, (_, index) => currentYear - index);
  return <View><View style={styles.selectorHeader}><Text style={styles.selectorTitle}>Choose month and year</Text><Pressable accessibilityRole="button" onPress={onDone}><Text style={styles.done}>Done</Text></Pressable></View><View style={styles.monthGrid}>{months.map((month, index) => <Pressable key={month} onPress={() => onChange(new Date(viewDate.getFullYear(), index, 1))} style={[styles.monthOption, viewDate.getMonth() === index ? styles.selectedOption : null]}><Text style={[styles.monthOptionText, viewDate.getMonth() === index ? styles.selectedOptionText : null]}>{month.slice(0, 3)}</Text></Pressable>)}</View><Text style={styles.yearLabel}>Year</Text><ScrollView style={styles.yearList} contentContainerStyle={styles.yearGrid} showsVerticalScrollIndicator={false}>{years.map((year) => <Pressable key={year} onPress={() => onChange(new Date(year, viewDate.getMonth(), 1))} style={[styles.yearOption, viewDate.getFullYear() === year ? styles.selectedOption : null]}><Text style={[styles.monthOptionText, viewDate.getFullYear() === year ? styles.selectedOptionText : null]}>{year}</Text></Pressable>)}</ScrollView></View>;
}

const styles = StyleSheet.create({
  trigger: { height: 62, paddingHorizontal: 20, borderWidth: 1, borderColor: "#E6CFFF", borderRadius: 19, backgroundColor: Colors.white, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  triggerText: { color: Colors.darkPurple, fontSize: 17 },
  placeholder: { color: "#9B8BA9" },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(36, 21, 61, 0.3)" },
  sheet: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: Colors.background },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sheetTitle: { color: Colors.darkPurple, fontSize: 22, fontWeight: "700" },
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 17 },
  monthButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#EEDDFF" },
  monthTitle: { color: Colors.darkPurple, fontSize: 18, fontWeight: "600" },
  selectorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  selectorTitle: { color: Colors.darkPurple, fontSize: 18, fontWeight: "700" },
  done: { color: "#A15CC9", fontSize: 16, fontWeight: "700" },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  monthOption: { width: "23%", alignItems: "center", paddingVertical: 10, borderRadius: 14, backgroundColor: "#EEDDFF" },
  monthOptionText: { color: "#76518E", fontSize: 14, fontWeight: "600" },
  selectedOption: { backgroundColor: "#CD7DF5" },
  selectedOptionText: { color: Colors.darkPurple },
  yearLabel: { marginTop: 18, marginBottom: 8, color: "#76518E", fontSize: 15, fontWeight: "700" },
  yearList: { maxHeight: 190 },
  yearGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  yearOption: { width: "23%", alignItems: "center", paddingVertical: 10, borderRadius: 14, backgroundColor: "#EEDDFF" },
  weekRow: { flexDirection: "row", marginBottom: 5 },
  weekDay: { width: "14.285%", color: "#9A79B8", fontSize: 13, fontWeight: "600", textAlign: "center" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 24 },
  dayText: { color: Colors.darkPurple, fontSize: 16 },
  disabledDayText: { color: "#CFC2DB" },
  selectedDay: { backgroundColor: "#CD7DF5" },
  selectedDayText: { color: Colors.darkPurple, fontWeight: "700" },
});
