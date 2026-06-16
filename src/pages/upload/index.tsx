import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { enhanceMRIInfo } from '@/data/questions';
import { speakText, stopSpeech, canUseSpeech } from '@/utils/riskAssess';
import ElderToggle from '@/components/ElderToggle';
import type { UploadFile } from '@/types/mri';
import styles from './index.module.scss';

const uploadCategories = [
  { type: 'film' as const, title: '既往片子', icon: '🎞️', desc: 'CT、X光、MRI等影像资料', accept: 'image' },
  { type: 'summary' as const, title: '出院小结', icon: '📋', desc: '住院治疗的出院记录', accept: 'all' },
  { type: 'implant' as const, title: '植入物证明', icon: '📄', desc: '植入物的型号和材质证明', accept: 'all' },
  { type: 'other' as const, title: '其他资料', icon: '📎', desc: '检查单、转诊单等', accept: 'all' },
];

const isImageFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
};

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
};

const getFileTypeLabel = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const map: Record<string, string> = {
    pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
    jpg: '图片', jpeg: '图片', png: '图片', gif: '图片', bmp: '图片', webp: '图片',
  };
  return map[ext] || ext.toUpperCase();
};

const UploadPage = () => {
  const { elderMode, getHighestRisk, voiceEnabled, uploadFiles, addUploadFile, removeUploadFile, getFilesByType } = useAppStore();
  const [showEnhanceInfo, setShowEnhanceInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const riskResult = getHighestRisk();
  const speechOk = canUseSpeech();

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
            id: `img_${now}_${index}`,
            type: type as UploadFile['type'],
            fileName: `${category?.title || '资料'}_${index + 1}.jpg`,
            filePath: path,
            thumbPath: path,
            uploadTime: new Date(now).toLocaleString('zh-CN'),
            size: res.tempFiles?.[index]?.size || 0,
          };
          addUploadFile(file);
        });
        if (voiceEnabled && speechOk) {
          speakText(`已上传${res.tempFilePaths.length}张图片`);
        }
        Taro.showToast({ title: `已上传${res.tempFilePaths.length}张`, icon: 'success' });
      }
    } catch (e) {
      console.error('[Upload]', '选择图片失败:', e);
    }
  };

  const handleChooseFile = async (type: string) => {
    try {
      const res = await Taro.chooseMessageFile({
        count: 5,
        type: 'all',
      });

      if (res.tempFiles && res.tempFiles.length > 0) {
        const category = uploadCategories.find((c) => c.type === type);
        res.tempFiles.forEach((file, index) => {
          const now = Date.now();
          const uploadFile: UploadFile = {
            id: `doc_${now}_${index}`,
            type: type as UploadFile['type'],
            fileName: file.name || `${category?.title || '资料'}_${index + 1}`,
            filePath: file.path,
            thumbPath: isImageFile(file.name || '') ? file.path : undefined,
            uploadTime: new Date(now).toLocaleString('zh-CN'),
            size: file.size || 0,
          };
          addUploadFile(uploadFile);
        });
        if (voiceEnabled && speechOk) {
          speakText(`已上传${res.tempFiles.length}个文件`);
        }
        Taro.showToast({ title: `已上传${res.tempFiles.length}个文件`, icon: 'success' });
      }
    } catch (e) {
      console.error('[Upload]', '选择文件失败:', e);
      handleChooseImage(type);
    }
  };

  const handleUpload = (type: string) => {
    const category = uploadCategories.find((c) => c.type === type);
    if (category?.accept === 'image') {
      handleChooseImage(type);
    } else {
      handleChooseFile(type);
    }
  };

  const handleDeleteFile = (id: string, e) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这份资料吗？',
      success: (res) => {
        if (res.confirm) {
          removeUploadFile(id);
        }
      },
    });
  };

  const handlePreviewImage = (filePath: string, e) => {
    e.stopPropagation();
    const allImageUrls = displayFiles
      .filter((f) => f.thumbPath)
      .map((f) => f.thumbPath || f.filePath);
    Taro.previewImage({
      current: filePath,
      urls: allImageUrls,
    });
  };

  const displayFiles = activeTab === 'all'
    ? uploadFiles
    : uploadFiles.filter((f) => f.type === activeTab);

  const totalFiles = uploadFiles.length;

  return (
    <ScrollView scrollY className={classnames(styles.container, elderMode && styles.elderMode)}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>资料上传</Text>
        <Text className={styles.headerSubtitle}>补传检查资料，医生到院前就能提前了解</Text>
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
          <View className={styles.statsRow}>
            <View className={styles.statsItem}>
              <Text className={styles.statsNum}>{totalFiles}</Text>
              <Text className={styles.statsLabel}>已上传</Text>
            </View>
            {uploadCategories.map((cat) => {
              const count = getFilesByType(cat.type).length;
              if (count === 0) return null;
              return (
                <View key={cat.type} className={styles.statsItem}>
                  <Text className={styles.statsNum}>{count}</Text>
                  <Text className={styles.statsLabel}>{cat.title}</Text>
                </View>
              );
            })}
          </View>
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
        <Text className={styles.sectionTitle}>📋 预审材料箱</Text>
        <View className={styles.uploadGrid}>
          {uploadCategories.map((cat) => {
            const files = getFilesByType(cat.type);
            return (
              <View key={cat.type} className={styles.uploadCard} onClick={() => handleUpload(cat.type)}>
                <Text className={styles.uploadCardIcon}>{cat.icon}</Text>
                <Text className={styles.uploadCardTitle}>{cat.title}</Text>
                <Text className={styles.uploadCardDesc}>{cat.desc}</Text>
                {files.length > 0 && (
                  <View className={styles.uploadBadge}>
                    <Text className={styles.uploadBadgeText}>{files.length}</Text>
                  </View>
                )}
                <View className={styles.uploadBtn}>
                  <Text className={styles.uploadBtnText}>+ 选择文件</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {totalFiles > 0 && (
        <View className={styles.fileListSection}>
          <View className={styles.fileListHeader}>
            <Text className={styles.sectionTitle}>📂 已上传资料 ({totalFiles})</Text>
          </View>

          <View className={styles.filterRow}>
            <View
              className={classnames(styles.filterItem, activeTab === 'all' && styles.filterActive)}
              onClick={() => setActiveTab('all')}
            >
              <Text className={styles.filterLabel}>全部</Text>
            </View>
            {uploadCategories.map((cat) => {
              const count = getFilesByType(cat.type).length;
              if (count === 0) return null;
              return (
                <View
                  key={cat.type}
                  className={classnames(styles.filterItem, activeTab === cat.type && styles.filterActive)}
                  onClick={() => setActiveTab(cat.type)}
                >
                  <Text className={styles.filterLabel}>{cat.title}</Text>
                </View>
              );
            })}
          </View>

          {displayFiles.length === 0 && activeTab !== 'all' ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📂</Text>
              <Text className={styles.emptyText}>该分类暂无资料</Text>
            </View>
          ) : (
            <View className={styles.fileList}>
              {displayFiles.map((file) => {
                const category = uploadCategories.find((c) => c.type === file.type);
                const isImg = !!file.thumbPath;
                return (
                  <View key={file.id} className={styles.fileItem}>
                    <View
                      className={styles.fileThumb}
                      onClick={(e) => isImg && handlePreviewImage(file.thumbPath || file.filePath, e)}
                    >
                      {isImg ? (
                        <Image
                          src={file.thumbPath}
                          mode="aspectFill"
                          className={styles.fileThumbImg}
                        />
                      ) : (
                        <View className={styles.fileTypeBadge}>
                          <Text className={styles.fileTypeText}>{getFileTypeLabel(file.fileName)}</Text>
                        </View>
                      )}
                    </View>
                    <View className={styles.fileInfo}>
                      <Text className={styles.fileName}>{file.fileName}</Text>
                      <Text className={styles.fileMeta}>{category?.title || '其他'} · {formatFileSize(file.size)} · {file.uploadTime}</Text>
                    </View>
                    <View className={styles.fileDelete} onClick={(e) => handleDeleteFile(file.id, e)}>
                      <Text className={styles.fileDeleteText}>删除</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      <View className={styles.bottomAction}>
        <View
          className={classnames(styles.btnPrimary, totalFiles === 0 && styles.btnDisabled)}
          onClick={() => {
            if (totalFiles > 0) {
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
