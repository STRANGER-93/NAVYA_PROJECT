import React, { createContext, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { localDateFromString, localDateString } from "../../utils/localDate";
import { useAuth } from "../auth/AuthContext";

export type ProfileData = { name: string; email: string; lastPeriodDate: Date | null; cycleLengths: string[]; periodLengths: string[]; dateOfBirth: Date | null; menarcheAge: string; heightFeet: string; heightInches: string; weightKg: string; sleepHours: string; stressLevel: number; exerciseFrequency: number | null; medicationContraceptive: number | null; avatarData: string | null };
const defaultProfile: ProfileData = { name: "", email: "", lastPeriodDate: null, cycleLengths: ["28", "28", "28"], periodLengths: ["5", "5", "5"], dateOfBirth: null, menarcheAge: "", heightFeet: "", heightInches: "", weightKg: "", sleepHours: "6", stressLevel: 3, exerciseFrequency: null, medicationContraceptive: null, avatarData: null };
type ProfileContextValue = { profile: ProfileData; updateProfile: (values: Partial<ProfileData>) => Promise<void> };
const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth(); const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  useEffect(() => { if (!session) { setProfile(defaultProfile); return; } void api.get<any>("/profile").then((remote) => setProfile((current) => fromApi(remote, current))).catch(() => undefined); }, [session]);
  const value = useMemo(() => ({ profile, updateProfile: async (values: Partial<ProfileData>) => {
    const previous = profile; const optimistic = { ...profile, ...values }; setProfile(optimistic);
    const feet = values.heightFeet ?? profile.heightFeet; const inches = values.heightInches ?? profile.heightInches;
    try {
      const remote = await api.patch<any>("/profile", {
        ...(values.name !== undefined ? { full_name: values.name } : {}),
        ...(values.avatarData !== undefined ? { avatar_data: values.avatarData } : {}),
        ...(values.dateOfBirth !== undefined ? { date_of_birth: values.dateOfBirth ? localDateString(values.dateOfBirth) : null } : {}),
        ...(values.menarcheAge !== undefined ? { menarche_age: Number(values.menarcheAge) || null } : {}),
        ...((values.heightFeet !== undefined || values.heightInches !== undefined) ? { height_cm: ((Number(feet) * 12 + Number(inches)) * 2.54) || null } : {}),
        ...(values.weightKg !== undefined ? { weight_kg: Number(values.weightKg) || null } : {}),
        ...(values.sleepHours !== undefined ? { sleep_hours: Number(values.sleepHours) || null } : {}),
        ...(values.stressLevel !== undefined ? { stress_level: values.stressLevel } : {}),
        ...(values.exerciseFrequency !== undefined ? { exercise_frequency: values.exerciseFrequency } : {}),
        ...(values.medicationContraceptive !== undefined ? { uses_medication_or_contraceptive: values.medicationContraceptive === 1 } : {}),
      });
      setProfile((current) => fromApi(remote, current));
    } catch (error) { setProfile(previous); throw error; }
  } }), [profile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
function fromApi(remote: any, current: ProfileData): ProfileData { const totalInches = (Number(remote.height_cm) || 0) / 2.54; return { ...current, name: remote.full_name ?? current.name, email: remote.email ?? current.email, dateOfBirth: remote.date_of_birth ? localDateFromString(remote.date_of_birth) : null, menarcheAge: remote.menarche_age?.toString() ?? "", heightFeet: totalInches ? Math.floor(totalInches / 12).toString() : "", heightInches: totalInches ? Math.round(totalInches % 12).toString() : "", weightKg: remote.weight_kg?.toString() ?? "", sleepHours: remote.sleep_hours?.toString() ?? current.sleepHours, stressLevel: remote.stress_level ?? current.stressLevel, exerciseFrequency: remote.exercise_frequency ?? null, medicationContraceptive: remote.uses_medication_or_contraceptive === null ? null : remote.uses_medication_or_contraceptive ? 1 : 0, avatarData: remote.avatar_data ?? null }; }
export function useProfile() { const context = React.use(ProfileContext); if (!context) throw new Error("useProfile must be used within ProfileProvider."); return context; }
