import React, { useState, useEffect } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { implantExamples, checklistData } from '@/data/questions';
import { riskResultLabel, riskResultIcon, riskResultDescription, speakText, stopSpeech, canUseSpeech } from '@/utils/riskAssess';
import ElderToggle from '@/components/ElderToggle';
import type { FamilyInfo } from '@/types/mri';
import styles from './index.module.scss';

const relationships = ['配偶', '子女', '父母', '兄弟姐妹', '其他'];

const requiredUploadTypes = [
  { type: 'film', label: '既往片子' },
  { type: 'summary', label: '出院小结' },
  { type: 'implant', label: '植入物证明' },
];

const FamilyPage = () => {
  const {
    familyInfo, setFamilyInfo, elderMode, voiceEnabled,
    answers, getHighestRisk, uploadFiles, getFilesByType,
    metalReminders, getMetalHandledCount, checklistChecked,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'fill' | 'identify' | 'summary'>('fill');

  const handleFieldChange = (field: keyof FamilyInfo, value: string) => {
    setFamilyInfo({ ...familyInfo, [field]: value });
  };

  const isFormComplete = familyInfo.patientName && familyInfo.patientPhone && familyInfo.familyName && familyInfo.familyPhone && familyInfo.relationship;

  const handleTabChange = (tab: 'fill' | 'identify' | 'summary') => {
    setActiveTab(tab);
    if (voiceEnabled && canUseSpeech()) {
      const tabNames = { fill: '代填信息', identify: '辨认植入物', summary: '核验摘要' };
      speakText(tabNames[tab]);
    }
  };

  useEffect(() => {
    return () => {
      if (!voiceEnabled) {
        stopSpeech();
      }
    };
  }, [voiceEnabled]);

  const riskResult = getHighestRisk();

  const missingUploads = requiredUploadTypes.filter((req) => getFilesByType(req.type).length === 0);

  const unhandledMetals = metalReminders.filter((m) => !m.handled);
  const metalHandled = getMetalHandledCount();
  const metalTotal = metalReminders.length;

  const uncheckedItems = checklistData.filter((c) => !checklistChecked.includes(c.id));

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
        <View
          className={classnames(styles.tabItem, activeTab === 'summary' && styles.tabActive)}
          onClick={() => handleTabChange('summary')}
        >
          <Text className={styles.tabLabel}>核验摘要</Text>
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

      {activeTab === 'summary' && (
        <View className={styles.summarySection}>
          <View className={styles.summaryHeader}>
            <Text className={styles.summaryHeaderIcon}>📋</Text>
            <View className={styles.summaryHeaderText}>
              <Text className={styles.summaryHeaderTitle}>共享核验摘要</Text>
              <Text className={styles.summaryHeaderDesc}>可截图或现场出示给护士</Text>
            </View>
          </View>

          <View className={styles.summaryCard}>
            <Text className={styles.summaryCardTitle}>� 患者信息</Text>
            {familyInfo.patientName ? (
              <View className={styles.summaryContent}>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryRowLabel}>患者</Text>
                  <Text className={styles.summaryRowValue}>{familyInfo.patientName}  {familyInfo.patientPhone}</Text>
                </View>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryRowLabel}>家属</Text>
                  <Text className={styles.summaryRowValue}>{familyInfo.familyName}（{familyInfo.relationship}）{familyInfo.familyPhone}</Text>
                </View>
              </View>
            ) : (
              <View className={styles.summaryEmpty}>
                <Text className={styles.summaryEmptyText}>未填写，请先到"代填信息"补充</Text>
              </View>
            )}
          </View>

          <View className={styles.summaryCard}>
            <Text className={styles.summaryCardTitle}>🔬 自测结论</Text>
            {answers.length > 0 ? (
              <View className={styles.summaryContent}>
                <View className={classnames(
                  styles.riskBadge,
                  riskResult === 'cannot' && styles.riskHigh,
                  riskResult === 'askDoctor' && styles.riskMedium,
                  riskResult === 'canContinue' && styles.riskLow,
                )}>
                  <Text className={styles.riskBadgeIcon}>{riskResultIcon(riskResult)}</Text>
                  <Text className={styles.riskBadgeLabel}>{riskResultLabel(riskResult)}</Text>
                </View>
                <Text className={styles.riskDesc}>{riskResultDescription(riskResult)}</Text>
              </View>
            ) : (
              <View className={styles.summaryEmpty}>
                <Text className={styles.summaryEmptyText}>未完成自测，请先到"自测首页"完成问卷</Text>
              </View>
            )}
          </View>

          <View className={styles.summaryCard}>
            <Text className={styles.summaryCardTitle}>📁 资料补传情况</Text>
            <View className={styles.summaryContent}>
              {requiredUploadTypes.map((req) => {
                const count = getFilesByType(req.type).length;
                return (
                  <View key={req.type} className={styles.summaryRow}>
                    <Text className={styles.summaryRowLabel}>{req.label}</Text>
                    <Text className={classnames(styles.summaryRowValue, count === 0 && styles.textWarning)}>
                      {count > 0 ? `已上传 ${count} 份` : '❌ 未上传'}
                    </Text>
                  </View>
                );
              })}
              {missingUploads.length > 0 && (
                <View className={styles.summaryTip}>
                  <Text className={styles.summaryTipText}>⚠️ 缺少：{missingUploads.map((m) => m.label).join('、')}</Text>
                </View>
              )}
              {missingUploads.length === 0 && (
                <View className={styles.summaryTip}>
                  <Text className={styles.summaryTipOk}>✅ 主要资料已补齐</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.summaryCard}>
            <Text className={styles.summaryCardTitle}>🔔 检查前待处理项</Text>
            <View className={styles.summaryContent}>
              <View className={styles.summaryRow}>
                <Text className={styles.summaryRowLabel}>金属物品</Text>
                <Text className={classnames(styles.summaryRowValue, unhandledMetals.length > 0 && styles.textWarning)}>
                  {metalHandled}/{metalTotal} 已处理 {unhandledMetals.length > 0 ? `（${unhandledMetals.length}项未处理）` : ''}
                </Text>
              </View>
              {unhandledMetals.length > 0 && (
                <View className={styles.summarySubList}>
                  {unhandledMetals.map((m) => (
                    <Text key={m.id} className={styles.summarySubItem}>· {m.icon} {m.title}</Text>
                  ))}
                </View>
              )}
              <View className={styles.summaryRow}>
                <Text className={styles.summaryRowLabel}>检查清单</Text>
                <Text className={classnames(styles.summaryRowValue, uncheckedItems.length > 0 && styles.textWarning)}>
                  {checklistChecked.length}/{checklistData.length} 已确认 {uncheckedItems.length > 0 ? `（${uncheckedItems.length}项未确认）` : ''}
                </Text>
              </View>
              {uncheckedItems.length > 0 && (
                <View className={styles.summarySubList}>
                  {uncheckedItems.map((c) => (
                    <Text key={c.id} className={styles.summarySubItem}>· {c.text}</Text>
                  ))}
                </View>
              )}
              {unhandledMetals.length === 0 && uncheckedItems.length === 0 && (
                <View className={styles.summaryTip}>
                  <Text className={styles.summaryTipOk}>✅ 所有检查前事项已处理完毕</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.summaryNote}>
            <Text className={styles.summaryNoteText}>📌 本摘要由小程序自动汇总，可截图出示给护士或医生查看。如信息有变化，请重新进入此页刷新。</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FamilyPage;
