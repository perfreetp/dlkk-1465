import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Answer, RiskResult, FamilyInfo, UploadFile, MetalReminderItem } from '@/types/mri';

const STORAGE_KEYS = {
  ANSWERS: 'mri_answers',
  ELDER_MODE: 'mri_elder_mode',
  VOICE_ENABLED: 'mri_voice_enabled',
  FAMILY_INFO: 'mri_family_info',
  PATIENT_TYPE: 'mri_patient_type',
  UPLOAD_FILES: 'mri_upload_files',
  CHECKLIST_CHECKED: 'mri_checklist_checked',
  METAL_HANDLED: 'mri_metal_handled',
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data) {
      return JSON.parse(data) as T;
    }
  } catch (e) {
    console.error('[Store]', `读取 ${key} 失败:`, e);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.error('[Store]', `保存 ${key} 失败:`, e);
  }
};

const defaultFamilyInfo: FamilyInfo = {
  patientName: '',
  patientPhone: '',
  familyName: '',
  familyPhone: '',
  relationship: '',
};

const defaultMetalReminders: MetalReminderItem[] = [
  { id: 'm1', icon: '💍', title: '戒指、项链、手镯', desc: '所有金属饰品必须取下', handled: false },
  { id: 'm2', icon: '🔔', title: '耳环、鼻环、舌钉', desc: '包括非金属的装饰也建议取下', handled: false },
  { id: 'm3', icon: '🦷', title: '可拆卸义齿', desc: '检查前务必取下', handled: false },
  { id: 'm4', icon: '📌', title: '发夹、别针', desc: '包括金属材质的发饰', handled: false },
  { id: 'm5', icon: '👗', title: '内衣钢圈', desc: '检查时需更换检查服', handled: false },
  { id: 'm6', icon: '📱', title: '手机、钥匙、硬币', desc: '不能带入检查室', handled: false },
  { id: 'm7', icon: '💊', title: '药物贴片', desc: '部分药物贴片含金属，需告知医生', handled: false },
  { id: 'm8', icon: '👁️', title: '化妆、指甲油', desc: '部分化妆品含金属微粒', handled: false },
];

interface AppState {
  answers: Answer[];
  elderMode: boolean;
  voiceEnabled: boolean;
  familyInfo: FamilyInfo;
  patientType: string;
  appointmentId: string;
  uploadFiles: UploadFile[];
  metalReminders: MetalReminderItem[];
  checklistChecked: string[];

  setAnswer: (answer: Answer) => void;
  setElderMode: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setFamilyInfo: (info: FamilyInfo) => void;
  setPatientType: (type: string) => void;
  setAppointmentId: (id: string) => void;
  getHighestRisk: () => RiskResult;
  resetAnswers: () => void;

  addUploadFile: (file: UploadFile) => void;
  removeUploadFile: (id: string) => void;
  getFilesByType: (type: string) => UploadFile[];

  toggleMetalReminder: (id: string) => void;
  getMetalHandledCount: () => number;

  toggleChecklistItem: (id: string) => void;
  isChecklistChecked: (id: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  answers: loadFromStorage<Answer[]>(STORAGE_KEYS.ANSWERS, []),
  elderMode: loadFromStorage<boolean>(STORAGE_KEYS.ELDER_MODE, false),
  voiceEnabled: loadFromStorage<boolean>(STORAGE_KEYS.VOICE_ENABLED, false),
  familyInfo: loadFromStorage<FamilyInfo>(STORAGE_KEYS.FAMILY_INFO, defaultFamilyInfo),
  patientType: loadFromStorage<string>(STORAGE_KEYS.PATIENT_TYPE, 'normal'),
  appointmentId: '',
  uploadFiles: loadFromStorage<UploadFile[]>(STORAGE_KEYS.UPLOAD_FILES, []),
  metalReminders: (() => {
    const handled = loadFromStorage<string[]>(STORAGE_KEYS.METAL_HANDLED, []);
    return defaultMetalReminders.map((item) => ({
      ...item,
      handled: handled.includes(item.id),
    }));
  })(),
  checklistChecked: loadFromStorage<string[]>(STORAGE_KEYS.CHECKLIST_CHECKED, []),

  setAnswer: (answer) =>
    set((state) => {
      const filtered = state.answers.filter((a) => a.questionId !== answer.questionId);
      const newAnswers = [...filtered, answer];
      saveToStorage(STORAGE_KEYS.ANSWERS, newAnswers);
      return { answers: newAnswers };
    }),

  setElderMode: (enabled) => {
    saveToStorage(STORAGE_KEYS.ELDER_MODE, enabled);
    set({ elderMode: enabled });
  },

  setVoiceEnabled: (enabled) => {
    saveToStorage(STORAGE_KEYS.VOICE_ENABLED, enabled);
    set({ voiceEnabled: enabled });
  },

  setFamilyInfo: (info) => {
    saveToStorage(STORAGE_KEYS.FAMILY_INFO, info);
    set({ familyInfo: info });
  },

  setPatientType: (type) => {
    saveToStorage(STORAGE_KEYS.PATIENT_TYPE, type);
    set({ patientType: type });
  },

  setAppointmentId: (id) => set({ appointmentId: id }),

  getHighestRisk: () => {
    const { answers } = get();
    if (answers.some((a) => a.riskLevel === 'high')) return 'cannot';
    if (answers.some((a) => a.riskLevel === 'medium')) return 'askDoctor';
    return 'canContinue';
  },

  resetAnswers: () => {
    saveToStorage(STORAGE_KEYS.ANSWERS, []);
    saveToStorage(STORAGE_KEYS.PATIENT_TYPE, 'normal');
    set({ answers: [], patientType: 'normal' });
  },

  addUploadFile: (file) =>
    set((state) => {
      const newFiles = [...state.uploadFiles, file];
      saveToStorage(STORAGE_KEYS.UPLOAD_FILES, newFiles);
      return { uploadFiles: newFiles };
    }),

  removeUploadFile: (id) =>
    set((state) => {
      const newFiles = state.uploadFiles.filter((f) => f.id !== id);
      saveToStorage(STORAGE_KEYS.UPLOAD_FILES, newFiles);
      return { uploadFiles: newFiles };
    }),

  getFilesByType: (type) => {
    return get().uploadFiles.filter((f) => f.type === type);
  },

  toggleMetalReminder: (id) =>
    set((state) => {
      const newReminders = state.metalReminders.map((item) =>
        item.id === id ? { ...item, handled: !item.handled } : item
      );
      const handledIds = newReminders.filter((r) => r.handled).map((r) => r.id);
      saveToStorage(STORAGE_KEYS.METAL_HANDLED, handledIds);
      return { metalReminders: newReminders };
    }),

  getMetalHandledCount: () => {
    return get().metalReminders.filter((r) => r.handled).length;
  },

  toggleChecklistItem: (id) =>
    set((state) => {
      let newChecked: string[];
      if (state.checklistChecked.includes(id)) {
        newChecked = state.checklistChecked.filter((cid) => cid !== id);
      } else {
        newChecked = [...state.checklistChecked, id];
      }
      saveToStorage(STORAGE_KEYS.CHECKLIST_CHECKED, newChecked);
      return { checklistChecked: newChecked };
    }),

  isChecklistChecked: (id) => {
    return get().checklistChecked.includes(id);
  },
}));
