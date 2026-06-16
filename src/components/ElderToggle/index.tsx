import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
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

  const handleVoiceToggle = () => {
    if (!speechAvailable) return;
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
          <Text className={styles.toggleLabel}>语音播报</Text>
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
          <View className={styles.voiceUnavailable}>
            <Text className={styles.voiceUnavailableText}>⚠️ {speechReason}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ElderToggle;
