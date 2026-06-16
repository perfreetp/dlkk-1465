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

export const speakText = (text: string): void => {
  try {
    const plugin = requirePlugin === undefined ? null : null;
    console.info('[RiskAssess]', '语音播报请求:', text);
  } catch (e) {
    console.error('[RiskAssess]', '语音播报失败:', e);
  }
};
