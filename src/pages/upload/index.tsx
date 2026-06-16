import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { enhanceMRIInfo } from '@/data/questions';
import styles from './index.module.scss';

interface UploadFile {
  id: string;
  type: 'film' | 'summary' | 'implant' | 'other';
  title: string;
  status: 'pending' | 'uploaded' | 'verified';
}

const uploadCategories = [
  { type: 'film' as const, title: '既往片子', icon: '🎞️', desc: 'CT、X光、MRI等影像资料' },
  { type: 'summary' as const, title: '出院小结', icon: '📋', desc: '住院治疗的出院记录' },
  { type: 'implant' as const, title: '植入物证明', icon: '📄', desc: '植入物的型号和材质证明' },
  { type: 'other' as const, title: '其他资料', icon: '📎', desc: '检查单、转诊单等' },
];

const UploadPage = () => {
  const { elderMode, getHighestRisk } = useAppStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [showEnhanceInfo, setShowEnhanceInfo] = useState(false);

  const riskResult = getHighestRisk();

  const handleUpload = (type: string) => {
    try {
      const newFile: UploadFile = {
        id: `f_${Date.now()}`,
        type: type as UploadFile['type'],
        title: uploadCategories.find((c) => c.type === type)?.title || '',
        status: 'uploaded',
      };
      setUploadedFiles([...uploadedFiles, newFile]);
      console.info('[Upload]', '文件上传成功:', newFile.id);
    } catch (e) {
      console.error('[Upload]', '文件上传失败:', e);
    }
  };

  const getCategoryCount = (type: string) => uploadedFiles.filter((f) => f.type === type).length;

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>资料上传</Text>
        <Text className={styles.headerSubtitle}>上传既往资料，方便医生快速了解您的情况</Text>
      </View>

      {riskResult !== 'canContinue' && (
        <View className={styles.riskWarning}>
          <Text className={styles.riskWarningIcon}>
            {riskResult === 'cannot' ? '⛔' : '⚠️'}
          </Text>
          <Text className={styles.riskWarningText}>
            {riskResult === 'cannot' ? '您存在MRI禁忌，建议先咨询医生再上传资料' : '您的情况需要医生评估，建议先咨询后再上传'}
          </Text>
        </View>
      )}

      <View className={styles.enhanceCard} onClick={() => setShowEnhanceInfo(!showEnhanceInfo)}>
        <View className={styles.enhanceHeader}>
          <Text className={styles.enhanceIcon}>💉</Text>
          <Text className={styles.enhanceTitle}>增强 MRI 需知</Text>
          <Text className={classnames(styles.enhanceArrow, showEnhanceInfo && styles.enhanceArrowOpen)}>▼</Text>
        </View>
        {showEnhanceInfo && (
          <View className={styles.enhanceBody}>
            <View className={styles.enhanceItem}>
              <Text className={styles.enhanceItemLabel}>🩸 抽血要求</Text>
              <Text className={styles.enhanceItemValue}>{enhanceMRIInfo.bloodTestRequired ? '需要提前抽血检查肾功能' : '无需抽血'}</Text>
            </View>
            <View className={styles.enhanceItem}>
              <Text className={styles.enhanceItemLabel}>🍽️ 饮食要求</Text>
              <Text className={styles.enhanceItemValue}>{enhanceMRIInfo.dietRequirement}</Text>
            </View>
            <View className={styles.enhanceItem}>
              <Text className={styles.enhanceItemLabel}>👥 陪同要求</Text>
              <Text className={styles.enhanceItemValue}>{enhanceMRIInfo.companionRequired ? '必须有家属陪同' : '无需陪同'}</Text>
            </View>
            <View className={styles.enhanceItem}>
              <Text className={styles.enhanceItemLabel}>💊 造影剂类型</Text>
              <Text className={styles.enhanceItemValue}>{enhanceMRIInfo.contrastType}</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.uploadSection}>
        <Text className={styles.sectionTitle}>上传资料</Text>
        <View className={styles.uploadGrid}>
          {uploadCategories.map((cat) => {
            const count = getCategoryCount(cat.type);
            return (
              <View key={cat.type} className={styles.uploadCard} onClick={() => handleUpload(cat.type)}>
                <Text className={styles.uploadCardIcon}>{cat.icon}</Text>
                <Text className={styles.uploadCardTitle}>{cat.title}</Text>
                <Text className={styles.uploadCardDesc}>{cat.desc}</Text>
                {count > 0 && (
                  <View className={styles.uploadBadge}>
                    <Text className={styles.uploadBadgeText}>{count}</Text>
                  </View>
                )}
                <View className={styles.uploadBtn}>
                  <Text className={styles.uploadBtnText}>+ 点击上传</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {uploadedFiles.length > 0 && (
        <View className={styles.fileList}>
          <Text className={styles.sectionTitle}>已上传文件 ({uploadedFiles.length})</Text>
          {uploadedFiles.map((file) => (
            <View key={file.id} className={styles.fileItem}>
              <View className={styles.fileIcon}>
                <Text>📄</Text>
              </View>
              <View className={styles.fileInfo}>
                <Text className={styles.fileName}>{file.title}</Text>
                <Text className={styles.fileStatus}>已上传</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className={styles.bottomAction}>
        <View
          className={classnames(styles.btnPrimary, uploadedFiles.length === 0 && styles.btnDisabled)}
          onClick={() => {
            if (uploadedFiles.length > 0) {
              Taro.switchTab({ url: '/pages/appointment/index' });
            }
          }}
        >
          <Text className={styles.btnPrimaryText}>完成上传，去预约确认</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default UploadPage;
