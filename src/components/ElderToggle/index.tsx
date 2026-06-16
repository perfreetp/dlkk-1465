import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { stopSpeech, canUseSpeech, getSpeechNotAvailableReason } from '@/utils/riskAssess';
import styles from './index.module.scss';

const ElderToggle: React.FC = () => {
  const { elderMode, setElderMode, voiceEnabled, setVoiceEnabled } = useAppStore();
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [speechReason, setSpeechReason] = useState('');

  useEffect(() => {
    const available = canUseSpeech();
    setSpeechAvailable(available);
    if (!available) {
      setSpeechReason(getSpeechNotAvailableReason());
    }
  }, []);

  const showSpeechHelp = () => {
    const reason = speechReason || getSpeechNotAvailableReason() || '请阅读文字内容';
    Taro.showModal({
      title: '🔊 语音播报说明',
      content: reason + '\n\n如急需使用语音播报，建议切换为 Chrome、Edge 或 Safari 浏览器，或升级微信到最新版本。',
      showCancel: false,
      confirmText: '我知道了',
    });
  };

  const handleVoiceToggle = () => {
    if (!speechAvailable) {
      showSpeechHelp();
      return;
    }
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    if (!newValue) {
      stopSpeech();
    }
  };

  return (
    <View className={styles.elderToggle}>
      <View
        className={classnames(styles.toggleItem, elderMode && styles.toggleActive)}
        onClick={() => setElderMode(!elderMode)}
      >
        <Text className={styles.toggleIcon}>🔤</Text>
        <Text className={styles.toggleLabel}>大字模式</Text>
        <View className={classnames(styles.toggleSwitch, elderMode && styles.switchOn)}>
          <View className={styles.toggleDot} />
        </View>
      </View>
      <View className={styles.voiceWrap}>
        <View
          className={classnames(
            styles.toggleItem,
            voiceEnabled && speechAvailable && styles.toggleActive,
            !speechAvailable && styles.toggleDisabled,
          )}
          onClick={handleVoiceToggle}
        >
          <Text className={styles.toggleIcon}>🔊</Text>
          <View className={styles.toggleLabelWrap}>
            <Text className={styles.toggleLabel}>语音播报</Text>
            {!speechAvailable && (
              <Text className={styles.toggleSubLabel}>点击查看原因 →</Text>
            )}
          </View>
          <View
            className={classnames(
              styles.toggleSwitch,
              voiceEnabled && speechAvailable && styles.switchOn,
              !speechAvailable && styles.switchDisabled,
            )}
          >
            <View className={styles.toggleDot} />
          </View>
        </View>
        {!speechAvailable && speechReason && (
          <View className={styles.voiceUnavailable} onClick={showSpeechHelp}>
            <Text className={styles.voiceUnavailableText}>
              {speechReason.length > 40
                ? '⚠️ 语音不可用，点击查看原因 →'
                : `⚠️ ${speechReason}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ElderToggle;
