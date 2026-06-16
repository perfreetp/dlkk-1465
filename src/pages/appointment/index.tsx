import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { appointmentData } from '@/data/questions';
import type { ChecklistItem } from '@/types/mri';
import styles from './index.module.scss';

const AppointmentPage = () => {
  const { elderMode } = useAppStore();
  const [checklist, setChecklist] = useState<ChecklistItem[]>(appointmentData.checklist);
  const [activeSection, setActiveSection] = useState<'detail' | 'checklist' | 'timeline'>('detail');

  const handleToggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const checkedCount = checklist.filter((c) => c.checked).length;
  const allChecked = checkedCount === checklist.length;

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>预约确认</Text>
        <Text className={styles.headerSubtitle}>您的MRI检查预约信息</Text>
      </View>

      <View className={styles.codeCard}>
        <Text className={styles.codeLabel}>核验码</Text>
        <Text className={styles.codeValue}>{appointmentData.checkInCode}</Text>
        <Text className={styles.codeTip}>到院后出示此码完成签到</Text>
      </View>

      <View className={styles.tabRow}>
        {(['detail', 'checklist', 'timeline'] as const).map((tab) => (
          <View
            key={tab}
            className={classnames(styles.tabItem, activeSection === tab && styles.tabActive)}
            onClick={() => setActiveSection(tab)}
          >
            <Text className={styles.tabLabel}>
              {tab === 'detail' ? '预约详情' : tab === 'checklist' ? '检查清单' : '时间轴'}
            </Text>
          </View>
        ))}
      </View>

      {activeSection === 'detail' && (
        <View className={styles.detailSection}>
          <View className={styles.detailCard}>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>检查类型</Text>
              <Text className={styles.detailValue}>{appointmentData.examType}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>检查日期</Text>
              <Text className={styles.detailValue}>{appointmentData.examDate}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>检查时间</Text>
              <Text className={styles.detailValue}>{appointmentData.examTime}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>检查科室</Text>
              <Text className={styles.detailValue}>{appointmentData.department}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>检查地点</Text>
              <Text className={styles.detailValue}>{appointmentData.location}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>预约编号</Text>
              <Text className={styles.detailValue}>{appointmentData.id}</Text>
            </View>
          </View>

          <View className={styles.remindCard}>
            <Text className={styles.remindTitle}>🔔 检查前提醒</Text>
            <Text className={styles.remindText}>• 检查当天请穿着无金属扣的宽松衣物</Text>
            <Text className={styles.remindText}>• 提前取下所有金属饰品、发夹、内衣钢圈</Text>
            <Text className={styles.remindText}>• 如有可拆卸义齿，检查前请取下</Text>
            <Text className={styles.remindText}>• 不要化妆、涂指甲油或使用发胶</Text>
            <Text className={styles.remindText}>• 增强MRI检查前4小时禁食</Text>
            <Text className={styles.remindText}>• 携带身份证、医保卡和既往资料</Text>
          </View>
        </View>
      )}

      {activeSection === 'checklist' && (
        <View className={styles.checklistSection}>
          <View className={styles.checklistProgress}>
            <Text className={styles.checklistProgressText}>已确认 {checkedCount}/{checklist.length} 项</Text>
            <View className={styles.checklistProgressBar}>
              <View
                className={styles.checklistProgressFill}
                style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
              />
            </View>
          </View>

          <View className={styles.checklistItems}>
            {checklist.map((item) => (
              <View
                key={item.id}
                className={classnames(styles.checkItem, item.checked && styles.checkItemDone)}
                onClick={() => handleToggleCheck(item.id)}
              >
                <View className={classnames(styles.checkBox, item.checked && styles.checkBoxChecked)}>
                  {item.checked && <Text className={styles.checkBoxIcon}>✓</Text>}
                </View>
                <Text className={classnames(styles.checkText, item.checked && styles.checkTextDone)}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {allChecked && (
            <View className={styles.allDoneTip}>
              <Text className={styles.allDoneTipText}>🎉 全部确认！您已做好检查准备</Text>
            </View>
          )}
        </View>
      )}

      {activeSection === 'timeline' && (
        <View className={styles.timelineSection}>
          <View className={styles.timelineDate}>
            <Text className={styles.timelineDateText}>📅 {appointmentData.examDate}</Text>
          </View>
          {appointmentData.timeline.map((item, idx) => (
            <View key={idx} className={styles.timelineItem}>
              <View className={styles.timelineLeft}>
                <View className={classnames(styles.timelineDot, item.completed && styles.timelineDotDone)} />
                {idx < appointmentData.timeline.length - 1 && <View className={styles.timelineLine} />}
              </View>
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTime}>{item.time}</Text>
                <Text className={styles.timelineTitle}>{item.title}</Text>
                <Text className={styles.timelineDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className={styles.bottomAction}>
        <View
          className={styles.btnPrimary}
          onClick={() => Taro.switchTab({ url: '/pages/guide/index' })}
        >
          <Text className={styles.btnPrimaryText}>查看到院指引</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default AppointmentPage;
