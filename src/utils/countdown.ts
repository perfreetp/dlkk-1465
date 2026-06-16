export interface CountdownInfo {
  diffMs: number;
  level: 'far' | 'oneDay' | 'twoHour' | 'arrived' | 'passed';
  label: string;
  countdownText: string;
  urgentText: string;
  speakText: string;
}

export const getCountdownInfo = (examDate: string, examTime: string): CountdownInfo => {
  const target = new Date(`${examDate}T${examTime}:00`).getTime();
  const now = Date.now();
  const diff = target - now;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff <= 0) {
    const pastHours = Math.floor(absDiff / (1000 * 60 * 60));
    const pastMins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    let pastText = pastHours > 0 ? '已过' + pastHours + '小时' + pastMins + '分钟' : '已过' + pastMins + '分钟';
    const isPassed = diff < -1000 * 60 * 60 * 6;

    return {
      diffMs: diff,
      level: isPassed ? 'passed' : 'arrived',
      label: isPassed ? '已过检查时间' : '检查进行中',
      countdownText: pastText,
      urgentText: isPassed ? '检查已结束，请前往取报告' : '请尽快前往检查室',
      speakText: '提醒：检查时间已到，' + (isPassed ? '检查已结束，请前往取报告' : '请尽快前往检查室签到。'),
    };
  }

  if (diff <= 1000 * 60 * 60 * 2) {
    const timeTextShort = hours > 0 ? hours + '小时' + minutes + '分钟' : minutes + '分钟';
    const timeTextLong = hours > 0 ? hours + '小时' + minutes + '分钟' : minutes + '分钟';

    return {
      diffMs: diff,
      level: 'twoHour',
      label: '⚠️ 临近检查',
      countdownText: '还有' + (hours > 0 ? hours + '小时' : '') + minutes + '分钟',
      urgentText: '仅剩' + timeTextShort + '，请立即出发前往医院！',
      speakText: '紧急提醒：离检查还有' + timeTextLong + '，请立即出发前往医院，记得带好身份证医保卡！',
    };
  }

  if (diff <= 1000 * 60 * 60 * 24) {
    return {
      diffMs: diff,
      level: 'oneDay',
      label: '⏰ 明天检查',
      countdownText: '还有' + hours + '小时' + minutes + '分钟',
      urgentText: '明天就要检查了，请今晚提前准备好所有资料和证件！',
      speakText: '提醒：离明天检查还有' + hours + '小时' + minutes + '分钟。请今晚提前准备好身份证、医保卡、既往资料，明早记得取下所有金属物品！',
    };
  }

  const moreDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  return {
    diffMs: diff,
    level: 'far',
    label: '✅ 已预约',
    countdownText: '还有' + moreDays + '天' + hours + '小时',
    urgentText: '',
    speakText: '您的MRI检查预约已确认，还有' + moreDays + '天' + hours + '小时。请提前准备好资料，检查当天取下金属饰品。',
  };
};

export const getCountdownLevelClass = (level: CountdownInfo['level']): string => {
  const map: Record<CountdownInfo['level'], string> = {
    far: 'levelFar',
    oneDay: 'levelOneDay',
    twoHour: 'levelTwoHour',
    arrived: 'levelArrived',
    passed: 'levelPassed',
  };
  return map[level];
};
