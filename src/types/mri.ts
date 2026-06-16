export type RiskLevel = 'high' | 'medium' | 'low';

export type RiskResult = 'cannot' | 'askDoctor' | 'canContinue';

export interface QuestionOption {
  label: string;
  value: string;
  riskLevel: RiskLevel;
  detail: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  options: QuestionOption[];
  category: string;
  icon: string;
}

export interface Answer {
  questionId: string;
  selectedValue: string;
  riskLevel: RiskLevel;
}

export interface FamilyInfo {
  patientName: string;
  patientPhone: string;
  familyName: string;
  familyPhone: string;
  relationship: string;
}

export interface UploadFile {
  id: string;
  type: 'film' | 'summary' | 'implant' | 'other';
  fileName: string;
  filePath: string;
  thumbPath?: string;
  uploadTime: string;
  size: number;
}

export interface AppointmentInfo {
  id: string;
  patientName: string;
  examType: string;
  examDate: string;
  examTime: string;
  department: string;
  location: string;
  checkInCode: string;
  checklist: ChecklistItem[];
  timeline: TimelineItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: 'document' | 'prepare' | 'metal' | 'diet';
}

export interface TimelineItem {
  time: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface FeedbackItem {
  id: string;
  question: string;
  type: 'rating' | 'choice';
  options?: string[];
}

export interface PatientType {
  type: 'normal' | 'child' | 'pregnant' | 'postSurgery' | 'elderly';
  label: string;
  reminders: string[];
}

export interface EnhanceMRIInfo {
  bloodTestRequired: boolean;
  dietRequirement: string;
  companionRequired: boolean;
  contrastType: string;
}

export interface MetalReminderItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  handled: boolean;
}
