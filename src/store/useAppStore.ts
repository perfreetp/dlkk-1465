import { create } from 'zustand';
import type { Answer, RiskResult, FamilyInfo } from '@/types/mri';

interface AppState {
  answers: Answer[];
  elderMode: boolean;
  voiceEnabled: boolean;
  familyInfo: FamilyInfo;
  patientType: string;
  appointmentId: string;
  setAnswer: (answer: Answer) => void;
  setElderMode: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setFamilyInfo: (info: FamilyInfo) => void;
  setPatientType: (type: string) => void;
  setAppointmentId: (id: string) => void;
  getHighestRisk: () => RiskResult;
  resetAnswers: () => void;
}

const defaultFamilyInfo: FamilyInfo = {
  patientName: '',
  patientPhone: '',
  familyName: '',
  familyPhone: '',
  relationship: '',
};

export const useAppStore = create<AppState>((set, get) => ({
  answers: [],
  elderMode: false,
  voiceEnabled: false,
  familyInfo: defaultFamilyInfo,
  patientType: 'normal',
  appointmentId: '',
  setAnswer: (answer) =>
    set((state) => {
      const filtered = state.answers.filter((a) => a.questionId !== answer.questionId);
      return { answers: [...filtered, answer] };
    }),
  setElderMode: (enabled) => set({ elderMode: enabled }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setFamilyInfo: (info) => set({ familyInfo: info }),
  setPatientType: (type) => set({ patientType: type }),
  setAppointmentId: (id) => set({ appointmentId: id }),
  getHighestRisk: () => {
    const { answers } = get();
    if (answers.some((a) => a.riskLevel === 'high')) return 'cannot';
    if (answers.some((a) => a.riskLevel === 'medium')) return 'askDoctor';
    return 'canContinue';
  },
  resetAnswers: () => set({ answers: [] }),
}));
