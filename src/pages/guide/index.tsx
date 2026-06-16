import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { appointmentData, feedbackQuestions } from '@/data/questions';
import styles from './index.module.scss';

const metalReminders = [
  { icon: '💍', title: '戒指、项链、手镯', desc: '所有金属饰品必须取下' },
  { icon: '🔔', title: '耳环、鼻环、舌钉', desc: '包括非金属的装饰也建议取下' },
  { icon: '🦷', title: '可拆卸义齿', desc: '检查前务必取下' },
  { icon: '📌', title: '发夹、别针', desc: '包括金属材质的发饰' },
  { icon: '👗', title: '内衣钢圈', desc: '检查时需更换检查服' },
  { icon: '📱', title: '手机、钥匙、硬币', desc: '不能带入检查室' },
  { icon: '💊', title: '药物贴片', desc: '部分药物贴片含金属，需告知医生' },
  { icon: '👁️', title: '化妆、指甲油', desc: '部分化妆品含金属微粒' },
];

const GuidePage = () => {
  const { elderMode } = useAppStore();
  const [showCode, setShowCode] = useState(false);
  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, number>>({});
  const [feedbackChoices, setFeedbackChoices] = useState<Record<string, string>>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleRating = (questionId: string, rating: number) => {
    setFeedbackRatings((prev) => ({ ...prev, [questionId]: rating }));
  };

  const handleChoice = (questionId: string, choice: string) => {
    setFeedbackChoices((prev) => ({ ...prev, [questionId]: choice }));
  };

  const handleSubmitFeedback = () => {
    setFeedbackSubmitted(true);
    console.info('[Guide]', '反馈提交:', { ratings: feedbackRatings, choices: feedbackChoices });
  };

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>到院指引</Text>
        <Text className={styles.headerSubtitle}>检查当天要做什么，一目了然</Text>
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
        <Text className={styles.sectionTitle}>⚠️ 检查前必须去除的物品</Text>
        <Text className={styles.sectionSubtitle}>以下物品严禁带入MRI检查室，请提前处理</Text>
        <View className={styles.remindGrid}>
          {metalReminders.map((item, idx) => (
            <View key={idx} className={styles.remindItem}>
              <Text className={styles.remindIcon}>{item.icon}</Text>
              <View className={styles.remindInfo}>
                <Text className={styles.remindTitle}>{item.title}</Text>
                <Text className={styles.remindDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.processSection}>
        <Text className={styles.sectionTitle}>📋 到院流程</Text>
        <View className={styles.processList}>
          {appointmentData.timeline.map((item, idx) => (
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
              className={classnames(styles.btnPrimary, (!Object.keys(feedbackRatings).length && !Object.keys(feedbackChoices).length) && styles.btnDisabled)}
              onClick={() => {
                if (Object.keys(feedbackRatings).length > 0 || Object.keys(feedbackChoices).length > 0) {
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
