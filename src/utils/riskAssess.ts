import Taro from '@tarojs/taro';
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
let audioContext: any = null;
let speechEngine: 'webspeech' | 'wechatSI' | null = null;

const getSpeechEngine = (): 'webspeech' | 'wechatSI' | null => {
  if (speechEngine !== null) return speechEngine;

  if (typeof window !== 'undefined' && typeof window.speechSynthesis === 'object' && window.speechSynthesis !== null) {
    speechEngine = 'webspeech';
    console.info('[Speech]', '检测到 Web Speech API');
    return 'webspeech';
  }

  try {
    const env = Taro.getEnv();
    if (env === Taro.ENV_TYPE.WEAPP) {
      try {
        const plugin = (globalThis as any).requirePlugin?.('WechatSI');
        if (plugin && typeof plugin.textToSpeech === 'function') {
          speechEngine = 'wechatSI';
          console.info('[Speech]', '检测到微信同声传译插件');
          return 'wechatSI';
        }
      } catch (e) {
        console.info('[Speech]', '微信同声传译插件未安装或不可用:', e);
      }
    }
  } catch (e) {
    console.info('[Speech]', '环境检测失败:', e);
  }

  speechEngine = null;
  console.info('[Speech]', '当前环境不支持语音播报');
  return null;
};

export const canUseSpeech = (): boolean => {
  return getSpeechEngine() !== null;
};

export const getSpeechNotAvailableReason = (): string => {
  const engine = getSpeechEngine();
  if (engine) return '';

  try {
    const env = Taro.getEnv();
    if (env === Taro.ENV_TYPE.WEAPP) {
      return '当前小程序未配置语音播报插件，请阅读文字内容';
    }
    if (env === Taro.ENV_TYPE.WEB) {
      return '当前浏览器不支持语音播报，请升级浏览器或阅读文字内容';
    }
  } catch (e) {
    // ignore
  }
  return '当前环境不支持语音播报，请阅读文字内容';
};

const stopWebSpeech = (): void => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    console.error('[Speech]', '停止 Web Speech 失败:', e);
  }
};

const stopWechatSI = (): void => {
  try {
    if (audioContext && typeof audioContext.stop === 'function') {
      audioContext.stop();
    }
    if (audioContext && typeof audioContext.destroy === 'function') {
      audioContext.destroy();
    }
  } catch (e) {
    console.error('[Speech]', '停止微信语音失败:', e);
  } finally {
    audioContext = null;
  }
};

export const speakText = (text: string): boolean => {
  try {
    const engine = getSpeechEngine();
    if (!engine) {
      console.info('[Speech]', '不支持语音播报，跳过');
      return false;
    }

    stopSpeech();

    if (engine === 'webspeech') {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        isSpeaking = true;
        console.info('[Speech]', 'Web Speech 开始播报');
      };

      utterance.onend = () => {
        isSpeaking = false;
        console.info('[Speech]', 'Web Speech 播报结束');
      };

      utterance.onerror = (e) => {
        isSpeaking = false;
        console.error('[Speech]', 'Web Speech 播报出错:', e);
      };

      window.speechSynthesis.speak(utterance);
      return true;
    }

    if (engine === 'wechatSI') {
      try {
        const plugin = (globalThis as any).requirePlugin('WechatSI');
        plugin.textToSpeech({
          lang: 'zh_CN',
          tts: true,
          content: text,
          success: (res: any) => {
            console.info('[Speech]', '微信TTS合成成功:', res.filename);
            try {
              audioContext = Taro.createInnerAudioContext();
              audioContext.src = res.filename;
              audioContext.onPlay(() => {
                isSpeaking = true;
                console.info('[Speech]', '微信语音开始播放');
              });
              audioContext.onEnded(() => {
                isSpeaking = false;
                console.info('[Speech]', '微信语音播放结束');
              });
              audioContext.onError((e: any) => {
                isSpeaking = false;
                console.error('[Speech]', '微信语音播放错误:', e);
              });
              audioContext.play();
            } catch (e) {
              console.error('[Speech]', '创建音频上下文失败:', e);
            }
          },
          fail: (err: any) => {
            console.error('[Speech]', '微信TTS合成失败:', err);
          },
        });
        return true;
      } catch (e) {
        console.error('[Speech]', '微信同声传译调用失败:', e);
        return false;
      }
    }

    return false;
  } catch (e) {
    console.error('[Speech]', '语音播报失败:', e);
    return false;
  }
};

export const stopSpeech = (): void => {
  try {
    const engine = getSpeechEngine();
    if (!engine) return;

    if (engine === 'webspeech') {
      stopWebSpeech();
    } else if (engine === 'wechatSI') {
      stopWechatSI();
    }

    isSpeaking = false;
    console.info('[Speech]', '已停止播报');
  } catch (e) {
    console.error('[Speech]', '停止播报失败:', e);
  }
};

export const isSpeechSpeaking = (): boolean => {
  return isSpeaking;
};
