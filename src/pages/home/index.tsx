import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { questions, patientTypes } from '@/data/questions';
import { riskResultDescription, speakText, stopSpeech, riskResultSpeakText } from '@/utils/riskAssess';
import ElderToggle from '@/components/ElderToggle';
import RiskBadge from '@/components/RiskBadge';
import type { Answer, RiskResult } from '@/types/mri';
import styles from './index.module.scss';

const HomePage = () => {
  const { answers, setAnswer, elderMode, getHighestRisk, setPatientType, voiceEnabled, patientType } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedPatientType, setSelectedPatientType] = useState(patientType || 'normal');
  const hasInitialized = useRef(false);

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
  const isLastStep = currentStep === questions.length - 1;
  const riskResult: RiskResult = getHighestRisk();

  useEffect(() => {
    if (answers.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      const lastAnsweredIdx = questions.findIndex((q) =>
        answers.some((a) => a.questionId === q.id)
      );
      if (lastAnsweredIdx >= 0) {
        const lastUnanswered = questions.findIndex((q, idx) => {
          if (idx < lastAnsweredIdx) return false;
          return !answers.some((a) => a.questionId === q.id);
        });
        if (lastUnanswered >= 0) {
          setCurrentStep(lastUnanswered);
        } else {
          setCurrentStep(questions.length - 1);
          setShowResult(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (voiceEnabled && currentQuestion && !showResult) {
      const text = `第${currentStep + 1}题。${currentQuestion.title}。${currentQuestion.description}`;
      speakText(text);
    }
    return () => {
      if (!voiceEnabled) {
        stopSpeech();
      }
    };
  }, [currentStep, voiceEnabled, showResult]);

  useEffect(() => {
    if (voiceEnabled && showResult) {
      speakText(riskResultSpeakText(riskResult));
    }
    return () => {
      if (showResult && !voiceEnabled) {
        stopSpeech();
      }
    };
  }, [showResult, voiceEnabled, riskResult]);

  const handleSelectOption = (questionId: string, optionValue: string, riskLevel: 'high' | 'medium' | 'low') => {
    const answer: Answer = { questionId, selectedValue: optionValue, riskLevel };
    setAnswer(answer);
  };

  const handleNext = () => {
    if (isLastStep) {
      setShowResult(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (showResult) {
      setShowResult(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    stopSpeech();
    setCurrentStep(0);
    setShowResult(false);
    setSelectedPatientType('normal');
    useAppStore.getState().resetAnswers();
  };

  const handlePatientTypeSelect = (type: string) => {
    setSelectedPatientType(type);
    setPatientType(type);
  };

  const selectedType = patientTypes.find((p) => p.type === selectedPatientType);

  const handleReplay = () => {
    if (voiceEnabled && currentQuestion) {
      const text = `第${currentStep + 1}题。${currentQuestion.title}。${currentQuestion.description}`;
      speakText(text);
    }
  };

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>MRI 能不能做？</Text>
        <Text className={styles.headerSubtitle}>回答几个简单问题，马上就知道</Text>
      </View>

      <View className={styles.toggleWrap}>
        <ElderToggle />
      </View>

      {!showResult && (
        <View className={styles.patientTypeSection}>
          <Text className={styles.sectionTitle}>我是...</Text>
          <View className={styles.patientTypeGrid}>
            {patientTypes.map((pt) => (
              <View
                key={pt.type}
                className={classnames(styles.patientTypeItem, selectedPatientType === pt.type && styles.patientTypeActive)}
                onClick={() => handlePatientTypeSelect(pt.type)}
              >
                <Text className={styles.patientTypeLabel}>{pt.label}</Text>
              </View>
            ))}
          </View>
          {selectedType && selectedType.reminders.length > 0 && (
            <View className={styles.reminderCard}>
              <Text className={styles.reminderTitle}>💡 特别提醒</Text>
              {selectedType.reminders.map((r, i) => (
                <Text key={i} className={styles.reminderText}>• {r}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {!showResult ? (
        <View className={styles.questionSection}>
          <View className={styles.progressRow}>
            <Text className={styles.progressText}>第 {currentStep + 1} 题 / 共 {questions.length} 题</Text>
            {voiceEnabled && (
              <View className={styles.replayBtn} onClick={handleReplay}>
                <Text className={styles.replayBtnText}>🔊 重播</Text>
              </View>
            )}
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }} />
          </View>

          {currentQuestion && (
            <View className={styles.questionCard}>
              <Text className={styles.questionIcon}>{currentQuestion.icon}</Text>
              <Text className={styles.questionTitle}>{currentQuestion.title}</Text>
              <Text className={styles.questionDesc}>{currentQuestion.description}</Text>

              <View className={styles.optionsList}>
                {currentQuestion.options.map((opt) => (
                  <View
                    key={opt.value}
                    className={classnames(
                      styles.optionItem,
                      currentAnswer?.selectedValue === opt.value && styles.optionSelected,
                      opt.riskLevel === 'high' && styles.optionHigh,
                      opt.riskLevel === 'medium' && styles.optionMedium,
                    )}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.value, opt.riskLevel)}
                  >
                    <View className={styles.optionRadio}>
                      {currentAnswer?.selectedValue === opt.value && <View className={styles.optionRadioInner} />}
                    </View>
                    <View className={styles.optionContent}>
                      <Text className={styles.optionLabel}>{opt.label}</Text>
                      {currentAnswer?.selectedValue === opt.value && (
                        <Text className={styles.optionDetail}>{opt.detail}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className={styles.actionRow}>
            {currentStep > 0 && (
              <View className={styles.btnPrev} onClick={handlePrev}>
                <Text className={styles.btnPrevText}>上一步</Text>
              </View>
            )}
            <View
              className={classnames(styles.btnNext, !currentAnswer && styles.btnDisabled)}
              onClick={currentAnswer ? handleNext : undefined}
            >
              <Text className={styles.btnNextText}>{isLastStep ? '查看结果' : '下一步'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className={styles.resultSection}>
          <View className={classnames(styles.resultCard, riskResult === 'cannot' && styles.resultHigh, riskResult === 'askDoctor' && styles.resultMedium, riskResult === 'canContinue' && styles.resultLow)}>
            <Text className={styles.resultIcon}>
              {riskResult === 'cannot' ? '⛔' : riskResult === 'askDoctor' ? '⚠️' : '✅'}
            </Text>
            <RiskBadge result={riskResult} size="large" />
            <Text className={styles.resultDesc}>{riskResultDescription(riskResult)}</Text>
            {voiceEnabled && (
              <View className={styles.resultSpeakTip}>
                <Text className={styles.resultSpeakTipText}>🔊 语音播报中...</Text>
              </View>
            )}
          </View>

          <View className={styles.answersSummary}>
            <Text className={styles.summaryTitle}>您的回答汇总</Text>
            {answers.map((ans, idx) => {
              const q = questions.find((qq) => qq.id === ans.questionId);
              const opt = q?.options.find((o) => o.value === ans.selectedValue);
              return (
                <View key={ans.questionId} className={styles.summaryItem}>
                  <Text className={styles.summaryQ}>{idx + 1}. {q?.title}</Text>
                  <Text className={styles.summaryA}>{opt?.label}</Text>
                </View>
              );
            })}
          </View>

          <View className={styles.resultActions}>
            {riskResult === 'canContinue' && (
              <View
                className={styles.btnPrimary}
                onClick={() => Taro.switchTab({ url: '/pages/upload/index' })}
              >
                <Text className={styles.btnPrimaryText}>去上传资料</Text>
              </View>
            )}
            <View className={styles.btnSecondary} onClick={handleReset}>
              <Text className={styles.btnSecondaryText}>重新自测</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default HomePage;
