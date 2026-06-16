import React, { useState, useEffect } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { implantExamples } from '@/data/questions';
import { speakText, stopSpeech } from '@/utils/riskAssess';
import ElderToggle from '@/components/ElderToggle';
import type { FamilyInfo } from '@/types/mri';
import styles from './index.module.scss';

const relationships = ['配偶', '子女', '父母', '兄弟姐妹', '其他'];

const FamilyPage = () => {
  const { familyInfo, setFamilyInfo, elderMode, voiceEnabled } = useAppStore();
  const [activeTab, setActiveTab] = useState<'fill' | 'identify'>('fill');

  const handleFieldChange = (field: keyof FamilyInfo, value: string) => {
    setFamilyInfo({ ...familyInfo, [field]: value });
  };

  const isFormComplete = familyInfo.patientName && familyInfo.patientPhone && familyInfo.familyName && familyInfo.familyPhone && familyInfo.relationship;

  const handleTabChange = (tab: 'fill' | 'identify') => {
    setActiveTab(tab);
    if (voiceEnabled) {
      const text = tab === 'fill' ? '代填信息' : '辨认植入物';
      speakText(text);
    }
  };

  useEffect(() => {
    if (voiceEnabled && activeTab === 'fill' && isFormComplete) {
    }
    return () => {
      if (!voiceEnabled) {
        stopSpeech();
      }
    };
  }, [voiceEnabled, activeTab, isFormComplete]);

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>家属协助</Text>
        <Text className={styles.headerSubtitle}>帮家人填写信息，双方联系方式都会保留</Text>
      </View>

      <View className={styles.toggleWrap}>
        <ElderToggle />
      </View>

      <View className={styles.tabRow}>
        <View
          className={classnames(styles.tabItem, activeTab === 'fill' && styles.tabActive)}
          onClick={() => handleTabChange('fill')}
        >
          <Text className={styles.tabLabel}>代填信息</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'identify' && styles.tabActive)}
          onClick={() => handleTabChange('identify')}
        >
          <Text className={styles.tabLabel}>辨认植入物</Text>
        </View>
      </View>

      {activeTab === 'fill' && (
        <View className={styles.formSection}>
          <View className={styles.formCard}>
            <Text className={styles.cardTitle}>👤 患者信息</Text>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>患者姓名</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入患者姓名"
                value={familyInfo.patientName}
                onInput={(e) => handleFieldChange('patientName', e.detail.value)}
              />
            </View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>患者手机号</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入患者手机号"
                type="number"
                maxlength={11}
                value={familyInfo.patientPhone}
                onInput={(e) => handleFieldChange('patientPhone', e.detail.value)}
              />
            </View>
          </View>

          <View className={styles.formCard}>
            <Text className={styles.cardTitle}>👨‍👩‍👧 家属信息</Text>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>家属姓名</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入家属姓名"
                value={familyInfo.familyName}
                onInput={(e) => handleFieldChange('familyName', e.detail.value)}
              />
            </View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>家属手机号</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入家属手机号"
                type="number"
                maxlength={11}
                value={familyInfo.familyPhone}
                onInput={(e) => handleFieldChange('familyPhone', e.detail.value)}
              />
            </View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>与患者关系</Text>
              <View className={styles.relationGrid}>
                {relationships.map((rel) => (
                  <View
                    key={rel}
                    className={classnames(styles.relationItem, familyInfo.relationship === rel && styles.relationActive)}
                    onClick={() => handleFieldChange('relationship', rel)}
                  >
                    <Text className={styles.relationLabel}>{rel}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {isFormComplete && (
            <View className={styles.saveTip}>
              <Text className={styles.saveTipText}>✅ 信息已保存，双方联系方式将用于检查通知和紧急联系</Text>
            </View>
          )}

          {familyInfo.patientName && (
            <View className={styles.formSummary}>
              <Text className={styles.formSummaryTitle}>📝 已填写信息</Text>
              <View className={styles.formSummaryRow}>
                <Text className={styles.formSummaryLabel}>患者</Text>
                <Text className={styles.formSummaryValue}>{familyInfo.patientName || '未填写'}</Text>
              </View>
              <View className={styles.formSummaryRow}>
                <Text className={styles.formSummaryLabel}>家属</Text>
                <Text className={styles.formSummaryValue}>{familyInfo.familyName || '未填写'}{familyInfo.relationship ? `（${familyInfo.relationship}）` : ''}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {activeTab === 'identify' && (
        <View className={styles.identifySection}>
          <View className={styles.identifyTip}>
            <Text className={styles.identifyTipText}>💡 不确定体内有什么？对照下面这些常见植入物，看您是否认识</Text>
          </View>
          <View className={styles.implantList}>
            {implantExamples.map((item) => (
              <View key={item.name} className={styles.implantCard}>
                <View className={styles.implantImageWrap}>
                  <Text className={styles.implantImagePlaceholder}>📷</Text>
                </View>
                <View className={styles.implantInfo}>
                  <Text className={styles.implantName}>{item.name}</Text>
                  <Text className={styles.implantDesc}>{item.description}</Text>
                  <View
                    className={classnames(
                      styles.implantRisk,
                      item.riskLevel === 'high' && styles.riskHigh,
                      item.riskLevel === 'medium' && styles.riskMedium,
                      item.riskLevel === 'low' && styles.riskLow,
                    )}
                  >
                    <Text className={styles.implantRiskText}>
                      {item.riskLevel === 'high' ? '⛔ 通常不能做' : item.riskLevel === 'medium' ? '⚠️ 需确认' : '✅ 通常可以'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View className={styles.identifyNote}>
            <Text className={styles.identifyNoteText}>📌 如果辨认出自己体内有以上植入物，请返回自测页面如实选择，或携带植入物证明到院</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FamilyPage;
