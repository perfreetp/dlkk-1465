import Taro from '@tarojs/taro';

export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
};

export const formatFileSize = (size: number): string => {
  if (!size || size <= 0) return '未知';
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
};

export const getFileTypeLabel = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const map: Record<string, string> = {
    pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
    jpg: '图片', jpeg: '图片', png: '图片', gif: '图片', bmp: '图片', webp: '图片',
  };
  return map[ext] || ext.toUpperCase();
};

export const isPdfFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ext === 'pdf';
};

export const isDocFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
};

export const saveFilePermanently = async (tempPath: string): Promise<string> => {
  try {
    if (typeof Taro.saveFile === 'function') {
      const res = await Taro.saveFile({ tempFilePath: tempPath });
      console.info('[FileUtils]', '文件保存成功:', res.savedFilePath);
      return res.savedFilePath;
    }
    return tempPath;
  } catch (e) {
    console.error('[FileUtils]', '文件保存失败:', e);
    return tempPath;
  }
};

export const getAccessibleFilePath = (file: {
  filePath: string;
  permanentPath?: string;
  fileData?: string;
  fileName: string;
}): string => {
  if (file.permanentPath) return file.permanentPath;
  if (file.fileData) return file.fileData;
  return file.filePath;
};

export const previewImageFile = (
  currentUrl: string,
  allUrls: string[],
): void => {
  try {
    Taro.previewImage({
      current: currentUrl,
      urls: allUrls,
    });
  } catch (e) {
    console.error('[FileUtils]', '图片预览失败:', e);
    Taro.showToast({ title: '预览失败', icon: 'none' });
  }
};

export const openDocumentFile = async (
  filePath: string,
  fileType?: string,
  fileName?: string,
): Promise<void> => {
  try {
    const type = (fileType || '').toLowerCase();
    const typeLabelMap: Record<string, string> = {
      pdf: 'PDF', doc: 'Word', docx: 'Word',
      xls: 'Excel', xlsx: 'Excel',
      ppt: 'PPT', pptx: 'PPT',
    };
    const typeLabel = typeLabelMap[type] || '文档';
    const ext = type;

    try {
      const env = Taro.getEnv();

      if (env === Taro.ENV_TYPE.WEB && typeof window !== 'undefined') {
        try {
          const accessibleUrl = filePath.startsWith('http')
            ? filePath
            : (window.URL && window.URL.createObjectURL
                ? filePath
                : filePath);

          if (type === 'pdf') {
            window.open(accessibleUrl, '_blank', 'noopener,noreferrer');
            console.info('[FileUtils]', 'PDF预览：新窗口打开');
            Taro.showToast({ title: 'PDF 已在新窗口打开', icon: 'none' });
            return;
          }

          if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(type)) {
            Taro.showModal({
              title: `${typeLabel} 预览`,
              content: '浏览器无法直接预览 Office 文档，建议：\n1. 用 Microsoft Word/Excel/PowerPoint 打开\n2. 或用 WPS Office 查看\n3. 或上传 PDF 版本以便预览',
              confirmText: '尝试打开',
              cancelText: '知道了',
              success: (res) => {
                if (res.confirm) {
                  try {
                    if (accessibleUrl.startsWith('http') || accessibleUrl.startsWith('blob:')) {
                      const a = document.createElement('a');
                      a.href = accessibleUrl;
                      a.target = '_blank';
                      a.rel = 'noopener noreferrer';
                      if (fileName) {
                        a.download = fileName;
                      }
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } else {
                      window.open(accessibleUrl, '_blank', 'noopener,noreferrer');
                    }
                  } catch (e2) {
                    console.warn('[FileUtils]', 'H5打开失败:', e2);
                    Taro.showToast({ title: '已保存在资料箱，可到院后出示', icon: 'none' });
                  }
                }
              },
            });
            return;
          }

          window.open(accessibleUrl, '_blank', 'noopener,noreferrer');
          return;
        } catch (webErr) {
          console.warn('[FileUtils]', 'H5预览异常，降级:', webErr);
        }
      }

      if (typeof Taro.openDocument === 'function') {
        const fileTypeMap: Record<string, string> = {
          pdf: 'pdf',
          doc: 'doc', docx: 'doc',
          xls: 'xls', xlsx: 'xls',
          ppt: 'ppt', pptx: 'ppt',
        };

        try {
          const result = await Taro.openDocument({
            filePath,
            fileType: (fileTypeMap[ext] || undefined) as any,
            showMenu: true,
          });
          console.info('[FileUtils]', '文档打开成功');
          return result;
        } catch (openErr) {
          console.warn('[FileUtils]', 'openDocument 失败，尝试降级方案:', openErr);

          if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
            Taro.showModal({
              title: `${typeLabel} 预览`,
              content: `系统默认方式打不开该${typeLabel}，可尝试：\n1. 在微信中选择「用其他应用打开」\n2. 用 WPS 或 Office 应用打开\n3. 资料已保存在资料箱，到院后也可出示`,
              confirmText: '我知道了',
              showCancel: false,
            });
            return;
          }
          throw openErr;
        }
      } else {
        Taro.showModal({
          title: '文档预览',
          content: '当前环境不支持直接预览。\n\n资料已安全保存在资料箱中，到院后可以出示给护士查看，或在其他设备中打开。',
          confirmText: '知道了',
          showCancel: false,
        });
      }
    } catch (envErr) {
      console.warn('[FileUtils]', '环境处理失败，降级到通用提示:', envErr);
      Taro.showModal({
        title: '文档预览提示',
        content: '暂时无法预览此文件。\n\n📌 请放心：资料已安全保存在资料箱中，不会丢失，到院后可随时出示。',
        confirmText: '好的',
        showCancel: false,
      });
    }
  } catch (e) {
    console.error('[FileUtils]', '文档打开失败:', e);
    Taro.showModal({
      title: '文档预览提示',
      content: '暂时无法预览此文件。\n\n📌 请放心：资料已安全保存在资料箱中，不会丢失，到院后可随时出示。',
      confirmText: '好的',
      showCancel: false,
    });
  }
};

export const readFileAsBase64 = async (filePath: string): Promise<string | null> => {
  try {
    if (typeof Taro.getFileSystemManager === 'function') {
      const fs = Taro.getFileSystemManager();
      return new Promise((resolve) => {
        fs.readFile({
          filePath,
          encoding: 'base64',
          success: (res) => {
            resolve(res.data as string);
          },
          fail: () => {
            resolve(null);
          },
        });
      });
    }
    return null;
  } catch (e) {
    console.error('[FileUtils]', '读取文件失败:', e);
    return null;
  }
};
