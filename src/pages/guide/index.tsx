import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { appointmentData, timelineData, feedbackQuestions, checklistData } from '@/data/questions';
import { speakText, stopSpeech, canUseSpeech } from '@/utils/riskAssess';
import ElderToggle from '@/components/ElderToggle';
import styles from './index.module.scss';

interface TodoItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  done: boolean;
  urgent: boolean;
  category: 'metal' | 'checklist' | 'upload' | 'document';
  toggleAction?: () => void;
}

const GuidePage = () => {
  const {
    elderMode, voiceEnabled, metalReminders, toggleMetalReminder,
    getMetalHandledCount, getFilesByType, checklistChecked,
    toggleChecklistItem, toggleArrivalTodo, isArrivalTodoDone,
  } = useAppStore();
  const [showCode, setShowCode] = useState(false);
  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, number>>({});
  const [feedbackChoices, setFeedbackChoices] = useState<Record<string, string>>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const speechOk = canUseSpeech();

  const todoList = useMemo<TodoItem[]>(() => {
    const items: TodoItem[] = [];

    checklistData.forEach((item) => {
      const icons: Record<string, string> = { document: '📄', diet: '🍽️', prepare: '👗', metal: '💍' };
      const done = checklistChecked.includes(item.id);
      items.push({
        id: `check_${item.id}`,
        icon: icons[item.category] || '📋',
        title: item.text,
        desc: '检查前需确认',
        done,
        urgent: item.category === 'metal',
        category: item.category === 'metal' ? 'metal' : 'checklist',
      });
    });

    metalReminders.forEach((m) => {
      const exists = items.some((i) => i.id === `metal_${m.id}`);
      if (!exists) {
        items.push({
          id: `metal_${m.id}`,
          icon: m.icon,
          title: `取下${m.title}`,
          desc: m.desc,
          done: m.handled,
          urgent: true,
          category: 'metal',
        });
      }
    });

    const uploadTypes = [
      { type: 'film', label: '既往片子', icon: '🎞️' },
      { type: 'summary', label: '出院小结', icon: '📋' },
      { type: 'implant', label: '植入物证明', icon: '📄' },
    ];
    uploadTypes.forEach((req) => {
      const count = getFilesByType(req.type).length;
      const todoId = `upload_${req.type}`;
      const userConfirmedDone = isArrivalTodoDone(todoId);
      const done = count > 0 || userConfirmedDone;
      if (!done || !userConfirmedDone) {
        items.push({
          id: todoId,
          icon: req.icon,
          title: count > 0 ? `已上传${req.label}（${count}份）` : `补传${req.label}`,
          desc: count > 0 ? '已上传，点击确认' : '到院前建议上传，暂无也可点击确认',
          done: userConfirmedDone,
          urgent: false,
          category: 'upload',
        });
      }
    });

    const docDone = isArrivalTodoDone('doc_id');
    items.push({
      id: 'doc_id',
      icon: '🪪',
      title: '携带身份证和医保卡',
      desc: '窗口签到时需要，确认已带请点击',
      done: docDone,
      urgent: false,
      category: 'document',
    });

    return items;
  }, [metalReminders, checklistChecked, isArrivalTodoDone, getFilesByType]);

  const doneCount = todoList.filter((t) => t.done).length;
  const pendingItems = todoList.filter((t) => !t.done);
  const urgentItems = pendingItems.filter((t) => t.urgent);
  const allDone = pendingItems.length === 0;

  const metalTotal = metalReminders.length;
  const metalHandled = getMetalHandledCount();

  useEffect(() => {
    return () => {
      if (!voiceEnabled) {
        stopSpeech();
      }
    };
  }, [voiceEnabled]);

  useEffect(() => {
    if (voiceEnabled && speechOk && pendingItems.length > 0) {
      const urgentCount = urgentItems.length;
      if (urgentCount > 0) {
        speakText(`到院提醒：您还有${urgentCount}项紧急事项需要处理，请确认。`);
      } else {
        speakText(`到院提醒：您还有${pendingItems.length}项待办事项。`);
      }
    }
  }, []);

  const handleTodoClick = (item: TodoItem) => {
    if (item.category === 'metal') {
      const metalId = item.id.replace('metal_', '');
      const checkId = item.id.replace('check_', '');
      if (item.id.startsWith('metal_')) {
        toggleMetalReminder(metalId);
      }
      if (item.id.startsWith('check_')) {
        toggleChecklistItem(checkId);
        const matchingMetal = metalReminders.find((m) => m.title.includes(checklistData.find((c) => c.id === checkId)?.text || ''));
        if (matchingMetal) {
          toggleMetalReminder(matchingMetal.id);
        }
      }
      if (voiceEnabled && speechOk) {
        speakText(`${item.title}，已${item.done ? '取消' : '完成'}`);
      }
    } else if (item.category === 'checklist') {
      const checkId = item.id.replace('check_', '');
      toggleChecklistItem(checkId);
      if (voiceEnabled && speechOk) {
        speakText(`${item.title}，已${item.done ? '取消确认' : '确认'}`);
      }
    } else {
      toggleArrivalTodo(item.id);
      if (voiceEnabled && speechOk) {
        speakText(`${item.title}，已${item.done ? '取消确认' : '确认完成'}`);
      }
    }
  };

  const handleToggleMetal = (id: string) => {
    toggleMetalReminder(id);
    if (voiceEnabled && speechOk) {
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
    if (voiceEnabled && speechOk) {
      speakText('感谢您的反馈');
    }
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

      {urgentItems.length > 0 && (
        <View className={styles.urgentBanner}>
          <Text className={styles.urgentBannerIcon}>🚨</Text>
          <View className={styles.urgentBannerText}>
            <Text className={styles.urgentBannerTitle}>签到前紧急提醒</Text>
            <Text className={styles.urgentBannerDesc}>以下 {urgentItems.length} 项必须在检查前完成！</Text>
          </View>
        </View>
      )}

      <View className={styles.todoSection}>
        <View className={styles.todoHeader}>
          <Text className={styles.sectionTitle}>📋 当天待办</Text>
          {allDone ? (
            <Text className={styles.todoAllDone}>✅ 全部完成</Text>
          ) : (
            <Text className={styles.todoProgress}>{doneCount}/{todoList.length}</Text>
          )}
        </View>

        {!allDone && (
          <Text className={styles.sectionSubtitle}>
            {urgentItems.length > 0
              ? `⚠️ ${urgentItems.length}项需签到前处理，点击条目可标记完成`
              : `还有${pendingItems.length}项待确认，点击条目可标记完成`}
          </Text>
        )}

        {allDone ? (
          <View className={styles.allDoneCard}>
            <Text className={styles.allDoneIcon}>🎉</Text>
            <Text className={styles.allDoneTitle}>所有事项已处理完毕</Text>
            <Text className={styles.allDoneText}>请安心检查，祝您检查顺利！</Text>
          </View>
        ) : (
          <View className={styles.todoList}>
            {todoList.map((item) => (
              <View
                key={item.id}
                className={classnames(
                  styles.todoItem,
                  item.done && styles.todoItemDone,
                  item.urgent && !item.done && styles.todoItemUrgent,
                )}
                onClick={() => handleTodoClick(item)}
              >
                <View className={styles.todoCheckbox}>
                  <View
                    className={classnames(
                      styles.checkboxBox,
                      item.done && styles.checkboxBoxChecked,
                    )}
                  >
                    {item.done && <Text className={styles.checkboxTick}>✓</Text>}
                  </View>
                </View>
                <View className={styles.todoItemLeft}>
                  <Text className={styles.todoIcon}>{item.icon}</Text>
                  <View className={styles.todoInfo}>
                    <Text className={styles.todoTitle}>{item.title}</Text>
                    <Text className={styles.todoDesc}>{item.desc}</Text>
                  </View>
                </View>
                <View
                  className={classnames(
                    styles.todoAction,
                    item.done ? styles.todoActionDone : styles.todoActionPending,
                  )}
                >
                  <Text className={styles.todoActionText}>
                    {item.done ? '已完成' : '点我完成'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.remindSection}>
        <View className={styles.remindSectionHeader}>
          <Text className={styles.sectionTitle}>⚠️ 金属物品去除</Text>
          <Text className={styles.remindProgress}>{metalHandled}/{metalTotal}</Text>
        </View>
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
