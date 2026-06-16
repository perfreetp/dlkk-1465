import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { enhanceMRIInfo } from '@/data/questions';
import { speakText, stopSpeech, canUseSpeech } from '@/utils/riskAssess';
import {
  isImageFile, formatFileSize, getFileTypeLabel,
  saveFilePermanently, previewImageFile, openDocumentFile,
  getAccessibleFilePath, isPdfFile, isDocFile,
} from '@/utils/fileUtils';
import ElderToggle from '@/components/ElderToggle';
import type { UploadFile } from '@/types/mri';
import styles from './index.module.scss';

const uploadCategories = [
  { type: 'film' as const, title: '既往片子', icon: '🎞️', desc: 'CT、X光、MRI等影像资料', accept: 'image' },
  { type: 'summary' as const, title: '出院小结', icon: '📋', desc: '住院治疗的出院记录', accept: 'all' },
  { type: 'implant' as const, title: '植入物证明', icon: '📄', desc: '植入物的型号和材质证明', accept: 'all' },
  { type: 'other' as const, title: '其他资料', icon: '📎', desc: '检查单、转诊单等', accept: 'all' },
];

const nurseCategories = [
  { type: 'film' as const, title: '既往片子', icon: '🎞️', required: true },
  { type: 'summary' as const, title: '出院小结', icon: '📋', required: true },
  { type: 'implant' as const, title: '植入物证明', icon: '📄', required: true },
];

