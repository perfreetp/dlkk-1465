import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { enhanceMRIInfo } from '@/data/questions';
import { speakText, stopSpeech } from '@/utils/riskAssess';
import ElderToggle from '@/components/ElderToggle';
import type { UploadFile } from '@/types/mri';
import styles from './index.module.scss';

const uploadCategories = [
  { type: 'film' as const, title: '既往片子', icon: '🎞️', desc: 'CT、X光、MRI等影像资料' },
  { type: 'summary' as const, title: '出院小结', icon: '📋', desc: '住院治疗的出院记录' },
  { type: 'implant' as const, title: '植入物证明', icon: '📄', desc: '植入物的型号和材质证明' },
  { type: 'other' as const, title: '其他资料', icon: '📎', desc: '检查单、转诊单等' },
];

const UploadPage = () => {
  const { elderMode, getHighestRisk, voiceEnabled, uploadFiles, addUploadFile, removeUploadFile, getFilesByType } = useAppStore();
  const [showEnhanceInfo, setShowEnhanceInfo] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const riskResult = getHighestRisk();

  useEffect(() => {
    return () => {
      if (!voiceEnabled) {
        stopSpeech();
      }
    };
  }, [voiceEnabled]);

  const handleChooseImage = async (type: string) => {
    try {
      const res = await Taro.chooseImage({
        count: 9,
        sizeType: ['compressed', 'original'],
        sourceType: ['album', 'camera'],
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const category = uploadCategories.find((c) => c.type === type);
        res.tempFilePaths.forEach((path, index) => {
          const now = Date.now();
          const file: UploadFile = {
            id: `file_${now}_${index}`,
            type: type as UploadFile['type'],
            fileName: `${category?.title || '资料'}_${index + 1}.jpg`,
            filePath: path,
            thumbPath: path,
            uploadTime: new Date(now).toLocaleString(),
            size: res.tempFiles?.[index]?.size || 0,
          };
          addUploadFile(file);
        });
        if (voiceEnabled) {
          speakText(`已上传${res.tempFilePaths.length}张图片`);
        }
        console.info('[Upload]', `成功选择 ${res.tempFilePaths.length} 张图片`);
      }
    } catch (e) {
      console.error('[Upload]', '选择图片失败:', e);
      Taro.showToast({
        title: '选择图片失败',
        icon: 'none',
      });
    }
  };

  const handleDeleteFile = (id: string, e) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这张资料吗？',
      success: (res) => {
        if (res.confirm) {
          removeUploadFile(id);
        }
      },
    });
  };

  const getCategoryCount = (type: string) => getFilesByType(type).length;

  const totalFiles = uploadFiles.length;

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>资料上传</Text>
        <Text className={styles.headerSubtitle}>上传既往资料，方便医生快速了解您的情况</Text>
      </View>

      <View className={styles.toggleWrap}>
        <ElderToggle />
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

      {totalFiles > 0 && (
        <View className={styles.statsCard}>
          <Text className={styles.statsText}>📁 已上传 <Text className={styles.statsNum}>{totalFiles}</Text> 份资料</Text>
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
            const files = getFilesByType(cat.type);
            return (
              <View key={cat.type} className={styles.uploadCard} onClick={() => handleChooseImage(cat.type)}>
                <Text className={styles.uploadCardIcon}>{cat.icon}</Text>
                <Text className={styles.uploadCardTitle}>{cat.title}</Text>
                <Text className={styles.uploadCardDesc}>{cat.desc}</Text>
                {files.length > 0 && (
                  <View className={styles.uploadBadge}>
                    <Text className={styles.uploadBadgeText}>{files.length}</Text>
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

      {uploadFiles.length > 0 && (
        <View className={styles.fileListSection}>
          <Text className={styles.sectionTitle}>已上传文件 ({uploadFiles.length})</Text>
          <View className={styles.fileList}>
            {uploadFiles.map((file) => {
              const category = uploadCategories.find((c) => c.type === file.type);
              return (
                <View key={file.id} className={styles.fileItem}>
                  <View className={styles.fileThumb}>
                    {file.thumbPath ? (
                      <Image
                        src={file.thumbPath}
                        mode="aspectFill"
                        className={styles.fileThumbImg}
                      />
                    ) : (
                      <Text className={styles.fileIcon}>📄</Text>
                    )}
                  </View>
                  <View className={styles.fileInfo}>
                    <Text className={styles.fileName}>{file.fileName}</Text>
                    <Text className={styles.fileMeta}>{category?.title || '其他'} · {file.uploadTime}</Text>
                  </View>
                  <View className={styles.fileDelete} onClick={(e) => handleDeleteFile(file.id, e)}>
                    <Text className={styles.fileDeleteText}>删除</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View className={styles.bottomAction}>
        <View
          className={classnames(styles.btnPrimary, uploadFiles.length === 0 && styles.btnDisabled)}
          onClick={() => {
            if (uploadFiles.length > 0) {
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
