import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { appointmentData, timelineData, feedbackQuestions } from '@/data/questions';
import { speakText, stopSpeech } from '@/utils/riskAssess';
import ElderToggle from '@/components/ElderToggle';
import styles from './index.module.scss';

const GuidePage = () => {
  const { elderMode, voiceEnabled, metalReminders, toggleMetalReminder, getMetalHandledCount } = useAppStore();
  const [showCode, setShowCode] = useState(false);
  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, number>>({});
  const [feedbackChoices, setFeedbackChoices] = useState<Record<string, string>>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const metalTotal = metalReminders.length;
  const metalHandled = getMetalHandledCount();

  useEffect(() => {
    return () => {
      if (!voiceEnabled) {
        stopSpeech();
      }
    };
  }, [voiceEnabled]);

  const handleToggleMetal = (id: string) => {
    toggleMetalReminder(id);
    if (voiceEnabled) {
      const item = metalReminders.find((m) => m.id === id);
      if (item) {
        speakText(`${item.title}，已${!item.handled ? '处理' : '取消处理'}`);
      }
    }
  };

  const handleRating = (questionId: string, rating: number) => {
    setFeedbackRatings((prev) => ({ ...prev, [questionId]: rating }));
  };

  const handleChoice = (questionId: string, choice: string) => {
    setFeedbackChoices((prev) => ({ ...prev, [questionId]: choice }));
  };

  const handleSubmitFeedback = () => {
    setFeedbackSubmitted(true);
    if (voiceEnabled) {
      speakText('感谢您的反馈');
    }
    console.info('[Guide]', '反馈提交:', { ratings: feedbackRatings, choices: feedbackChoices });
  };

  const canSubmitFeedback = Object.keys(feedbackRatings).length > 0 || Object.keys(feedbackChoices).length > 0;

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>到院指引</Text>
        <Text className={styles.headerSubtitle}>检查当天要做什么，一目了然</Text>
      </View>

      <View className={styles.toggleWrap}>
        <ElderToggle />
      </View>

      <View className={styles.checkInCard} onClick={() => setShowCode(!showCode)}>
        <View className={styles.checkInHeader}>
          <Text className={styles.checkInIcon}>🏥</Text>
          <Text className={styles.checkInTitle}>到院签到</Text>
        </View>
        <Text className={styles.checkInDesc}>点击出示核验码，在窗口扫码完成签到</Text>
        {showCode && (
          <View className={styles.codeDisplay}>
            <Text className={styles.codeValue}>{appointmentData.checkInCode}</Text>
            <Text className={styles.codeTip}>请将此码出示给窗口工作人员</Text>
          </View>
        )}
        <Text className={styles.checkInArrow}>{showCode ? '▲ 收起' : '▼ 展开核验码'}</Text>
      </View>

      <View className={styles.locationCard}>
        <Text className={styles.locationTitle}>📍 检查地点</Text>
        <Text className={styles.locationValue}>{appointmentData.location}</Text>
        <Text className={styles.locationTip}>建议提前30分钟到达，预留签到和更衣时间</Text>
      </View>

      <View className={styles.remindSection}>
        <View className={styles.remindSectionHeader}>
          <Text className={styles.sectionTitle}>⚠️ 检查前必须去除的物品</Text>
          <Text className={styles.remindProgress}>{metalHandled}/{metalTotal}</Text>
        </View>
        <Text className={styles.sectionSubtitle}>
          {metalHandled === metalTotal ? '✅ 全部已处理，您已做好准备！' : `还有 ${metalTotal - metalHandled} 项未处理，请确认`}
        </Text>
        <View className={styles.remindGrid}>
          {metalReminders.map((item) => (
            <View
              key={item.id}
              className={classnames(styles.remindItem, item.handled && styles.remindItemDone)}
              onClick={() => handleToggleMetal(item.id)}
            >
              <View className={styles.remindItemLeft}>
                <Text className={styles.remindIcon}>{item.icon}</Text>
                <View className={styles.remindInfo}>
                  <Text className={styles.remindTitle}>{item.title}</Text>
                  <Text className={styles.remindDesc}>{item.desc}</Text>
                </View>
              </View>
              <View
                className={classnames(
                  styles.remindStatus,
                  item.handled ? styles.remindStatusDone : styles.remindStatusTodo,
                )}
              >
                <Text className={styles.remindStatusText}>
                  {item.handled ? '✓ 已处理' : '未处理'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.processSection}>
        <Text className={styles.sectionTitle}>📋 到院流程</Text>
        <View className={styles.processList}>
          {timelineData.map((item, idx) => (
            <View key={idx} className={styles.processItem}>
              <View className={styles.processStep}>
                <Text className={styles.processStepNum}>{idx + 1}</Text>
              </View>
              <View className={styles.processContent}>
                <View className={styles.processRow}>
                  <Text className={styles.processTime}>{item.time}</Text>
                  <Text className={styles.processTitle}>{item.title}</Text>
                </View>
                <Text className={styles.processDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.feedbackSection}>
        <Text className={styles.sectionTitle}>📝 检查反馈</Text>
        <Text className={styles.sectionSubtitle}>您的意见对我们很重要</Text>

        {feedbackSubmitted ? (
          <View className={styles.feedbackDone}>
            <Text className={styles.feedbackDoneIcon}>🎉</Text>
            <Text className={styles.feedbackDoneText}>感谢您的反馈！</Text>
          </View>
        ) : (
          <View className={styles.feedbackList}>
            {feedbackQuestions.map((q) => (
              <View key={q.id} className={styles.feedbackCard}>
                <Text className={styles.feedbackQuestion}>{q.question}</Text>
                {q.type === 'rating' && (
                  <View className={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <View
                        key={star}
                        className={classnames(styles.ratingStar, (feedbackRatings[q.id] || 0) >= star && styles.ratingStarActive)}
                        onClick={() => handleRating(q.id, star)}
                      >
                        <Text className={styles.ratingStarText}>★</Text>
                      </View>
                    ))}
                  </View>
                )}
                {q.type === 'choice' && q.options && (
                  <View className={styles.choiceRow}>
                    {q.options.map((opt) => (
                      <View
                        key={opt}
                        className={classnames(styles.choiceItem, feedbackChoices[q.id] === opt && styles.choiceActive)}
                        onClick={() => handleChoice(q.id, opt)}
                      >
                        <Text className={styles.choiceLabel}>{opt}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            <View
              className={classnames(styles.btnPrimary, !canSubmitFeedback && styles.btnDisabled)}
              onClick={() => {
                if (canSubmitFeedback) {
                  handleSubmitFeedback();
                }
              }}
            >
              <Text className={styles.btnPrimaryText}>提交反馈</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.bottomSpace} />
    </ScrollView>
  );
};

export default GuidePage;
