import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface RiskBadgeProps {
  result: 'cannot' | 'askDoctor' | 'canContinue';
  showIcon?: boolean;
  size?: 'normal' | 'large';
}

const resultConfig = {
  cannot: { label: '现在不能约', icon: '⛔', color: '#D94E4E' },
  askDoctor: { label: '先问医生', icon: '⚠️', color: '#E8A030' },
  canContinue: { label: '可继续下一步', icon: '✅', color: '#2BA868' },
};

const RiskBadge: React.FC<RiskBadgeProps> = ({ result, showIcon = true, size = 'normal' }) => {
  const config = resultConfig[result];
  return (
    <View
      className={classnames(styles.riskBadge, size === 'large' && styles.riskBadgeLarge)}
      style={{ backgroundColor: `${config.color}15`, borderColor: `${config.color}40` }}
    >
      {showIcon && <Text className={styles.riskIcon}>{config.icon}</Text>}
      <Text className={classnames(styles.riskLabel, size === 'large' && styles.riskLabelLarge)} style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
};

export default RiskBadge;
