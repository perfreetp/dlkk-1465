import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import styles from './index.module.scss';

const ElderToggle: React.FC = () => {
  const { elderMode, setElderMode, voiceEnabled, setVoiceEnabled } = useAppStore();

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
      <View
        className={classnames(styles.toggleItem, voiceEnabled && styles.toggleActive)}
        onClick={() => setVoiceEnabled(!voiceEnabled)}
      >
        <Text className={styles.toggleIcon}>🔊</Text>
        <Text className={styles.toggleLabel}>语音播报</Text>
        <View className={classnames(styles.toggleSwitch, voiceEnabled && styles.switchOn)}>
          <View className={styles.toggleDot} />
        </View>
      </View>
    </View>
  );
};

export default ElderToggle;
