import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StepCardProps {
  step: number;
  title: string;
  description?: string;
  icon?: string;
  active?: boolean;
  completed?: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description, icon, active, completed }) => {
  return (
    <View className={classnames(styles.stepCard, active && styles.active, completed && styles.completed)}>
      <View className={styles.stepLeft}>
        <View className={classnames(styles.stepBadge, completed && styles.stepBadgeDone)}>
          {completed ? '✓' : step}
        </View>
        <View className={styles.stepLine} />
      </View>
      <View className={styles.stepContent}>
        <View className={styles.stepTitleRow}>
          {icon && <Text className={styles.stepIcon}>{icon}</Text>}
          <Text className={styles.stepTitle}>{title}</Text>
        </View>
        {description && <Text className={styles.stepDesc}>{description}</Text>}
      </View>
    </View>
  );
};

export default StepCard;
