import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { appointmentData, checklistData, timelineData } from '@/data/questions';
import { speakText, stopSpeech, canUseSpeech } from '@/utils/riskAssess';
import { getCountdownInfo, getCountdownLevelClass } from '@/utils/countdown';
import ElderToggle from '@/components/ElderToggle';
import type { ChecklistItem } from '@/types/mri';
import styles from './index.module.scss';

const categoryLabels: Record<string, string> = {
  document: '📄 证件资料',
  diet: '🍽️ 饮食要求',
  prepare: '👗 准备事项',
  metal: '💍 金属物品',
};

const AppointmentPage = () => {
  const { elderMode, voiceEnabled, metalReminders, toggleMetalReminder, getMetalHandledCount, toggleChecklistItem, isChecklistChecked, checklistChecked } = useAppStore();
  const [activeSection, setActiveSection] = useState<'detail' | 'checklist' | 'metal'>('detail');
  const [tick, setTick] = useState(0);
  const [reminderShown, setReminderShown] = useState(false);

  const speechOk = canUseSpeech();

  const countdownInfo = useMemo(() => {
    setTick;
    return getCountdownInfo(appointmentData.examDate, appointmentData.examTime);
  }, [tick, appointmentData.examDate, appointmentData.examTime]);

  const checklistWithStatus: ChecklistItem[] = checklistData.map((item) => ({
    ...item,
    checked: isChecklistChecked(item.id),
  }));

  const checkedCount = checklistWithStatus.filter((c) => c.checked).length;
  const allChecked = checkedCount === checklistWithStatus.length;

  const metalTotal = metalReminders.length;
  const metalHandled = getMetalHandledCount();

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (voiceEnabled && speechOk && !reminderShown) {
      const shouldSpeak = countdownInfo.level === 'oneDay' || countdownInfo.level === 'twoHour' || countdownInfo.level === 'arrived';
      if (shouldSpeak) {
        setReminderShown(true);
        speakText(countdownInfo.speakText);
      }
    }
    return () => {
      if (!voiceEnabled) {
        stopSpeech();
      }
    };
  }, [voiceEnabled, speechOk, countdownInfo, reminderShown]);

  const handleSectionChange = (section: 'detail' | 'checklist' | 'metal') => {
    setActiveSection(section);
    if (voiceEnabled && speechOk) {
      if (section === 'detail') {
        speakText(`预约详情。${countdownInfo.countdownText}。检查时间${appointmentData.examDate}${appointmentData.examTime}。地点：${appointmentData.location}`);
      } else if (section === 'checklist') {
        speakText(`检查清单。已确认${checkedCount}项，共${checklistWithStatus.length}项。请逐项核对。`);
      } else if (section === 'metal') {
        speakText(`金属物品提醒。已处理${metalHandled}项，共${metalTotal}项。请提前取下所有金属物品。`);
      }
    }
  };

  const handleReplayCountdown = () => {
    if (voiceEnabled && speechOk) {
      speakText(countdownInfo.speakText);
    } else if (!speechOk) {
      Taro.showToast({ title: '当前环境不支持语音', icon: 'none' });
    }
  };

  const handleToggleCheck = (id: string) => {
    toggleChecklistItem(id);
  };

  const handleToggleMetal = (id: string) => {
    toggleMetalReminder(id);
  };

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>预约确认</Text>
        <Text className={styles.headerSubtitle}>您的MRI检查预约信息</Text>
      </View>

      <View className={styles.toggleWrap}>
        <ElderToggle />
      </View>

      <View
        className={classnames(
          styles.countdownCard,
          styles[getCountdownLevelClass(countdownInfo.level)],
        )}
        onClick={handleReplayCountdown}
      >
        <View className={styles.countdownLeft}>
          <Text className={styles.countdownIcon}>
            {countdownInfo.level === 'twoHour' ? '🚨' : countdownInfo.level === 'oneDay' ? '⏰' : countdownInfo.level === 'arrived' ? '🏥' : countdownInfo.level === 'passed' ? '📌' : '✅'}
          </Text>
          <View className={styles.countdownTextWrap}>
            <Text className={styles.countdownLabel}>{countdownInfo.label}</Text>
            <Text className={styles.countdownValue}>{countdownInfo.countdownText}</Text>
            {countdownInfo.urgentText && (
              <Text className={styles.countdownUrgent}>{countdownInfo.urgentText}</Text>
            )}
          </View>
        </View>
        {voiceEnabled && speechOk && (
          <View className={styles.countdownSpeak}>
            <Text className={styles.countdownSpeakText}>🔊 重播</Text>
          </View>
        )}
      </View>

      <View className={classnames(styles.codeCard, countdownInfo.level === 'twoHour' && styles.codeCardUrgent)}>
        <Text className={styles.codeLabel}>核验码</Text>
        <Text className={styles.codeValue}>{appointmentData.checkInCode}</Text>
        <Text className={styles.codeTip}>到院后出示此码完成签到</Text>
      </View>

      <View className={styles.tabRow}>
        <View
          className={classnames(styles.tabItem, activeSection === 'detail' && styles.tabActive)}
          onClick={() => handleSectionChange('detail')}
        >
          <Text className={styles.tabLabel}>预约详情</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeSection === 'checklist' && styles.tabActive)}
          onClick={() => handleSectionChange('checklist')}
        >
          <Text className={styles.tabLabel}>检查清单 {checkedCount > 0 && `(${checkedCount})`}</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeSection === 'metal' && styles.tabActive)}
          onClick={() => handleSectionChange('metal')}
        >
          <Text className={styles.tabLabel}>金属提醒 {metalHandled > 0 && `(${metalHandled}/${metalTotal})`}</Text>
        </View>
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

          <View className={styles.timelineCard}>
            <Text className={styles.timelineDate}>📅 到院流程</Text>
            {timelineData.map((item, idx) => (
              <View key={idx} className={styles.timelineItem}>
                <View className={styles.timelineLeft}>
                  <View className={styles.timelineDot} />
                  {idx < timelineData.length - 1 && <View className={styles.timelineLine} />}
                </View>
                <View className={styles.timelineContent}>
                  <Text className={styles.timelineTime}>{item.time}</Text>
                  <Text className={styles.timelineTitle}>{item.title}</Text>
                  <Text className={styles.timelineDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {activeSection === 'checklist' && (
        <View className={styles.checklistSection}>
          <View className={styles.checklistProgress}>
            <Text className={styles.checklistProgressText}>已确认 {checkedCount}/{checklistWithStatus.length} 项</Text>
            <View className={styles.checklistProgressBar}>
              <View
                className={styles.checklistProgressFill}
                style={{ width: `${(checkedCount / checklistWithStatus.length) * 100}%` }}
              />
            </View>
          </View>

          {Object.keys(categoryLabels).map((cat) => {
            const items = checklistWithStatus.filter((c) => c.category === cat);
            if (items.length === 0) return null;
            return (
              <View key={cat} className={styles.checklistCategory}>
                <Text className={styles.checklistCategoryTitle}>{categoryLabels[cat]}</Text>
                <View className={styles.checklistItems}>
                  {items.map((item) => (
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
              </View>
            );
          })}

          {allChecked && (
            <View className={styles.allDoneTip}>
              <Text className={styles.allDoneTipText}>🎉 全部确认！您已做好检查准备</Text>
            </View>
          )}
        </View>
      )}

      {activeSection === 'metal' && (
        <View className={styles.metalSection}>
          {(countdownInfo.level === 'twoHour' || countdownInfo.level === 'arrived') && (
            <View className={styles.metalUrgentBanner}>
              <Text className={styles.metalUrgentText}>
                ⚠️ 检查临近！请务必确认以下金属物品已取下
              </Text>
            </View>
          )}

          <View className={styles.metalStats}>
            <View className={styles.metalStatItem}>
              <Text className={styles.metalStatNum}>{metalHandled}</Text>
              <Text className={styles.metalStatLabel}>已处理</Text>
            </View>
            <View className={styles.metalStatDivider} />
            <View className={styles.metalStatItem}>
              <Text className={styles.metalStatNum}>{metalTotal - metalHandled}</Text>
              <Text className={styles.metalStatLabel}>待处理</Text>
            </View>
            <View className={styles.metalStatDivider} />
            <View className={styles.metalStatItem}>
              <Text className={styles.metalStatNum}>{metalTotal}</Text>
              <Text className={styles.metalStatLabel}>共 {metalTotal} 项</Text>
            </View>
          </View>

          <View className={styles.metalList}>
            {metalReminders.map((item) => (
              <View
                key={item.id}
                className={classnames(styles.metalItem, item.handled && styles.metalItemDone)}
                onClick={() => handleToggleMetal(item.id)}
              >
                <View className={styles.metalItemLeft}>
                  <Text className={styles.metalItemIcon}>{item.icon}</Text>
                  <View className={styles.metalItemInfo}>
                    <Text className={styles.metalItemTitle}>{item.title}</Text>
                    <Text className={styles.metalItemDesc}>{item.desc}</Text>
                  </View>
                </View>
                <View
                  className={classnames(
                    styles.metalItemAction,
                    item.handled ? styles.metalItemActionDone : styles.metalItemActionTodo,
                  )}
                >
                  <Text className={styles.metalItemActionText}>
                    {item.handled ? '✓ 已处理' : '未处理'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className={styles.metalTip}>
            <Text className={styles.metalTipText}>
              💡 提示：检查当天建议穿着无金属的宽松衣物，或到院后更换检查服
            </Text>
          </View>
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
