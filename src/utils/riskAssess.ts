import type { RiskLevel, RiskResult } from '@/types/mri';

export const riskLevelToResult = (level: RiskLevel): RiskResult => {
  if (level === 'high') return 'cannot';
  if (level === 'medium') return 'askDoctor';
  return 'canContinue';
};

export const riskResultLabel = (result: RiskResult): string => {
  switch (result) {
    case 'cannot':
      return '现在不能约';
    case 'askDoctor':
      return '先问医生';
    case 'canContinue':
      return '可继续下一步';
  }
};

export const riskResultColor = (result: RiskResult): string => {
  switch (result) {
    case 'cannot':
      return '#D94E4E';
    case 'askDoctor':
      return '#E8A030';
    case 'canContinue':
      return '#2BA868';
  }
};

export const riskResultIcon = (result: RiskResult): string => {
  switch (result) {
    case 'cannot':
      return '⛔';
    case 'askDoctor':
      return '⚠️';
    case 'canContinue':
      return '✅';
  }
};

export const riskResultDescription = (result: RiskResult): string => {
  switch (result) {
    case 'cannot':
      return '您存在MRI检查禁忌，目前不能预约。请先咨询主治医生，确认是否可以进行检查。';
    case 'askDoctor':
      return '您的情况需要医生进一步评估，建议先联系主治医生或影像科确认是否可以检查。';
    case 'canContinue':
      return '您目前没有发现MRI检查禁忌，可以继续预约流程。';
  }
};

export const riskResultSpeakText = (result: RiskResult): string => {
  switch (result) {
    case 'cannot':
      return '检测结果：现在不能约。您存在MRI检查禁忌，目前不能预约。请先咨询主治医生，确认是否可以进行检查。';
    case 'askDoctor':
      return '检测结果：先问医生。您的情况需要医生进一步评估，建议先联系主治医生或影像科确认是否可以检查。';
    case 'canContinue':
      return '检测结果：可继续下一步。您目前没有发现MRI检查禁忌，可以继续预约流程。';
  }
};

let isSpeaking = false;

export const canUseSpeech = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof window.speechSynthesis === 'object' && window.speechSynthesis !== null;
};

export const speakText = (text: string): boolean => {
  try {
    if (!canUseSpeech()) {
      console.info('[Speech]', '当前环境不支持语音合成，无法播报');
      return false;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      isSpeaking = true;
      console.info('[Speech]', '开始播报');
    };

    utterance.onend = () => {
      isSpeaking = false;
      console.info('[Speech]', '播报结束');
    };

    utterance.onerror = (e) => {
      isSpeaking = false;
      console.error('[Speech]', '播报出错:', e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.error('[Speech]', '语音播报失败:', e);
    return false;
  }
};

export const stopSpeech = (): void => {
  try {
    if (canUseSpeech()) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      console.info('[Speech]', '已停止播报');
    }
  } catch (e) {
    console.error('[Speech]', '停止播报失败:', e);
  }
};

export const isSpeechSpeaking = (): boolean => {
  return isSpeaking;
};