const UploadPage = () => {
  const { elderMode, getHighestRisk, voiceEnabled, uploadFiles, addUploadFile, removeUploadFile, getFilesByType } = useAppStore();
  const [showEnhanceInfo, setShowEnhanceInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [showNurseOverview, setShowNurseOverview] = useState(true);

  const riskResult = getHighestRisk();
  const speechOk = canUseSpeech();

  const getLastUploadTime = (type: string): string => {
    const files = getFilesByType(type);
    if (files.length === 0) return '未上传';
    const last = files[files.length - 1];
    return last.uploadTime || '未知时间';
  };

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
        setSaving(true);
        const category = uploadCategories.find((c) => c.type === type);
        let successCount = 0;

        for (let i = 0; i < res.tempFilePaths.length; i++) {
          const path = res.tempFilePaths[i];
          const now = Date.now();
          const size = res.tempFiles?.[i]?.size || 0;

          let permanentPath: string | undefined;
          try {
            permanentPath = await saveFilePermanently(path);
          } catch (e) {
            console.warn('[Upload]', '持久化失败，使用临时路径:', e);
          }

          const file: UploadFile = {
            id: `img_${now}_${i}`,
            type: type as UploadFile['type'],
            fileName: `${category?.title || '资料'}_${i + 1}.jpg`,
            filePath: path,
            thumbPath: permanentPath || path,
            permanentPath,
            uploadTime: new Date(now).toLocaleString('zh-CN'),
            size,
          };
          addUploadFile(file);
          successCount++;
        }

        setSaving(false);
        if (voiceEnabled && speechOk) {
          speakText(`已上传${successCount}张图片`);
        }
        Taro.showToast({ title: `已上传${successCount}张`, icon: 'success' });
      }
    } catch (e) {
      setSaving(false);
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
        setSaving(true);
        const category = uploadCategories.find((c) => c.type === type);
        let successCount = 0;

        for (let i = 0; i < res.tempFiles.length; i++) {
          const fileInfo = res.tempFiles[i];
          const now = Date.now();
          const fileName = fileInfo.name || `${category?.title || '资料'}_${i + 1}`;

          let permanentPath: string | undefined;
          try {
            permanentPath = await saveFilePermanently(fileInfo.path);
          } catch (e) {
            console.warn('[Upload]', '文件持久化失败:', e);
          }

          const isImg = isImageFile(fileName);
          const file: UploadFile = {
            id: `doc_${now}_${i}`,
            type: type as UploadFile['type'],
            fileName,
            filePath: fileInfo.path,
            thumbPath: isImg ? (permanentPath || fileInfo.path) : undefined,
            permanentPath,
            uploadTime: new Date(now).toLocaleString('zh-CN'),
            size: fileInfo.size || 0,
          };
          addUploadFile(file);
          successCount++;
        }

        setSaving(false);
        if (voiceEnabled && speechOk) {
          speakText(`已上传${successCount}个文件`);
        }
        Taro.showToast({ title: `已上传${successCount}个文件`, icon: 'success' });
      }
    } catch (e) {
      setSaving(false);
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
          Taro.showToast({ title: '已删除', icon: 'none' });
        }
      },
    });
  };

  const handlePreviewFile = (file: UploadFile) => {
    const accessiblePath = getAccessibleFilePath(file);

    if (isImageFile(file.fileName)) {
      const allImageFiles = uploadFiles.filter((f) => isImageFile(f.fileName) && f.type === file.type);
      const allUrls = allImageFiles.map((f) => getAccessibleFilePath(f));
      previewImageFile(accessiblePath, allUrls);
      return;
    }

    if (isPdfFile(file.fileName) || isDocFile(file.fileName)) {
      const ext = file.fileName.toLowerCase().split('.').pop() || '';
      openDocumentFile(accessiblePath, ext, file.fileName);
      return;
    }

    Taro.showModal({
      title: '文件预览',
      content: '此类型暂不支持直接预览。\n\n📌 资料已安全保存，到院后可向护士出示。',
      confirmText: '好的',
      showCancel: false,
    });
  };

  const handleNurseCategoryClick = (type: string) => {
    setActiveTab(type);
    if (voiceEnabled && speechOk) {
      const cat = nurseCategories.find((c) => c.type === type);
      const count = getFilesByType(type).length;
      if (count === 0) {
        speakText(`${cat?.title}，暂未上传`);
      } else {
        speakText(`${cat?.title}，已上传${count}份，最后上传时间${getLastUploadTime(type)}`);
      }
    }
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

      <View
        className={styles.nurseOverviewCard}
        onClick={() => setShowNurseOverview(!showNurseOverview)}
      >
        <View className={styles.nurseOverviewHeader}>
          <Text className={styles.nurseOverviewIcon}>👩‍⚕️</Text>
          <View className={styles.nurseOverviewTitleWrap}>
            <Text className={styles.nurseOverviewTitle}>护士材料总览</Text>
            <Text className={styles.nurseOverviewSubtitle}>按分类汇总，缺料一目了然</Text>
          </View>
          <Text className={classnames(styles.nurseOverviewArrow, showNurseOverview && styles.nurseOverviewArrowOpen)}>▼</Text>
        </View>

        {showNurseOverview && (
          <View className={styles.nurseOverviewBody}>
            {nurseCategories.map((cat) => {
              const count = getFilesByType(cat.type).length;
              const lastTime = getLastUploadTime(cat.type);
              const missing = count === 0;
              return (
                <View
                  key={cat.type}
                  className={classnames(
                    styles.nurseCategoryItem,
                    missing && styles.nurseCategoryMissing,
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNurseCategoryClick(cat.type);
                  }}
                >
                  <View className={styles.nurseCategoryLeft}>
                    <Text className={styles.nurseCategoryIcon}>{cat.icon}</Text>
                    <View className={styles.nurseCategoryInfo}>
                      <View className={styles.nurseCategoryTitleRow}>
                        <Text className={styles.nurseCategoryTitle}>{cat.title}</Text>
                        {cat.required && missing && (
                          <Text className={styles.nurseCategoryBadgeMissing}>缺</Text>
                        )}
                        {cat.required && !missing && (
                          <Text className={styles.nurseCategoryBadgeOk}>齐</Text>
                        )}
                      </View>
                      <Text className={styles.nurseCategoryMeta}>
                        {count === 0 ? '未上传' : `共 ${count} 份`}
                      </Text>
                      {count > 0 && (
                        <Text className={styles.nurseCategoryTime}>最后上传：{lastTime}</Text>
                      )}
                    </View>
                  </View>
                  <View className={styles.nurseCategoryAction}>
                    <Text className={styles.nurseCategoryActionText}>
                      {count === 0 ? '去上传' : '查看文件'}
                    </Text>
                  </View>
                </View>
              );
            })}

            <View className={styles.nurseOverviewSummary}>
              <View className={styles.nurseSummaryRow}>
                <Text className={styles.nurseSummaryLabel}>必备材料</Text>
                <Text
                  className={classnames(
                    styles.nurseSummaryValue,
                    nurseCategories.every((c) => getFilesByType(c.type).length > 0)
                      ? styles.nurseSummaryOk
                      : styles.nurseSummaryWarn,
                  )}
                >
                  {nurseCategories.filter((c) => getFilesByType(c.type).length === 0).length === 0
                    ? '✅ 全部齐全'
                    : `⚠️ 缺 ${nurseCategories.filter((c) => getFilesByType(c.type).length === 0).length} 项`}
                </Text>
              </View>
              <View className={styles.nurseSummaryRow}>
                <Text className={styles.nurseSummaryLabel}>资料总数</Text>
                <Text className={styles.nurseSummaryValue}>{totalFiles} 份</Text>
              </View>
            </View>
          </View>
        )}
      </View>

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
                const canPreview = isImg || isPdfFile(file.fileName) || isDocFile(file.fileName);
                return (
                  <View
                    key={file.id}
                    className={classnames(styles.fileItem, canPreview && styles.fileItemClickable)}
                    onClick={() => canPreview && handlePreviewFile(file)}
                  >
                    <View className={styles.fileThumb}>
                      {isImg ? (
                        <Image
                          src={getAccessibleFilePath(file)}
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
                      <Text className={styles.fileMeta}>
                        {category?.title || '其他'} · {formatFileSize(file.size)} · {file.uploadTime}
                      </Text>
                      {canPreview && (
                        <Text className={styles.filePreviewTip}>点击查看</Text>
                      )}
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

      {saving && (
        <View className={styles.savingMask}>
          <View className={styles.savingBox}>
            <Text className={styles.savingIcon}>📥</Text>
            <Text className={styles.savingText}>正在保存资料...</Text>
          </View>
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
